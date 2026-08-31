import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";

const bodySchema = z.object({
  text: z.string().trim().min(20).max(20000),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Please paste at least a few sentences." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("memories")
    .select("content")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(50);

  const provider = getAIProvider();
  const extracted = await provider.extractMemories({
    text: parsed.data.text,
    existingMemories: (existing ?? []).map((m) => m.content),
  });

  if (!extracted.length) {
    return NextResponse.json({ suggestions: [] });
  }

  const { data: inserted, error } = await supabase
    .from("potential_memories")
    .insert(
      extracted.map((m) => ({
        user_id: user.id,
        category: m.category,
        content: m.content,
        source: "story_import" as const,
        source_excerpt: m.sourceExcerpt ?? parsed.data.text.slice(0, 240),
        status: "pending" as const,
      }))
    )
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ suggestions: inserted });
}
