import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { computeInsights } from "@/lib/reflect";
import { ReflectView } from "@/components/reflect/reflect-view";
import type { Goal, JournalEntry } from "@/types/database";

export default async function ReflectPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = createClient();

  const [insights, journalRes, goalsRes] = await Promise.all([
    computeInsights(supabase, current.userId),
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", current.userId)
      .order("entry_date", { ascending: false })
      .limit(10),
    supabase.from("goals").select("*").eq("user_id", current.userId),
  ]);

  const journalEntries = (journalRes.data as JournalEntry[]) ?? [];
  const goals = (goalsRes.data as Goal[]) ?? [];

  return <ReflectView insights={insights} journalEntries={journalEntries} goals={goals} />;
}
