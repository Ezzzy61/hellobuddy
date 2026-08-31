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

const API_URL = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(
  messages: { role: string; content: string }[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.ai.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: env.ai.openai.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 500,
      ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async chat(options: ChatOptions): Promise<ChatResult> {
    const messages = [
      { role: "system", content: options.systemPrompt },
      ...options.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const content = await callOpenAI(messages, {
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
    return callOpenAI(messages, { maxTokens: 300 });
  }

  async extractMemories(options: ExtractMemoriesOptions): Promise<ExtractedMemory[]> {
    const messages = [
      { role: "system", content: MEMORY_EXTRACTION_INSTRUCTIONS },
      {
        role: "user",
        content: `Existing memories (avoid duplicates):\n${(options.existingMemories ?? []).join("\n") || "(none)"}\n\nText to analyze:\n${options.text}\n\nRespond ONLY with a JSON object: { "memories": [{ "category": "...", "content": "...", "sourceExcerpt": "..." }] }`,
      },
    ];
    const raw = await callOpenAI(messages, { maxTokens: 600, jsonMode: true });
    return safeParseJsonArray(raw);
  }

  async reflect(options: ReflectOptions): Promise<string> {
    const messages = [
      { role: "system", content: options.instructions },
      { role: "user", content: options.context },
    ];
    return callOpenAI(messages, { maxTokens: 500 });
  }
}
