import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  category: z
    .enum(["health", "fitness", "career", "finance", "relationships", "personal_growth", "education", "custom"])
    .optional(),
  term: z.enum(["short_term", "long_term"]).optional(),
  whyItMatters: z.string().trim().max(1000).nullable().optional(),
  targetDate: z.string().nullable().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "paused", "completed", "archived"]).optional(),
  checkIn: z.boolean().optional(), // when true, stamps last_checked_in_at
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const body = parsed.data;

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.category !== undefined) update.category = body.category;
  if (body.term !== undefined) update.term = body.term;
  if (body.whyItMatters !== undefined) update.why_it_matters = body.whyItMatters;
  if (body.targetDate !== undefined) update.target_date = body.targetDate;
  if (body.progress !== undefined) update.progress = body.progress;
  if (body.status !== undefined) update.status = body.status;
  if (body.checkIn) update.last_checked_in_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("goals")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ goal: data });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("goals").delete().eq("id", params.id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
