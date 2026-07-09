import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { db } from "../db.js";
import type { UserRow } from "../types.js";
import { signToken, requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

// Slow down brute-force attempts against auth endpoints specifically.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});
authRouter.use(authLimiter);

const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32)
    .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and periods."),
  displayName: z.string().trim().max(64).optional(),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
  }
  const { username, password } = parsed.data;
  const displayName = parsed.data.displayName?.length ? parsed.data.displayName : username;
  const usernameLower = username.toLowerCase();

  const existing = db.prepare("SELECT id FROM users WHERE lower(username) = ?").get(usernameLower);
  if (existing) {
    return res.status(409).json({ error: "That username is already taken." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    "INSERT INTO users (id, username, display_name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, username, displayName, passwordHash, createdAt);

  const user = { id, username, displayName };
  const token = signToken(user);
  res.status(201).json({ token, user });
});

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const { username, password } = parsed.data;
  const row = db
    .prepare("SELECT * FROM users WHERE lower(username) = ?")
    .get(username.toLowerCase()) as UserRow | undefined;

  // Constant-shape response whether the user exists or not, to avoid
  // leaking which usernames are registered via timing/response differences.
  const hashToCompare = row?.password_hash ?? "$2a$12$invalidsaltinvalidsaltinvalidsalOOOOOOOOOOOOOOOOOOOOOO";
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!row || !valid) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const user = { id: row.id, username: row.username, displayName: row.display_name };
  const token = signToken(user);
  res.json({ token, user });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
