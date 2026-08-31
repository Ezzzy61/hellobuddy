import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  preferredName: z.string().trim().min(1).max(60).optional(),
  communicationStyle: z.enum(["gentle", "honest", "push_me"]).optional(),
  timezone: z.string().max(100).optional(),
});

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const body = parsed.data;

  const update: Record<string, unknown> = {};
  if (body.preferredName !== undefined) update.preferred_name = body.preferredName;
  if (body.communicationStyle !== undefined) update.communication_style = body.communicationStyle;
  if (body.timezone !== undefined) update.timezone = body.timezone;

  const { data, error } = await supabase.from("profiles").update(update).eq("id", user.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
