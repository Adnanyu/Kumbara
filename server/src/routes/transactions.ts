import { Router } from "express";
import { z } from "zod";
import { Transactions } from "../db/collections.js";
import { requireAuth } from "../middleware/auth.js";
import type { TransactionDocument } from "../types.js";

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

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

transactionsRouter.get("/", async (req, res) => {
  const rows = await Transactions()
  .find({
    userId: req.user!.id,
  })
  .sort({
    date: -1,
  })
  .toArray();
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
  "Transfers",
  "Income",
  "Other",
] as const;

transactionsRouter.patch("/:id", async (req, res) => {
  const schema = z.object({ category: z.enum(CATEGORIES) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "A valid category is required." });
  }
  const result = await Transactions().updateOne(
    {
      _id: req.params.id,
      userId: req.user!.id,
    },
    {
      $set: {
        category: parsed.data.category,
        categoryOverridden: true,
      },
    }
  );
  if (result.matchedCount === 0) {
    return res.status(404).json({ error: "Transaction not found." });
  }
  res.json({ ok: true });
});