import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Documents, Transactions } from "../db/collections.js";
import type {
  DocumentDocument,
  TransactionDocument,
} from "../types.js";

export const documentsRouter = Router();
documentsRouter.use(requireAuth);

function serializeDoc(row: DocumentDocument) {
  return {
    id: row._id,
    name: row.name,
    type: row.type,
    uploadedAt: row.uploadedAt,
    included: row.included,
    transactionCount: row.transactionCount,
    status: row.status,
    note: row.note ?? undefined,
  };
}

function serializeTxn(row: TransactionDocument) {
  return {
    id: row._id,
    docId: row.docId,
    date: row.date,
    description: row.description,
    merchant: row.merchant,
    amount: row.amount,
    category: row.category,
    categoryOverridden: row.categoryOverridden,
  };
}

documentsRouter.get("/", async (req, res) => {
  const rows = await Documents()
  .find({
    userId: req.user!.id,
  })
  .sort({
    uploadedAt: -1,
  })
  .toArray();
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
documentsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0]?.message ?? "Invalid document payload.",
    });
  }

  const { name, type, note, transactions } = parsed.data;

  const userId = req.user!.id;
  const docId = randomUUID();
  const uploadedAt = new Date().toISOString();
  const status: "ready" | "issue" = transactions.length > 0 ? "ready" : "issue";

  const doc = {
    _id: docId,
    userId,
    name,
    type,
    uploadedAt,
    included: true,
    transactionCount: transactions.length,
    status,
    note: note ?? null,
  };

  await Documents().insertOne(doc);

  if (transactions.length) {
    await Transactions().insertMany(
      transactions.map((t) => ({
        _id: randomUUID(),
        userId,
        docId,
        date: t.date,
        description: t.description,
        merchant: t.merchant,
        amount: t.amount,
        category: t.category,
        categoryOverridden: false,
      }))
    );
  }

  res.status(201).json({
    document: serializeDoc(doc),
  });
});

documentsRouter.patch("/:id", async (req, res) => {
  const schema = z.object({ included: z.boolean() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "included must be a boolean." });
  }
  const result = await Documents().updateOne(
    {
      _id: req.params.id,
      userId: req.user!.id,
    },
    {
      $set: {
        included: parsed.data.included,
      },
    }
  );
  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Document not found." });
  }
  res.json({ ok: true });
});

documentsRouter.delete("/:id", async (req, res) => {
  const result = await Documents().deleteOne({
      _id: req.params.id,
      userId: req.user!.id,
  });

  if (result.deletedCount === 0) {
      return res.status(404).json({
          error: "Document not found."
      });
  }

  await Transactions().deleteMany({
      docId: req.params.id,
      userId: req.user!.id,
  });

  res.json({ ok: true });
});

export { serializeTxn };
