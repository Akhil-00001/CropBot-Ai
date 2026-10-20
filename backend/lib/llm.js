// Picks the AI provider from whichever API key is set in the environment.
// Each provider in lib/providers/ exports the same streamReply() function:
//   streamReply({ system, messages: [{ role, content }], onText })
// To add another provider (Gemini, OpenAI, ...), add a file there and a line below.
import * as groq from "./providers/groq.js";
import * as anthropic from "./providers/anthropic.js";
import { ProviderError } from "./providers/errors.js";

export { ProviderError };

export function activeProvider() {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

export async function streamReply(args) {
  const provider = activeProvider();
  if (provider === "groq") return groq.streamReply(args);
  if (provider === "anthropic") {
    if (process.env.ANTHROPIC_API_KEY.startsWith("gsk_")) {
      throw new ProviderError("ANTHROPIC_API_KEY holds a Groq key (gsk_...). Rename it to GROQ_API_KEY in .env.", 500);
    }
    return anthropic.streamReply(args);
  }
  throw new ProviderError("No AI API key is set on the server. Add GROQ_API_KEY or ANTHROPIC_API_KEY.", 500);
}
