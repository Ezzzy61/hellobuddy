import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  category: z
    .enum(["about_me", "goals", "preferences", "values", "important_context", "relationships", "other"])
    .optional(),
  content: z.string().trim().min(1).max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const body = parsed.data;

  const { data: potential, error: fetchError } = await supabase
    .from("potential_memories")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !potential) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "reject") {
    await supabase
      .from("potential_memories")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("id", params.id);
    return NextResponse.json({ success: true });
  }

  const finalCategory = body.category ?? potential.category;
  const finalContent = body.content ?? potential.content;
  const wasEdited = body.content !== undefined && body.content !== potential.content;

  const { data: memory, error: insertError } = await supabase
    .from("memories")
    .insert({
      user_id: user.id,
      category: finalCategory,
      content: finalContent,
      source: potential.source === "story_import" ? "story_import" : "conversation",
    })
    .select("*")
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  await supabase
    .from("potential_memories")
    .update({ status: wasEdited ? "edited_and_approved" : "approved", resolved_at: new Date().toISOString() })
    .eq("id", params.id);

  await trackEvent(supabase, user.id, "memory_approved", { source: potential.source });

  return NextResponse.json({ memory });
}
