// ============================================================================
// Centralized, validated access to environment variables.
// The app must never crash at import time just because optional keys (AI,
// Google OAuth) are missing — those are checked lazily by feature-specific
// helpers. Only genuinely required-for-the-app-to-function values are
// asserted eagerly, and even Supabase falls back to a "not configured" state
// rather than throwing, so the UI can render a helpful message instead of a
// white screen.
// ============================================================================

export type AIProviderName = "openai" | "anthropic" | "gemini" | "groq" | "demo";

function readBool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    get isConfigured() {
      return Boolean(this.url && this.anonKey);
    },
  },
  google: {
    enabled: readBool(process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED, false),
  },
  ai: {
    provider: (process.env.AI_PROVIDER as AIProviderName) || "demo",
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY ?? "",
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY ?? "",
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      // A second, independently-quota'd free model on the same Groq account.
      // Used as a fallback once the primary model's daily quota is exhausted.
      secondaryModel: process.env.GROQ_MODEL_SECONDARY || "",
    },
    // OpenRouter: aggregates many providers' "<model>:free" variants behind one
    // OpenAI-compatible API. No card required to use free models; exceeding the
    // free quota just returns a 429, never a charge.
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY ?? "",
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
    },
    // SambaNova Cloud: free tier applies automatically as long as no payment
    // method is linked to the account — small quota (~20/day) but stacks.
    sambanova: {
      apiKey: process.env.SAMBANOVA_API_KEY ?? "",
      model: process.env.SAMBANOVA_MODEL || "Meta-Llama-3.3-70B-Instruct",
    },
    // Cloudflare Workers AI: 10,000 free "neurons"/day on any free Cloudflare
    // account, no card. Good for roughly 15-25 short chat replies/day.
    cloudflare: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
      apiToken: process.env.CLOUDFLARE_API_TOKEN ?? "",
      model: process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.1-8b-instruct",
    },
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    name: process.env.NEXT_PUBLIC_APP_NAME || "HelloBuddy",
  },
  usage: {
    freeDailyMessageLimit: Number(process.env.FREE_PLAN_DAILY_MESSAGE_LIMIT || 30),
  },
};

/** Returns whether a real (non-demo) AI provider has valid credentials configured. */
export function isAIConfigured(): boolean {
  const { provider } = env.ai;
  if (provider === "openai") return Boolean(env.ai.openai.apiKey);
  if (provider === "anthropic") return Boolean(env.ai.anthropic.apiKey);
  if (provider === "gemini") return Boolean(env.ai.gemini.apiKey);
  if (provider === "groq") return Boolean(env.ai.groq.apiKey);
  return false; // demo provider is "configured" by definition but callers treat it distinctly
}

export function effectiveAIProvider(): AIProviderName {
  if (env.ai.provider !== "demo" && isAIConfigured()) return env.ai.provider;
  return "demo";
}
