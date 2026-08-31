import { env } from "@/lib/env";
import type {
  AIProvider,
  ChatOptions,
  ChatResult,
  ExtractedMemory,
  ExtractMemoriesOptions,
  ReflectOptions,
  SummarizeOptions,
} from "@/lib/ai/types";
import { MEMORY_EXTRACTION_INSTRUCTIONS } from "@/lib/ai/prompts";
import { safeParseJsonArray } from "@/lib/ai/json-utils";

const API_URL = "https://api.anthropic.com/v1/messages";

async function callAnthropic(
  system: string,
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ai.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: env.ai.anthropic.model,
      system,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async chat(options: ChatOptions): Promise<ChatResult> {
    const messages = options.messages.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    const content = await callAnthropic(options.systemPrompt, messages, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });
    return { content, isDemo: false };
  }

  async summarize(options: SummarizeOptions): Promise<string> {
    return callAnthropic(
      `You summarize text concisely and neutrally. ${options.instructions ?? ""}`,
      [{ role: "user", content: options.text }],
      { maxTokens: 300 }
    );
  }

  async extractMemories(options: ExtractMemoriesOptions): Promise<ExtractedMemory[]> {
    const raw = await callAnthropic(
      MEMORY_EXTRACTION_INSTRUCTIONS,
      [
        {
          role: "user",
          content: `Existing memories (avoid duplicates):\n${(options.existingMemories ?? []).join("\n") || "(none)"}\n\nText to analyze:\n${options.text}\n\nRespond ONLY with a JSON object: { "memories": [{ "category": "...", "content": "...", "sourceExcerpt": "..." }] }`,
        },
      ],
      { maxTokens: 600 }
    );
    return safeParseJsonArray(raw);
  }

  async reflect(options: ReflectOptions): Promise<string> {
    return callAnthropic(options.instructions, [{ role: "user", content: options.context }], {
      maxTokens: 500,
    });
  }
}
