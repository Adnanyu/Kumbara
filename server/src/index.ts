import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRouter } from "./routes/auth.js";
import { documentsRouter } from "./routes/documents.js";
import { transactionsRouter } from "./routes/transactions.js";
import { assistantRouter } from "./routes/assistant.js";
import { initDatabase } from "./db/init.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(express.json({ limit: "5mb" })); // statements can produce many transaction rows per request

// Coarse global limiter in addition to the per-route limiters on auth/assistant.
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/assistant", assistantRouter);

// Centralized error handler so unexpected exceptions never leak stack traces.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end." });
});

// Initialize MongoDB before starting the server
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Kumbara API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas");
    console.error(err);
    process.exit(1);
  }
}
startServer();
