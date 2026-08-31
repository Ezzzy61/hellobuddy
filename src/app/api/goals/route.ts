import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  category: z.enum(["health", "fitness", "career", "finance", "relationships", "personal_growth", "education", "custom"]),
  term: z.enum(["short_term", "long_term"]),
  whyItMatters: z.string().trim().max(1000).optional(),
  targetDate: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
  const body = parsed.data;

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description || null,
      category: body.category,
      term: body.term,
      why_it_matters: body.whyItMatters || null,
      target_date: body.targetDate || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await trackEvent(supabase, user.id, "goal_created", { category: body.category, term: body.term });

  return NextResponse.json({ goal: data });
}
