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

// Cloudflare Workers AI: 10,000 free "neurons"/day on any free Cloudflare
// account (no card, no waitlist). Not OpenAI-shaped — its own tiny REST API.
// Good for roughly 15-25 short chat replies/day, so it's the last resort
// before demo mode rather than a primary provider.
function apiUrl(model: string) {
  return `https://api.cloudflare.com/client/v4/accounts/${env.ai.cloudflare.accountId}/ai/run/${model}`;
}

async function callCloudflare(
  messages: { role: string; content: string }[],
  options?: { maxTokens?: number }
): Promise<string> {
  const res = await fetch(apiUrl(env.ai.cloudflare.model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.ai.cloudflare.apiToken}`,
    },
    body: JSON.stringify({
      messages,
      max_tokens: options?.maxTokens ?? 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Cloudflare Workers AI request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.success === false) {
    throw new Error(`Cloudflare Workers AI error: ${JSON.stringify(data.errors ?? data)}`);
  }
  return data.result?.response ?? "";
}

export class CloudflareProvider implements AIProvider {
  readonly name = "cloudflare";

  async chat(options: ChatOptions): Promise<ChatResult> {
    const messages = [
      { role: "system", content: options.systemPrompt },
      ...options.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const content = await callCloudflare(messages, { maxTokens: options.maxTokens });
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
    return callCloudflare(messages, { maxTokens: 300 });
  }

  async extractMemories(options: ExtractMemoriesOptions): Promise<ExtractedMemory[]> {
    const messages = [
      { role: "system", content: MEMORY_EXTRACTION_INSTRUCTIONS },
      {
        role: "user",
        content: `Existing memories (avoid duplicates):\n${(options.existingMemories ?? []).join("\n") || "(none)"}\n\nText to analyze:\n${options.text}\n\nRespond ONLY with a JSON object: { "memories": [{ "category": "...", "content": "...", "sourceExcerpt": "..." }] }`,
      },
    ];
    const raw = await callCloudflare(messages, { maxTokens: 600 });
    return safeParseJsonArray(raw);
  }

  async reflect(options: ReflectOptions): Promise<string> {
    const messages = [
      { role: "system", content: options.instructions },
      { role: "user", content: options.context },
    ];
    return callCloudflare(messages, { maxTokens: 500 });
  }
}
