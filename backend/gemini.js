// All communication with Google Gemini happens here, using the official @google/genai SDK.
import { GoogleGenAI } from "@google/genai";
import { SYSTEMS } from "./prompts.js";
import { toContents, parseJsonLoose } from "./utils.js";

let client;
export const hasKey = () => Boolean(process.env.GEMINI_API_KEY);
export const modelName = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

function ai() {
  if (!hasKey()) {
    const e = new Error("GEMINI_API_KEY is missing. Add it to your .env file (or to the Vercel environment variables) and restart.");
    e.status = 500;
    throw e;
  }
  return (client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));
}

// Turns SDK errors into short messages a student can understand.
export function friendly(e) {
  const m = String((e && e.message) || e);
  if (e && e.status === 500 && /GEMINI_API_KEY is missing/.test(m)) return m;
  if (/API key|API_KEY|PERMISSION_DENIED|403|401/i.test(m)) return "Gemini rejected the API key. Check GEMINI_API_KEY in your .env file.";
  if (/429|RESOURCE_EXHAUSTED|quota|rate/i.test(m)) return "Gemini’s free limit was reached. Wait a minute and try again.";
  if (/503|UNAVAILABLE|overloaded/i.test(m)) return "Gemini is busy right now. Please try again in a moment.";
  if (/SAFETY|blocked/i.test(m)) return "Gemini couldn’t answer that request. Try rephrasing it.";
  return "Gemini request failed: " + m.slice(0, 160);
}
export const statusOf = (e) => (/429|RESOURCE_EXHAUSTED|quota/i.test(String(e && e.message)) ? 429 : e && e.status === 500 ? 500 : 502);

// Streams the answer piece by piece.
export async function* streamChat({ messages, images, task }) {
  const stream = await ai().models.generateContentStream({
    model: modelName(),
    contents: toContents(messages, images),
    config: { systemInstruction: SYSTEMS[task] || SYSTEMS.chat },
  });
  for await (const chunk of stream) if (chunk.text) yield chunk.text;
}

// Quiz and timetable: Gemini answers in JSON mode.
export async function generateJson(prompt) {
  const r = await ai().models.generateContent({ model: modelName(), contents: prompt, config: { responseMimeType: "application/json" } });
  const t = r.text || "";
  if (!t.trim()) throw new Error("Gemini returned an empty answer.");
  try { return parseJsonLoose(t); } catch { const e = new Error("The AI returned an unexpected format. Please try again."); e.status = 502; e.plain = true; throw e; }
}

export async function generateTitle(text) {
  const r = await ai().models.generateContent({
    model: modelName(),
    contents: `Write a 3 to 7 word title for a study chat that begins with this message. Reply with the title only, no quotes.\n\n${text}`,
  });
  return (r.text || "").replace(/["\n]/g, "").trim().slice(0, 60);
}
