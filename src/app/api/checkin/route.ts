import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";

const bodySchema = z.object({
  feeling: z.string().trim().max(200).optional(),
  onMind: z.string().trim().max(1000).optional(),
  focus: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid check-in" }, { status: 400 });
  const body = parsed.data;
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_checkins")
    .upsert(
      {
        user_id: user.id,
        checkin_date: today,
        feeling: body.feeling || null,
        on_mind: body.onMind || null,
        focus: body.focus || null,
      },
      { onConflict: "user_id,checkin_date" }
    )
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await trackEvent(supabase, user.id, "daily_checkin_completed", {});

  return NextResponse.json({ checkin: data });
}
