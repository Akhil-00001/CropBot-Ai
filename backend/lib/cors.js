// The frontend is hosted separately, so the browser needs CORS headers.
// ALLOWED_ORIGINS is a comma-separated list, e.g.
//   ALLOWED_ORIGINS=http://localhost:5173,https://cropbot-frontend.vercel.app
const allowed = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Sets CORS headers. Returns true if the request was a preflight that has
// already been answered.
export function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (allowed.includes(origin) || allowed.includes("*"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}
