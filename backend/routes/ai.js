import { Router } from "express";
import { validateChat, validatePrompt } from "../utils.js";
import { streamChat, generateJson, generateTitle, friendly, statusOf, hasKey, modelName } from "../gemini.js";

const router = Router();
const fail = (res, e) => res.status(e && e.plain ? 502 : statusOf(e)).json({ error: e && e.plain ? e.message : friendly(e) });

// Used by the README test: open http://localhost:3000/api/health
router.get("/health", (req, res) => res.json({ ok: true, geminiKeyFound: hasKey(), model: modelName() }));

// AI Doubt Solver, Topic Explainer, file questions and Notes Generator (streamed as newline-delimited JSON).
router.post("/chat", async (req, res) => {
  const v = validateChat(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try {
    const it = streamChat(v)[Symbol.asyncIterator]();
    const first = await it.next(); // wait for the first piece so real errors still get a proper status code
    if (first.done) return res.status(502).json({ error: "Gemini returned an empty answer. Please try again." });
    res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
    res.write(JSON.stringify({ t: first.value }) + "\n");
    for (let n = await it.next(); !n.done; n = await it.next()) res.write(JSON.stringify({ t: n.value }) + "\n");
    res.end();
  } catch (e) {
    if (!res.headersSent) return fail(res, e);
    res.write(JSON.stringify({ error: friendly(e) }) + "\n");
    res.end();
  }
});

// Quiz Generator and Study Timetable.
router.post("/json", async (req, res) => {
  const v = validatePrompt(req.body);
  if (v.error) return res.status(400).json({ error: v.error });
  try { res.json({ data: await generateJson(v.prompt) }); } catch (e) { fail(res, e); }
});

// Short automatic chat titles.
router.post("/title", async (req, res) => {
  const t = req.body && req.body.text;
  if (typeof t !== "string" || !t.trim() || t.length > 800) return res.status(400).json({ error: "Invalid request." });
  try { res.json({ title: await generateTitle(t) }); } catch (e) { fail(res, e); }
});

export default router;
