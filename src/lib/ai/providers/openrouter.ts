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

// OpenRouter is OpenAI-compatible and aggregates many providers' "<model>:free"
// variants behind one API. Free models never require a card and never bill —
// exceeding the free daily/per-minute quota just returns a 429.
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.ai.openrouter.apiKey}`,
      // Recommended by OpenRouter for attribution/rankings; harmless if ignored.
      "HTTP-Referer": env.app.url,
      "X-Title": env.app.name,
    },
    body: JSON.stringify({
      model: env.ai.openrouter.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export class OpenRouterProvider implements AIProvider {
  readonly name = "openrouter";

  async chat(options: ChatOptions): Promise<ChatResult> {
    const messages = [
      { role: "system", content: options.systemPrompt },
      ...options.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const content = await callOpenRouter(messages, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });
    return { content, isDemo: false };
  }

  async summarize(options: SummarizeOptions): Promise<string> {
    const messages = [
      {
        role: "system",
        content: `You summarize text concisely and neutrally. ${options.instructions ?? ""}`,
      },
      { role: "user", content: options.text },
    ];
    return callOpenRouter(messages, { maxTokens: 300 });
  }

  async extractMemories(options: ExtractMemoriesOptions): Promise<ExtractedMemory[]> {
    const messages = [
      { role: "system", content: MEMORY_EXTRACTION_INSTRUCTIONS },
      {
        role: "user",
        content: `Existing memories (avoid duplicates):\n${(options.existingMemories ?? []).join("\n") || "(none)"}\n\nText to analyze:\n${options.text}\n\nRespond ONLY with a JSON object: { "memories": [{ "category": "...", "content": "...", "sourceExcerpt": "..." }] }`,
      },
    ];
    const raw = await callOpenRouter(messages, { maxTokens: 600, jsonMode: true });
    return safeParseJsonArray(raw);
  }

  async reflect(options: ReflectOptions): Promise<string> {
    const messages = [
      { role: "system", content: options.instructions },
      { role: "user", content: options.context },
    ];
    return callOpenRouter(messages, { maxTokens: 500 });
  }
}
