import type { SupabaseClient } from "@supabase/supabase-js";
import { getAIProvider } from "@/lib/ai";

const MIN_WORDS_TO_CONSIDER = 12;

/**
 * After a meaningful user message, asks the AI provider whether a potential
 * memory is worth surfacing, and inserts it as a *pending* row for the user
 * to approve/edit/reject. Memories are NEVER auto-saved to the active
 * `memories` table from here.
 */
export async function maybeExtractMemories(
  supabase: SupabaseClient,
  userId: string,
  text: string
): Promise<void> {
  if (text.trim().split(/\s+/).length < MIN_WORDS_TO_CONSIDER) return;

  const { data: existing } = await supabase
    .from("memories")
    .select("content")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(50);

  const provider = getAIProvider();
  const extracted = await provider.extractMemories({
    text,
    existingMemories: (existing ?? []).map((m) => m.content),
  });

  if (!extracted.length) return;

  await supabase.from("potential_memories").insert(
    extracted.map((m) => ({
      user_id: userId,
      category: m.category,
      content: m.content,
      source: "conversation" as const,
      source_excerpt: m.sourceExcerpt ?? text.slice(0, 240),
      status: "pending" as const,
    }))
  );
}
