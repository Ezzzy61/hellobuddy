import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Lightweight, non-invasive product analytics for the closed beta.
// Tracks a small, deliberate set of product events — never raw content,
// never invasive behavioral tracking.
// ============================================================================

export type AnalyticsEventName =
  | "signup_completed"
  | "onboarding_completed"
  | "first_conversation"
  | "journal_created"
  | "goal_created"
  | "daily_checkin_completed"
  | "return_visit"
  | "memory_approved"
  | "confused_session_completed"
  | "honest_mirror_triggered";

export async function trackEvent(
  supabase: SupabaseClient,
  userId: string | null,
  eventName: AnalyticsEventName,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      metadata,
    });
  } catch (err) {
    // Analytics must never break the user-facing flow.
    console.error("[analytics] failed to record event", eventName, err);
  }
}
