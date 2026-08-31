import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// ============================================================================
// Free/Premium usage tracking. No billing integration yet — this only
// tracks and enforces a daily AI-message allowance for the free plan, in a
// shape that a future Stripe integration can slot into (plan field already
// exists on profiles; this module just needs a webhook to flip it).
// ============================================================================

function todayPeriodStart(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, resets daily
}

export interface UsageStatus {
  plan: "free" | "premium";
  used: number;
  limit: number | null; // null = unlimited (premium)
  remaining: number | null;
  limitReached: boolean;
  resetsAt: string; // ISO date of next reset
}

export async function getUsageStatus(supabase: SupabaseClient, userId: string): Promise<UsageStatus> {
  const period = todayPeriodStart();

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", userId).single();
  const plan = (profile?.plan as "free" | "premium") ?? "free";

  if (plan === "premium") {
    return { plan, used: 0, limit: null, remaining: null, limitReached: false, resetsAt: nextMidnightISO() };
  }

  const { data: usage } = await supabase
    .from("usage_tracking")
    .select("*")
    .eq("user_id", userId)
    .eq("period_start", period)
    .maybeSingle();

  const used = usage?.messages_used ?? 0;
  const limit = env.usage.freeDailyMessageLimit;

  return {
    plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    limitReached: used >= limit,
    resetsAt: nextMidnightISO(),
  };
}

/** Increments today's usage counter. Call AFTER a successful AI response, never before (so failed calls don't count against the user). */
export async function incrementUsage(supabase: SupabaseClient, userId: string): Promise<void> {
  const period = todayPeriodStart();

  const { data: existing } = await supabase
    .from("usage_tracking")
    .select("id, messages_used")
    .eq("user_id", userId)
    .eq("period_start", period)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("usage_tracking")
      .update({ messages_used: existing.messages_used + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("usage_tracking").insert({
      user_id: userId,
      period_start: period,
      messages_used: 1,
    });
  }
}

function nextMidnightISO(): string {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toISOString();
}
