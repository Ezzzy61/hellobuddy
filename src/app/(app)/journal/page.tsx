import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { JournalView } from "@/components/journal/journal-view";
import type { JournalEntry } from "@/types/database";

export default async function JournalPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = createClient();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", current.userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  return <JournalView initialEntries={(entries as JournalEntry[]) ?? []} />;
}
