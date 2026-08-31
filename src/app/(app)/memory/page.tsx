import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { MemoryView } from "@/components/memory/memory-view";
import type { Memory, PotentialMemory } from "@/types/database";

export default async function MemoryPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = createClient();
  const [memoriesRes, potentialRes] = await Promise.all([
    supabase.from("memories").select("*").eq("user_id", current.userId).eq("is_active", true).order("updated_at", { ascending: false }),
    supabase
      .from("potential_memories")
      .select("*")
      .eq("user_id", current.userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <MemoryView
      initialMemories={(memoriesRes.data as Memory[]) ?? []}
      initialPotential={(potentialRes.data as PotentialMemory[]) ?? []}
    />
  );
}
