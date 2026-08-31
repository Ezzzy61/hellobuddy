// ============================================================================
// Hand-written types mirroring supabase/migrations/0001_init.sql.
// If you change the schema, update this file (or generate it with the
// Supabase CLI: `supabase gen types typescript`).
// ============================================================================

export type CommunicationStyle = "gentle" | "honest" | "push_me";
export type Plan = "free" | "premium";

export type GoalCategory =
  | "health"
  | "fitness"
  | "career"
  | "finance"
  | "relationships"
  | "personal_growth"
  | "education"
  | "custom";

export type GoalTerm = "short_term" | "long_term";
export type GoalStatus = "active" | "paused" | "completed" | "archived";
export type Mood = "great" | "good" | "okay" | "low" | "rough";
export type ConversationMode = "talk" | "confused" | "honest_mirror";
export type MessageRole = "user" | "assistant" | "system";
export type MemoryCategory =
  | "about_me"
  | "goals"
  | "preferences"
  | "values"
  | "important_context"
  | "relationships"
  | "other";
export type MemorySource = "manual" | "conversation" | "journal" | "story_import" | "onboarding";
export type PotentialMemoryStatus = "pending" | "approved" | "edited_and_approved" | "rejected";

export interface LifeAreaRatings {
  health?: number;
  career?: number;
  relationships?: number;
  family?: number;
  social?: number;
  personal_growth?: number;
  work_life_balance?: number;
}

export interface Profile {
  id: string;
  preferred_name: string | null;
  communication_style: CommunicationStyle;
  onboarding_completed: boolean;
  current_life_context: string | null;
  current_priorities: string | null;
  life_area_ratings: LifeAreaRatings;
  plan: Plan;
  timezone: string | null;
  safety_disclaimer_ack: boolean;
  demo_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  term: GoalTerm;
  why_it_matters: string | null;
  target_date: string | null;
  progress: number;
  status: GoalStatus;
  last_checked_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: Mood | null;
  entry_date: string;
  ai_reflection: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  mode: ConversationMode;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  category: MemoryCategory;
  content: string;
  source: MemorySource;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PotentialMemory {
  id: string;
  user_id: string;
  category: MemoryCategory;
  content: string;
  source: "conversation" | "story_import" | "journal";
  status: PotentialMemoryStatus;
  source_excerpt: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  feeling: string | null;
  on_mind: string | null;
  focus: string | null;
  created_at: string;
}

export interface ReflectionInsight {
  id: string;
  user_id: string;
  insight_type: string;
  content: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  dismissed: boolean;
  created_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  period_start: string;
  messages_used: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  event_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
