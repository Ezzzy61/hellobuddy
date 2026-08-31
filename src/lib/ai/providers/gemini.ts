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

function apiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.ai.gemini.apiKey}`;
}

async function callGemini(
  systemInstruction: string,
  contents: { role: string; parts: { text: string }[] }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(apiUrl(env.ai.gemini.model), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 500,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async chat(options: ChatOptions): Promise<ChatResult> {
    const contents = options.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const content = await callGemini(options.systemPrompt, contents, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });
    return { content, isDemo: false };
  }

  async summarize(options: SummarizeOptions): Promise<string> {
    return callGemini(
      `You summarize text concisely and neutrally. ${options.instructions ?? ""}`,
      [{ role: "user", parts: [{ text: options.text }] }],
      { maxTokens: 300 }
    );
  }

  async extractMemories(options: ExtractMemoriesOptions): Promise<ExtractedMemory[]> {
    const raw = await callGemini(
      MEMORY_EXTRACTION_INSTRUCTIONS,
      [
        {
          role: "user",
          parts: [
            {
              text: `Existing memories (avoid duplicates):\n${(options.existingMemories ?? []).join("\n") || "(none)"}\n\nText to analyze:\n${options.text}\n\nRespond ONLY with a JSON object: { "memories": [{ "category": "...", "content": "...", "sourceExcerpt": "..." }] }`,
            },
          ],
        },
      ],
      { maxTokens: 600 }
    );
    return safeParseJsonArray(raw);
  }

  async reflect(options: ReflectOptions): Promise<string> {
    return callGemini(options.instructions, [{ role: "user", parts: [{ text: options.context }] }], {
      maxTokens: 500,
    });
  }
}
