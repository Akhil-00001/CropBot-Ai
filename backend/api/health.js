// GET /api/health  ->  lets the frontend (and you) check the backend is up.
import { applyCors } from "../lib/cors.js";
import { activeProvider } from "../lib/llm.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return;
  res.status(200).json({ ok: true, provider: activeProvider() });
}
