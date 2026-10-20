// POST /api/chat  ->  streams the reply back as plain text.
// Runs as a Vercel serverless function, and locally through server.js.
import { applyCors } from "../lib/cors.js";
import { DISTRICT_NAMES } from "../lib/districts.js";
import { SYSTEM_PROMPT, farmerContext } from "../lib/prompt.js";
import { streamReply, ProviderError } from "../lib/llm.js";

const MAX_TURNS = 12;          // only the last few messages are sent, to bound cost
const MAX_MESSAGE_CHARS = 2000;
const ALTITUDES = ["Plains / valley (below 1000 m)", "Mid hills (1000-2000 m)", "High hills (above 2000 m)", "Not sure"];
const IRRIGATION = ["Irrigated", "Rain-fed", "Partly irrigated", "Not sure"];
const LANGUAGES = ["English", "Hindi"];

function pick(value, allowed) {
  return allowed.includes(value) ? value : undefined;
}

function cleanText(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Returns either { error } or { profile, messages } ready for the model.
export function validate(body) {
  if (!body || typeof body !== "object") return { error: "Invalid request body." };

  const profile = {
    district: pick(body.profile?.district, DISTRICT_NAMES),
    altitude: pick(body.profile?.altitude, ALTITUDES),
    irrigation: pick(body.profile?.irrigation, IRRIGATION),
    crop: cleanText(body.profile?.crop, 60),
    language: pick(body.profile?.language, LANGUAGES) || "English",
  };
  if (!profile.district) return { error: "Please choose your district." };

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return { error: "No question was sent." };
  }

  const messages = body.messages
    .slice(-MAX_TURNS)
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: cleanText(m.content, MAX_MESSAGE_CHARS) }))
    .filter((m) => m.content);

  // The conversation must start with the farmer and end with the farmer.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages.at(-1).role !== "user") {
    return { error: "The last message must be the farmer's question." };
  }

  const last = messages.at(-1);
  last.content = `${farmerContext(profile)}\n\n${last.content}`;
  return { profile, messages };
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const { error, messages } = validate(req.body);
  if (error) return res.status(400).json({ error });

  let started = false;
  try {
    await streamReply({
      system: SYSTEM_PROMPT,
      messages,
      onText(text) {
        if (!started) {
          res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Accel-Buffering": "no",
          });
          started = true;
        }
        res.write(text);
      },
    });
    if (!started) res.status(200).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end();
  } catch (err) {
    console.error("[api/chat]", err);
    const message = err instanceof ProviderError ? err.message : "Something went wrong. Please try again.";
    if (started) {
      // Headers are already sent; append the error to the streamed text.
      res.end(`\n\n[Error: ${message}]`);
    } else {
      res.status(err instanceof ProviderError ? err.status : 500).json({ error: message });
    }
  }
}
