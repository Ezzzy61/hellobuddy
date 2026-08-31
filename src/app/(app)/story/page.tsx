import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { StoryView } from "@/components/story/story-view";
import type { PotentialMemory } from "@/types/database";

export default async function StoryPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = createClient();
  const { data: pending } = await supabase
    .from("potential_memories")
    .select("*")
    .eq("user_id", current.userId)
    .eq("source", "story_import")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return <StoryView initialPending={(pending as PotentialMemory[]) ?? []} />;
}
