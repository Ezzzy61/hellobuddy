import type { ExtractedMemory } from "@/lib/ai/types";

const VALID_CATEGORIES = new Set([
  "about_me",
  "goals",
  "preferences",
  "values",
  "important_context",
  "relationships",
  "other",
]);

/**
 * Parses a model's JSON response into a safe array of ExtractedMemory,
 * tolerating minor formatting issues and never throwing — a malformed model
 * response should degrade to "no memories suggested," not crash a request.
 */
export function safeParseJsonArray(raw: string): ExtractedMemory[] {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
    const parsed = JSON.parse(cleaned);
    const list = Array.isArray(parsed) ? parsed : parsed?.memories;
    if (!Array.isArray(list)) return [];

    return list
      .filter((item) => item && typeof item.content === "string" && item.content.trim().length > 0)
      .slice(0, 8)
      .map((item) => ({
        category: VALID_CATEGORIES.has(item.category) ? item.category : "other",
        content: String(item.content).trim(),
        sourceExcerpt: typeof item.sourceExcerpt === "string" ? item.sourceExcerpt : undefined,
      }));
  } catch {
    return [];
  }
}
