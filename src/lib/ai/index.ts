import { env } from "@/lib/env";
import type { AIProvider, ChatOptions, ChatResult } from "@/lib/ai/types";
import { DemoProvider } from "@/lib/ai/providers/demo";
import { OpenAIProvider } from "@/lib/ai/providers/openai";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { GeminiProvider } from "@/lib/ai/providers/gemini";
import { GroqProvider } from "@/lib/ai/providers/groq";
import { OpenRouterProvider } from "@/lib/ai/providers/openrouter";
import { SambaNovaProvider } from "@/lib/ai/providers/sambanova";
import { CloudflareProvider } from "@/lib/ai/providers/cloudflare";
import { detectImminentRisk, SELF_HARM_CRISIS_RESPONSE } from "@/lib/ai/prompts";

const demo = new DemoProvider();

// Free-tier fallback chain: only providers whose free tier can NEVER result in
// a charge (no card on file, quota exhaustion just returns an error) belong
// here. Paid providers (OpenAI, Anthropic) are intentionally excluded from
// this auto-fallback chain and are only used if AI_PROVIDER explicitly
// selects them below.
function buildFreeProviderChain(): AIProvider[] {
  const chain: AIProvider[] = [];

  if (env.ai.groq.apiKey) {
    chain.push(new GroqProvider()); // primary Groq model
    if (env.ai.groq.secondaryModel) {
      // A second model on the SAME Groq account has its own independent
      // daily quota, so it acts as extra headroom once the primary model's
      // quota is exhausted for the day.
      chain.push(new GroqProvider(env.ai.groq.secondaryModel));
    }
  }
  if (env.ai.gemini.apiKey) {
    chain.push(new GeminiProvider());
  }
  if (env.ai.openrouter.apiKey) {
    chain.push(new OpenRouterProvider());
  }
  if (env.ai.sambanova.apiKey) {
    chain.push(new SambaNovaProvider());
  }
  if (env.ai.cloudflare.accountId && env.ai.cloudflare.apiToken) {
    chain.push(new CloudflareProvider());
  }

  return chain;
}

/**
 * Returns the first provider in the free fallback chain (used only where a
 * single "current provider" needs to be named, e.g. for display/logging).
 * `safeChat` below does NOT use this directly — it walks the whole chain.
 */
export function getAIProvider(): AIProvider {
  if (env.ai.provider === "openai" && env.ai.openai.apiKey) return new OpenAIProvider();
  if (env.ai.provider === "anthropic" && env.ai.anthropic.apiKey) return new AnthropicProvider();
  const chain = buildFreeProviderChain();
  return chain[0] ?? demo;
}

export async function safeChat(options: ChatOptions): Promise<ChatResult & { isCrisis?: boolean }> {
  const lastUserMessage = [...options.messages].reverse().find((m) => m.role === "user");
  if (lastUserMessage && detectImminentRisk(lastUserMessage.content)) {
    return { content: SELF_HARM_CRISIS_RESPONSE, isDemo: false, isCrisis: true };
  }

  if (env.ai.provider === "demo") {
    return demo.chat(options);
  }

  // Explicit opt-in to a paid provider bypasses the free chain entirely.
  const providers: AIProvider[] =
    env.ai.provider === "openai" && env.ai.openai.apiKey
      ? [new OpenAIProvider()]
      : env.ai.provider === "anthropic" && env.ai.anthropic.apiKey
        ? [new AnthropicProvider()]
        : buildFreeProviderChain();

  for (const provider of providers) {
    try {
      return await provider.chat(options);
    } catch (err) {
      console.error(`[ai] provider "${provider.name}" failed, trying next:`, err);
    }
  }

  const fallback = await demo.chat(options);
  return {
    ...fallback,
    content: `${fallback.content}\n\n(Note: all configured AI providers returned an error, so this is a demo fallback response.)`,
  };
}

export * from "@/lib/ai/types";
