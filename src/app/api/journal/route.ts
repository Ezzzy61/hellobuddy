import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";

const bodySchema = z.object({
  title: z.string().trim().max(200).optional(),
  content: z.string().trim().min(1).max(20000),
  mood: z.enum(["great", "good", "okay", "low", "rough"]).nullable().optional(),
  entryDate: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
  const body = parsed.data;

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      title: body.title || null,
      content: body.content,
      mood: body.mood || null,
      entry_date: body.entryDate || new Date().toISOString().slice(0, 10),
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await trackEvent(supabase, user.id, "journal_created", { mood: body.mood });

  return NextResponse.json({ entry: data });
}
