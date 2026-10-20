// Local development server for the API. It routes requests to the same
// handlers Vercel runs from api/, so local and deployed behaviour match.
// Run with:  npm start   (reads the API key from .env)
import http from "node:http";
import chatHandler from "./api/chat.js";
import healthHandler from "./api/health.js";
import { activeProvider } from "./lib/llm.js";

const PORT = Number(process.env.PORT) || 3001;
const ROUTES = { "/api/chat": chatHandler, "/api/health": healthHandler };

// Small shim so the Vercel-style handlers (res.status().json()) work here too.
function vercelify(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100_000) throw new Error("Body too large");
  }
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  vercelify(res);
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const handler = ROUTES[pathname];
  if (!handler) return res.status(404).json({ error: "Not found" });

  if (req.method === "POST") {
    try {
      req.body = await readJson(req);
    } catch {
      return res.status(400).json({ error: "Invalid JSON." });
    }
  }
  return handler(req, res);
});

server.listen(PORT, () => {
  console.log(`CropBot API running at http://localhost:${PORT}`);
  const provider = activeProvider();
  if (provider) console.log(`AI provider: ${provider}`);
  else console.warn("Warning: no AI key set. Copy .env.example to .env and add GROQ_API_KEY (or ANTHROPIC_API_KEY).");
});
