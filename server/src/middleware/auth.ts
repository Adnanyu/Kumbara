import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AuthedRequestUser } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in the environment (see .env.example).");
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedRequestUser;
    }
  }
}

export function signToken(user: AuthedRequestUser): string {
  return jwt.sign(user, JWT_SECRET!, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header." });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as AuthedRequestUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}
