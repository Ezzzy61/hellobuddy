import type { SupabaseClient } from "@supabase/supabase-js";
import type { Goal, JournalEntry, Memory, Message } from "@/types/database";
import { buildPersonaPrompt } from "@/lib/ai/prompts";
import type { CommunicationStyle } from "@/types/database";

// ============================================================================
// Context Builder
// Responsible for assembling a bounded, relevant context window for each AI
// call instead of sending the user's entire history. Keeps token usage
// predictable and keeps the model focused on what's actually relevant to the
// current message.
// ============================================================================

const MAX_RECENT_MESSAGES = 12;
const MAX_MEMORIES = 12;
const MAX_ACTIVE_GOALS = 6;
const MAX_JOURNAL_SNIPPETS = 4;

export interface BuiltContext {
  systemPrompt: string;
  recentMessages: Message[];
}

/** Very small relevance scorer: counts shared significant words between the query and a candidate string. */
function relevanceScore(query: string, candidate: string): number {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with", "is", "are",
    "was", "were", "i", "you", "my", "your", "it", "that", "this", "be", "have", "has", "had",
  ]);
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !stop.has(w))
    );
  const q = words(query);
  const c = words(candidate);
  let score = 0;
  for (const w of q) if (c.has(w)) score += 1;
  return score;
}

function topByRelevance<T>(items: T[], query: string, toText: (item: T) => string, limit: number): T[] {
  if (!query.trim()) return items.slice(0, limit);
  const scored = items.map((item) => ({ item, score: relevanceScore(query, toText(item)) }));
  scored.sort((a, b) => b.score - a.score);
  // If nothing scored (no keyword overlap), still return the most recent items rather than nothing.
  const anyScore = scored.some((s) => s.score > 0);
  return (anyScore ? scored : scored).slice(0, limit).map((s) => s.item);
}

interface BuildContextParams {
  supabase: SupabaseClient;
  userId: string;
  conversationId?: string;
  /** The user's latest message — used to select relevant memories/goals/journal entries. */
  queryText: string;
  communicationStyle: CommunicationStyle;
  preferredName?: string | null;
  extraInstructions?: string;
}

export async function buildTalkContext(params: BuildContextParams): Promise<BuiltContext> {
  const { supabase, userId, conversationId, queryText, communicationStyle, preferredName, extraInstructions } = params;

  const [memoriesRes, goalsRes, journalRes, messagesRes] = await Promise.all([
    supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(15),
    conversationId
      ? supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(MAX_RECENT_MESSAGES)
      : Promise.resolve({ data: [] as Message[] }),
  ]);

  const memories: Memory[] = memoriesRes.data ?? [];
  const goals: Goal[] = goalsRes.data ?? [];
  const journalEntries: JournalEntry[] = journalRes.data ?? [];
  const recentMessages: Message[] = ((messagesRes.data ?? []) as Message[]).slice().reverse();

  const relevantMemories = topByRelevance(memories, queryText, (m) => m.content, MAX_MEMORIES);
  const relevantGoals = topByRelevance(
    goals,
    queryText,
    (g) => `${g.title} ${g.description ?? ""} ${g.why_it_matters ?? ""}`,
    MAX_ACTIVE_GOALS
  );
  const relevantJournal = topByRelevance(
    journalEntries,
    queryText,
    (j) => `${j.title ?? ""} ${j.content}`,
    MAX_JOURNAL_SNIPPETS
  );

  const memoryBlock = relevantMemories.length
    ? relevantMemories.map((m) => `- [${m.category}] ${m.content}`).join("\n")
    : "(no saved memories yet)";

  const goalsBlock = relevantGoals.length
    ? relevantGoals
        .map(
          (g) =>
            `- "${g.title}" (${g.category}, ${g.term.replace("_", " ")}, progress ${g.progress}%)${
              g.why_it_matters ? ` — matters because: ${g.why_it_matters}` : ""
            }`
        )
        .join("\n")
    : "(no active goals yet)";

  const journalBlock = relevantJournal.length
    ? relevantJournal
        .map((j) => `- [${j.entry_date}${j.mood ? `, mood: ${j.mood}` : ""}] ${j.content.slice(0, 240)}`)
        .join("\n")
    : "(no relevant journal entries)";

  const persona = buildPersonaPrompt(communicationStyle, preferredName);

  const systemPrompt = `${persona}

${extraInstructions ? `${extraInstructions}\n` : ""}
--- Approved memories about this user (only use what's relevant; never invent beyond this) ---
${memoryBlock}

--- Active goals ---
${goalsBlock}

--- Recent relevant journal context ---
${journalBlock}

Remember: only reference the above when it's genuinely relevant to what the user just said. Do not recite this list back to them.`;

  return { systemPrompt, recentMessages };
}
