import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { authRouter } from "./routes/auth.js";
import { documentsRouter } from "./routes/documents.js";
import { transactionsRouter } from "./routes/transactions.js";
import { assistantRouter } from "./routes/assistant.js";
import { initDatabase } from "./db/init.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
const IS_PROD = process.env.NODE_ENV === "production";

app.disable("x-powered-by");

// In prod, client is served from the same origin so CSP needs to allow
// the bundled JS/CSS. Adjust connectSrc if your assistant router calls
// an external LLM API directly from the browser (it shouldn't, but check).
app.use(
  helmet({
    contentSecurityPolicy: IS_PROD
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
          },
        }
      : false,
  })
);

// Same-origin in prod means CORS is basically a no-op there, but harmless to keep for local dev.
app.use(cors({ origin: CLIENT_ORIGIN, credentials: false }));
app.use(express.json({ limit: "5mb" }));

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

// Serve the built client in production. In dev, Vite's own dev server handles this.
if (IS_PROD) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end." });
});

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