// Entry point. Run locally with:  npm start      (Vercel imports this same app through api/index.js)
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import aiRoutes from "./backend/routes/ai.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "4mb" })); // Vercel allows about 4.5 MB per request

// Protects your Gemini quota if the site is public: 40 AI requests per minute per visitor.
app.use("/api", rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { error: "Too many requests. Please wait a minute and try again." } }));
app.use("/api", aiRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "Unknown API route." }));

app.use(express.static(path.join(__dirname, "frontend"))); // the website itself

app.use((err, req, res, next) => {
  if (err && err.type === "entity.too.large") return res.status(413).json({ error: "Your files are too large to send. Try fewer or smaller attachments." });
  if (err instanceof SyntaxError) return res.status(400).json({ error: "Invalid request." });
  console.error(err);
  res.status(500).json({ error: "Server error. Please try again." });
});

const PORT = process.env.PORT || 3000;
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`\nAI Study Buddy is running:  http://localhost:${PORT}`);
    console.log(process.env.GEMINI_API_KEY ? "Gemini API key found." : "WARNING: GEMINI_API_KEY is missing. Create a .env file (see README).");
  });
}
export default app;
