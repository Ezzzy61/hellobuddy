import { effectiveAIProvider } from "@/lib/env";
import type { AIProvider, ChatOptions, ChatResult } from "@/lib/ai/types";
import { DemoProvider } from "@/lib/ai/providers/demo";
import { OpenAIProvider } from "@/lib/ai/providers/openai";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { GroqProvider } from "@/lib/ai/providers/groq";
import { detectImminentRisk, SELF_HARM_CRISIS_RESPONSE } from "@/lib/ai/prompts";

const demo = new DemoProvider();

/**
 * Returns the active AI provider based on environment configuration.
 * Falls back to the demo provider automatically if no valid key is present
 * for the selected provider, so the app never requires AI credentials to run.
 */
export function getAIProvider(): AIProvider {
  const provider = effectiveAIProvider();
  switch (provider) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    default:
      return demo;
  }
}

/**
 * Safety-wrapped chat entry point used by every conversational surface in
 * the app (Talk, Confused mode). Always checks for imminent self-harm risk
 * BEFORE calling the model, and short-circuits to the crisis response if
 * detected — normal coaching must never proceed in that case. Also catches
 * provider errors (e.g. network/API failure) and degrades to the demo
 * response rather than surfacing a raw 500 to the user.
 */
export async function safeChat(options: ChatOptions): Promise<ChatResult & { isCrisis?: boolean }> {
  const lastUserMessage = [...options.messages].reverse().find((m) => m.role === "user");
  if (lastUserMessage && detectImminentRisk(lastUserMessage.content)) {
    return { content: SELF_HARM_CRISIS_RESPONSE, isDemo: false, isCrisis: true };
  }

  const provider = getAIProvider();
  try {
    return await provider.chat(options);
  } catch (err) {
    console.error(`[ai] provider "${provider.name}" failed, falling back to demo:`, err);
    const fallback = await demo.chat(options);
    return { ...fallback, content: `${fallback.content}\n\n(Note: the configured AI provider returned an error, so this is a demo fallback response.)` };
  }
}

export * from "@/lib/ai/types";
