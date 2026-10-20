// Groq provider. Used when GROQ_API_KEY is set.
import Groq from "groq-sdk";
import { ProviderError } from "./errors.js";

// List the models your key can use: GET https://api.groq.com/openai/v1/models
const MODEL = process.env.CROPBOT_MODEL || "openai/gpt-oss-120b";

let client;

export async function streamReply({ system, messages, onText }) {
  // Reads GROQ_API_KEY from the environment. Never hardcode the key.
  client ??= new Groq();

  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      // Groq uses the OpenAI format: the system prompt is the first message.
      messages: [{ role: "system", content: system }, ...messages],
      stream: true,
      max_completion_tokens: 8000,
      temperature: 0.3, // lower = more consistent, less "creative" farming advice
      // gpt-oss models reason before answering; "high" gave more careful farming answers in testing.
      ...(MODEL.startsWith("openai/gpt-oss") && { reasoning_effort: "high" }),
    });

    let finishReason = null;
    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (choice?.delta?.content) onText(choice.delta.content);
      if (choice?.finish_reason) finishReason = choice.finish_reason;
    }

    if (finishReason === "length") {
      onText("\n\n(Answer was cut short. Ask me to continue.)");
    }
  } catch (err) {
    if (err instanceof Groq.AuthenticationError) {
      throw new ProviderError("The Groq API key is invalid. Check GROQ_API_KEY.", 500);
    }
    if (err instanceof Groq.RateLimitError) {
      throw new ProviderError("Too many requests right now. Please try again in a minute.", 429);
    }
    if (err instanceof Groq.APIError) {
      throw new ProviderError(`AI service error (${err.status ?? "network"}). Please try again.`, 502);
    }
    throw err;
  }
}
