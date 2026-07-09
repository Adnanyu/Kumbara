import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";

export const assistantRouter = Router();
assistantRouter.use(requireAuth);

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You're sending messages too quickly. Please slow down." },
});
assistantRouter.use(assistantLimiter);

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const requestSchema = z.object({
  question: z.string().min(1).max(2000),
  context: z.record(z.any()),
  history: z.array(messageSchema).max(20).default([]),
});

assistantRouter.post("/", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error:
        "The assistant isn't configured yet. Set ANTHROPIC_API_KEY in server/.env to enable it (see README).",
    });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid assistant request." });
  }
  const { question, context, history } = parsed.data;

  const systemPrompt = `You are Kumbara's in-app finance assistant. You help the user understand their spending and give practical, general financial guidance (budgeting ideas, ways to trim specific categories, noticing risky trends). You are not a licensed financial advisor and you don't have knowledge of the user's full financial picture (debts, savings goals, income outside these statements) unless they tell you — ask a clarifying question when it matters instead of assuming. Keep answers concise, concrete, and grounded only in the data provided below. When you reference numbers, use the data given — never invent transactions or amounts. If the data doesn't answer the question, say so plainly.

User's aggregated transaction data (JSON):
${JSON.stringify(context)}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [...history, { role: "user", content: question }],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Anthropic API error:", response.status, detail);
      return res.status(502).json({ error: "The assistant couldn't respond right now. Please try again." });
    }

    const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n")
      .trim();

    res.json({ reply: text || "I wasn't able to generate a response — please try rephrasing your question." });
  } catch (err) {
    console.error("Assistant proxy failure:", err);
    res.status(502).json({ error: "The assistant couldn't respond right now. Please try again." });
  }
});
