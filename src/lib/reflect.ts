import type { SupabaseClient } from "@supabase/supabase-js";
import type { Goal, JournalEntry, Mood } from "@/types/database";

// ============================================================================
// Rule-based reflection insights (no ML/clustering — deliberately simple and
// transparent for an MVP). Every insight is phrased as a possibility, never
// a fact, per the product's "honest mirror, not oracle" principle.
// ============================================================================

export interface Insight {
  id: string;
  type: string;
  content: string;
}

const MOOD_SCORE: Record<Mood, number> = { great: 5, good: 4, okay: 3, low: 2, rough: 1 };

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with", "is", "are", "was",
  "were", "i", "you", "my", "your", "it", "that", "this", "be", "have", "has", "had", "at", "as",
  "just", "so", "about", "not", "im", "i'm", "been", "really", "very", "like", "get", "got",
]);

const TOPIC_KEYWORDS: Record<string, string[]> = {
  work: ["work", "job", "career", "boss", "meeting", "office", "deadline", "coworker"],
  health: ["gym", "exercise", "workout", "sleep", "diet", "health", "run", "running", "tired"],
  relationships: ["partner", "friend", "relationship", "family", "mom", "dad", "girlfriend", "boyfriend", "spouse"],
  money: ["money", "finance", "budget", "debt", "bills", "spending", "savings"],
  stress: ["stress", "anxious", "anxiety", "overwhelmed", "burnout", "pressure"],
};

export async function computeInsights(supabase: SupabaseClient, userId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  const [journalRes, goalsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(14),
    supabase.from("goals").select("*").eq("user_id", userId).eq("status", "active"),
  ]);

  const entries = (journalRes.data as JournalEntry[]) ?? [];
  const goals = (goalsRes.data as Goal[]) ?? [];

  // --- Mood trend -----------------------------------------------------
  const moodEntries = entries.filter((e) => e.mood);
  if (moodEntries.length >= 3) {
    const recent = moodEntries.slice(0, Math.ceil(moodEntries.length / 2));
    const older = moodEntries.slice(Math.ceil(moodEntries.length / 2));
    const avg = (list: JournalEntry[]) =>
      list.reduce((sum, e) => sum + MOOD_SCORE[e.mood as Mood], 0) / list.length;
    const recentAvg = avg(recent);
    const olderAvg = older.length ? avg(older) : recentAvg;

    if (recentAvg - olderAvg >= 0.75) {
      insights.push({
        id: "mood-up",
        type: "mood_trend",
        content: "One possible pattern: your recent mood entries look a bit brighter than earlier ones. Does this resonate with you?",
      });
    } else if (olderAvg - recentAvg >= 0.75) {
      insights.push({
        id: "mood-down",
        type: "mood_trend",
        content: "Based on recent entries, your mood may have dipped a little lately. This isn't a diagnosis — just something that stood out. Does this feel accurate?",
      });
    }
  }

  // --- Topic frequency --------------------------------------------------
  const combinedText = entries.map((e) => e.content).join(" ").toLowerCase();
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const count = keywords.reduce((sum, kw) => sum + (combinedText.match(new RegExp(`\\b${kw}\\b`, "g"))?.length ?? 0), 0);
    if (count >= 4) {
      insights.push({
        id: `topic-${topic}`,
        type: "topic_frequency",
        content: `${topic[0].toUpperCase()}${topic.slice(1)} has come up often in your recent journal entries. One possible pattern: ${topic} has been on your mind lately.`,
      });
    }
  }

  // --- Stale goals --------------------------------------------------
  const staleGoals = goals.filter((g) => {
    const reference = g.last_checked_in_at ?? g.created_at;
    const days = (Date.now() - new Date(reference).getTime()) / 86400000;
    return days > 14;
  });
  for (const goal of staleGoals.slice(0, 3)) {
    insights.push({
      id: `stale-${goal.id}`,
      type: "goal_stale",
      content: `You haven't checked in on "${goal.title}" recently. Is this still something you want to work toward?`,
    });
  }

  // --- Completed goals worth celebrating --------------------------------
  const { data: completedGoals } = await supabase
    .from("goals")
    .select("id, title")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (completedGoals && completedGoals.length > 0) {
    insights.push({
      id: `completed-${completedGoals[0].id}`,
      type: "goal_completed",
      content: `You marked "${completedGoals[0].title}" as completed. Worth pausing on that for a moment.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "not-enough-data",
      type: "no_data",
      content: "Not enough recent activity yet for Buddy to notice a pattern. Keep journaling and checking in, and reflections will start showing up here.",
    });
  }

  return insights;
}

export function topWords(text: string, limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const word of text.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/)) {
    if (word.length < 4 || STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([w]) => w);
}
