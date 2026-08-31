import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { GoalsView } from "@/components/goals/goals-view";
import type { Goal } from "@/types/database";

export default async function GoalsPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = createClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", current.userId)
    .order("created_at", { ascending: false });

  return <GoalsView initialGoals={(goals as Goal[]) ?? []} />;
}
