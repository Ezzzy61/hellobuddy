import type {
  AIProvider,
  ChatOptions,
  ChatResult,
  ExtractedMemory,
  ExtractMemoriesOptions,
  ReflectOptions,
  SummarizeOptions,
} from "@/lib/ai/types";

/**
 * Demo provider used when no AI API key is configured. It never crashes the
 * app and always clearly labels itself so users understand they're seeing a
 * placeholder rather than a real response. This lets the entire product be
 * explored end-to-end with zero credentials.
 */
export class DemoProvider implements AIProvider {
  readonly name = "demo";

  async chat(options: ChatOptions): Promise<ChatResult> {
    const lastUserMessage = [...options.messages].reverse().find((m) => m.role === "user");
    const excerpt = lastUserMessage?.content?.slice(0, 140) ?? "";

    const content = `Buddy (demo mode — no AI provider is configured yet): I heard you say "${excerpt}${
      excerpt.length === 140 ? "…" : ""
    }". In a fully configured version of HelloBuddy, I'd reflect that back thoughtfully and ask a follow-up question grounded in what you've shared before. To enable real conversations, add an AI_PROVIDER and matching API key in your environment variables. Does this feel like a fair placeholder for now?`;

    return { content, isDemo: true };
  }

  async summarize(options: SummarizeOptions): Promise<string> {
    const words = options.text.trim().split(/\s+/).slice(0, 40).join(" ");
    return `Demo summary (no AI provider configured): ${words}${
      options.text.split(/\s+/).length > 40 ? "…" : ""
    }`;
  }

  async extractMemories(options: ExtractMemoriesOptions): Promise<ExtractedMemory[]> {
    // Heuristic, deterministic "extraction" so My Story / journal reflection
    // still demonstrates the review-and-approve flow without a real model.
    const sentences = options.text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25 && s.length < 240);

    const keywordCategory: Array<{ pattern: RegExp; category: ExtractedMemory["category"] }> = [
      { pattern: /\b(goal|want to|hope to|plan to|working toward)\b/i, category: "goals" },
      { pattern: /\b(mother|father|partner|friend|sister|brother|spouse|husband|wife)\b/i, category: "relationships" },
      { pattern: /\b(value|matters to me|important to me|believe in)\b/i, category: "values" },
      { pattern: /\b(prefer|like it when|dislike|don't like)\b/i, category: "preferences" },
      { pattern: /\b(job|career|work|company|business)\b/i, category: "about_me" },
    ];

    const results: ExtractedMemory[] = [];
    for (const sentence of sentences) {
      const match = keywordCategory.find((k) => k.pattern.test(sentence));
      if (match && results.length < 5) {
        results.push({
          category: match.category,
          content: `The user shared: "${sentence}"`,
          sourceExcerpt: sentence,
        });
      }
    }
    return results;
  }

  async reflect(options: ReflectOptions): Promise<string> {
    return `Demo reflection (no AI provider configured): Based on what you've shared, there may be a few threads worth noticing here. Does this resonate with you? Once a real AI provider is connected, this section will generate a grounded, specific reflection instead of this placeholder.\n\nContext considered: ${options.context.slice(
      0,
      200
    )}${options.context.length > 200 ? "…" : ""}`;
  }
}
