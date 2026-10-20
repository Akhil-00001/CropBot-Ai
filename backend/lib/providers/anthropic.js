// Claude (Anthropic) provider. Used when ANTHROPIC_API_KEY is set.
import Anthropic from "@anthropic-ai/sdk";
import { ProviderError } from "./errors.js";

const MODEL = process.env.CROPBOT_MODEL || "claude-opus-5-5";

let client;

export async function streamReply({ system, messages, onText }) {
  // Reads ANTHROPIC_API_KEY from the environment. Never hardcode the key.
  client ??= new Anthropic();

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 8000,
      // Effort controls how long the model thinks. "medium" keeps replies
      // reasonably fast for a chat; try "high" if answers feel shallow.
      output_config: { effort: "medium" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages,
      // If a safety classifier declines, retry on Anthropic's recommended model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        onText(event.delta.text);
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      onText("\n\nSorry, I can't help with that request. Please ask a farming question.");
    } else if (final.stop_reason === "max_tokens") {
      onText("\n\n(Answer was cut short. Ask me to continue.)");
    }
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new ProviderError("The Anthropic API key is invalid. Check ANTHROPIC_API_KEY.", 500);
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new ProviderError("Too many requests right now. Please try again in a minute.", 429);
    }
    if (err instanceof Anthropic.APIError) {
      throw new ProviderError(`AI service error (${err.status ?? "network"}). Please try again.`, 502);
    }
    throw err;
  }
}
