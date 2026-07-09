import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import type { TransactionRow } from "../types.js";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

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

transactionsRouter.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC")
    .all(req.user!.id) as TransactionRow[];
  res.json({ transactions: rows.map(serializeTxn) });
});

const CATEGORIES = [
  "Shopping",
  "Grocery",
  "Gaming",
  "Beauty",
  "Gas",
  "Subscriptions",
  "Insurance",
  "Dining",
  "Transport",
  "Utilities",
  "Health",
  "Entertainment",
  "Housing",
  "Income",
  "Other",
] as const;

transactionsRouter.patch("/:id", (req, res) => {
  const schema = z.object({ category: z.enum(CATEGORIES) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A valid category is required." });
  }
  const result = db
    .prepare("UPDATE transactions SET category = ?, category_overridden = 1 WHERE id = ? AND user_id = ?")
    .run(parsed.data.category, req.params.id, req.user!.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Transaction not found." });
  }
  res.json({ ok: true });
});
