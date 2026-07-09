import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import type { DocumentRow, TransactionRow } from "../types.js";

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

function serializeDoc(row: DocumentRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    uploadedAt: row.uploaded_at,
    included: !!row.included,
    transactionCount: row.transaction_count,
    status: row.status,
    note: row.note ?? undefined,
  };
}

function serializeTxn(row: TransactionRow) {
  return {
    id: row.id,
    docId: row.doc_id,
    date: row.date,
    description: row.description,
    merchant: row.merchant,
    amount: row.amount,
    category: row.category,
    categoryOverridden: !!row.category_overridden,
  };
}

documentsRouter.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC")
    .all(req.user!.id) as DocumentRow[];
  res.json({ documents: rows.map(serializeDoc) });
});

const txnSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1).max(500),
  merchant: z.string().min(1).max(200),
  amount: z.number().finite(),
  category: z.string().min(1).max(50),
});

const createSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["csv", "xlsx", "pdf"]),
  note: z.string().max(1000).optional(),
  transactions: z.array(txnSchema).max(20000),
});

// Creates a document record plus all of its parsed transactions in one
// transaction so the two never get out of sync.
documentsRouter.post("/", (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid document payload." });
  }
  const { name, type, note, transactions } = parsed.data;
  const userId = req.user!.id;
  const docId = randomUUID();
  const uploadedAt = new Date().toISOString();
  const status = transactions.length > 0 ? "ready" : "issue";

  const insertDoc = db.prepare(
    `INSERT INTO documents (id, user_id, name, type, uploaded_at, included, transaction_count, status, note)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`
  );
  const insertTxn = db.prepare(
    `INSERT INTO transactions (id, user_id, doc_id, date, description, merchant, amount, category, category_overridden)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`
  );

  const run = db.transaction(() => {
    insertDoc.run(docId, userId, name, type, uploadedAt, transactions.length, status, note ?? null);
    for (const t of transactions) {
      insertTxn.run(randomUUID(), userId, docId, t.date, t.description, t.merchant, t.amount, t.category);
    }
  });
  run();

  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(docId) as DocumentRow;
  res.status(201).json({ document: serializeDoc(doc) });
});

documentsRouter.patch("/:id", (req, res) => {
  const schema = z.object({ included: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "included must be a boolean." });
  }
  const result = db
    .prepare("UPDATE documents SET included = ? WHERE id = ? AND user_id = ?")
    .run(parsed.data.included ? 1 : 0, req.params.id, req.user!.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Document not found." });
  }
  res.json({ ok: true });
});

documentsRouter.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM documents WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user!.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Document not found." });
  }
  res.json({ ok: true });
});

export { serializeTxn };
