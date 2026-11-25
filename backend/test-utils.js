// Offline self-test of the request checks and the Gemini message conversion (no API key needed): npm test
import assert from "node:assert/strict";
import { validateChat, toContents, validatePrompt, parseJsonLoose } from "./utils.js";

assert.ok(validateChat({ messages: [{ role: "user", content: "hi" }] }).messages);
assert.ok(validateChat({}).error);
assert.ok(validateChat({ messages: [{ role: "assistant", content: "x" }] }).error);
assert.ok(validateChat({ messages: [{ role: "user", content: "x" }], images: [{ mime: "text/html", data: "a" }] }).error);
assert.equal(validateChat({ messages: [{ role: "user", content: "x" }], task: "notes" }).task, "notes");
const c = toContents([{ role: "assistant", content: "old" }, { role: "user", content: "a" }, { role: "user", content: "b" }, { role: "assistant", content: "c" }, { role: "user", content: "d" }], [{ mime: "image/jpeg", data: "AAA" }]);
assert.equal(c[0].role, "user"); assert.equal(c[0].parts.length, 2); assert.equal(c.at(-1).parts[1].inlineData.data, "AAA");
assert.ok(validatePrompt({ prompt: "" }).error);
assert.deepEqual(parseJsonLoose("```json\n[1,2]\n```"), [1, 2]);
console.log("All backend self-tests passed.");
