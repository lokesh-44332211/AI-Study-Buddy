// Plain helper functions (no dependencies) so they are easy to read and test.
export const LIMITS = { messages: 80, chars: 150000, images: 4, imageBase64: 2_500_000, prompt: 12000, title: 800 };
const MIMES = ["image/jpeg", "image/png", "image/webp"];

// Checks the body of POST /api/chat. Returns { error } or { messages, images, task }.
export function validateChat(body) {
  const { messages, images = [], task = "chat" } = body || {};
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > LIMITS.messages) return { error: "Invalid conversation." };
  let total = 0;
  for (const m of messages) {
    if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string") return { error: "Invalid message format." };
    total += m.content.length;
  }
  if (total > LIMITS.chars) return { error: "The conversation and attached documents are too long. Start a new chat or attach smaller files." };
  if (messages[messages.length - 1].role !== "user") return { error: "The last message must be from the student." };
  if (!messages[messages.length - 1].content.trim()) return { error: "Empty message." };
  if (!Array.isArray(images) || images.length > LIMITS.images) return { error: "Too many images (maximum 4)." };
  for (const i of images) {
    if (!i || !MIMES.includes(i.mime) || typeof i.data !== "string" || i.data.length > LIMITS.imageBase64) return { error: "An image is invalid or too large." };
  }
  return { messages, images, task: task === "notes" ? "notes" : "chat" };
}

// Converts our messages to the format Gemini expects. Images go on the last student message.
export function toContents(messages, images = []) {
  const out = [];
  messages.forEach((m, idx) => {
    const role = m.role === "user" ? "user" : "model";
    const parts = [{ text: m.content }];
    if (idx === messages.length - 1) images.forEach((i) => parts.push({ inlineData: { mimeType: i.mime, data: i.data } }));
    const last = out[out.length - 1];
    if (last && last.role === role) last.parts.push(...parts); else out.push({ role, parts });
  });
  while (out.length && out[0].role !== "user") out.shift(); // Gemini wants the first turn to be the student's
  return out;
}

export function validatePrompt(body) {
  const p = body && body.prompt;
  if (typeof p !== "string" || !p.trim() || p.length > LIMITS.prompt) return { error: "Invalid request." };
  return { prompt: p };
}

export function parseJsonLoose(text) {
  return JSON.parse(String(text).replace(/```json|```/g, "").trim());
}
