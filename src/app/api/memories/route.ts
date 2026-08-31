import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  category: z.enum(["about_me", "goals", "preferences", "values", "important_context", "relationships", "other"]),
  content: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid memory" }, { status: 400 });

  const { data, error } = await supabase
    .from("memories")
    .insert({ user_id: user.id, category: parsed.data.category, content: parsed.data.content, source: "manual" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memory: data });
}
