import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import { SAFETY_RULES } from "@/lib/ai/prompts";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: entry, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("communication_style, preferred_name").eq("id", user.id).single();

  const provider = getAIProvider();
  const reflection = await provider.reflect({
    instructions: `You are Buddy, offering a brief, honest reflection on a journal entry the user just wrote. Communication style: ${profile?.communication_style ?? "honest"}. Keep it to 2-4 sentences. Reflect back what you notice, and gently note anything worth their own attention — without diagnosing or claiming certainty. Use language like "One thing I noticed..." or "Based on what you wrote...". ${SAFETY_RULES}`,
    context: `Mood: ${entry.mood ?? "not specified"}\n\nEntry:\n${entry.content}`,
  });

  await supabase.from("journal_entries").update({ ai_reflection: reflection }).eq("id", entry.id);

  return NextResponse.json({ reflection });
}
