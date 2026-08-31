import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics";

const lifeAreaSchema = z
  .object({
    health: z.number().min(1).max(10).optional(),
    career: z.number().min(1).max(10).optional(),
    relationships: z.number().min(1).max(10).optional(),
    family: z.number().min(1).max(10).optional(),
    social: z.number().min(1).max(10).optional(),
    personal_growth: z.number().min(1).max(10).optional(),
    work_life_balance: z.number().min(1).max(10).optional(),
  })
  .partial();

const bodySchema = z.object({
  preferredName: z.string().trim().min(1).max(60),
  currentLifeContext: z.string().trim().max(2000).optional(),
  currentPriorities: z.string().trim().max(2000).optional(),
  shortTermGoal: z.string().trim().max(500).optional(),
  longTermGoal: z.string().trim().max(500).optional(),
  lifeAreaRatings: lifeAreaSchema.optional(),
  communicationStyle: z.enum(["gentle", "honest", "push_me"]),
  safetyAck: z.boolean(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding data", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      preferred_name: body.preferredName,
      current_life_context: body.currentLifeContext || null,
      current_priorities: body.currentPriorities || null,
      life_area_ratings: body.lifeAreaRatings || {},
      communication_style: body.communicationStyle,
      safety_disclaimer_ack: body.safetyAck,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const goalRows = [];
  if (body.shortTermGoal) {
    goalRows.push({
      user_id: user.id,
      title: body.shortTermGoal,
      term: "short_term",
      category: "personal_growth",
      status: "active",
    });
  }
  if (body.longTermGoal) {
    goalRows.push({
      user_id: user.id,
      title: body.longTermGoal,
      term: "long_term",
      category: "personal_growth",
      status: "active",
    });
  }
  if (goalRows.length) {
    await supabase.from("goals").insert(goalRows);
  }

  // Seed a couple of approved memories from onboarding context, since the
  // user explicitly provided this information for HelloBuddy to remember.
  const memoryRows = [];
  if (body.currentPriorities) {
    memoryRows.push({
      user_id: user.id,
      category: "values" as const,
      content: `Right now, ${body.preferredName} says this matters most: ${body.currentPriorities}`,
      source: "onboarding" as const,
    });
  }
  if (body.currentLifeContext) {
    memoryRows.push({
      user_id: user.id,
      category: "important_context" as const,
      content: `Current life context shared during onboarding: ${body.currentLifeContext}`,
      source: "onboarding" as const,
    });
  }
  if (memoryRows.length) {
    await supabase.from("memories").insert(memoryRows);
  }

  await trackEvent(supabase, user.id, "onboarding_completed", {
    communicationStyle: body.communicationStyle,
  });

  return NextResponse.json({ success: true });
}
