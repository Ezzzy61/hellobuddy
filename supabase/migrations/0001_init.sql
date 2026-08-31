-- ============================================================================
-- HelloBuddy — Initial schema
-- Run via `supabase db push` or paste into the Supabase SQL editor.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- profiles
-- One row per authenticated user. Created automatically via trigger on signup.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_name text,
  communication_style text not null default 'honest' check (communication_style in ('gentle', 'honest', 'push_me')),
  onboarding_completed boolean not null default false,
  current_life_context text,
  current_priorities text,
  life_area_ratings jsonb not null default '{}'::jsonb, -- { health: 1-10, career: 1-10, ... }
  plan text not null default 'free' check (plan in ('free', 'premium')),
  timezone text default 'UTC',
  safety_disclaimer_ack boolean not null default false,
  demo_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user; holds onboarding + preference data.';

-- ----------------------------------------------------------------------------
-- goals
-- ----------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'personal_growth' check (
    category in ('health', 'fitness', 'career', 'finance', 'relationships', 'personal_growth', 'education', 'custom')
  ),
  term text not null default 'short_term' check (term in ('short_term', 'long_term')),
  why_it_matters text,
  target_date date,
  progress integer not null default 0 check (progress between 0 and 100),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'archived')),
  last_checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals(user_id);
create index if not exists goals_status_idx on public.goals(user_id, status);

-- ----------------------------------------------------------------------------
-- journal_entries
-- ----------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text not null,
  mood text check (mood in ('great', 'good', 'okay', 'low', 'rough')),
  entry_date date not null default current_date,
  ai_reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_user_id_idx on public.journal_entries(user_id);
create index if not exists journal_entries_date_idx on public.journal_entries(user_id, entry_date desc);

-- ----------------------------------------------------------------------------
-- conversations
-- Groups messages. "mode" distinguishes Talk / Honest Mirror / Confused flows.
-- ----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'talk' check (mode in ('talk', 'confused', 'honest_mirror')),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx on public.conversations(user_id, updated_at desc);

-- ----------------------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb, -- e.g. { safety_flag: true, honest_mirror: true }
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id, created_at);
create index if not exists messages_user_id_idx on public.messages(user_id);

-- ----------------------------------------------------------------------------
-- memories
-- User-approved facts HelloBuddy is allowed to recall.
-- ----------------------------------------------------------------------------
create table if not exists public.memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'other' check (
    category in ('about_me', 'goals', 'preferences', 'values', 'important_context', 'relationships', 'other')
  ),
  content text not null,
  source text not null default 'manual' check (source in ('manual', 'conversation', 'journal', 'story_import', 'onboarding')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_user_id_idx on public.memories(user_id, is_active);
create index if not exists memories_category_idx on public.memories(user_id, category);

-- ----------------------------------------------------------------------------
-- potential_memories
-- Suggested-but-not-yet-approved memories (from conversations or "My Story" import).
-- ----------------------------------------------------------------------------
create table if not exists public.potential_memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'other' check (
    category in ('about_me', 'goals', 'preferences', 'values', 'important_context', 'relationships', 'other')
  ),
  content text not null,
  source text not null default 'conversation' check (source in ('conversation', 'story_import', 'journal')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'edited_and_approved', 'rejected')),
  source_excerpt text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists potential_memories_user_id_idx on public.potential_memories(user_id, status);

-- ----------------------------------------------------------------------------
-- daily_checkins
-- ----------------------------------------------------------------------------
create table if not exists public.daily_checkins (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  feeling text,
  on_mind text,
  focus text,
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index if not exists daily_checkins_user_id_idx on public.daily_checkins(user_id, checkin_date desc);

-- ----------------------------------------------------------------------------
-- reflection_insights
-- Rule-based, cached "possible pattern" insights shown on the Reflect page.
-- ----------------------------------------------------------------------------
create table if not exists public.reflection_insights (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text not null, -- e.g. 'mood_trend', 'goal_stale', 'topic_frequency'
  content text not null,
  related_entity_type text, -- 'goal' | 'journal_entry' | null
  related_entity_id uuid,
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reflection_insights_user_id_idx on public.reflection_insights(user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- usage_tracking
-- One row per user per usage period (daily) tracking AI message counts.
-- ----------------------------------------------------------------------------
create table if not exists public.usage_tracking (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null default current_date,
  messages_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);

create index if not exists usage_tracking_user_id_idx on public.usage_tracking(user_id, period_start desc);

-- ----------------------------------------------------------------------------
-- analytics_events
-- Lightweight, non-invasive product analytics.
-- ----------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_id_idx on public.analytics_events(user_id, created_at desc);
create index if not exists analytics_events_name_idx on public.analytics_events(event_name, created_at desc);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.goals;
create trigger set_updated_at before update on public.goals
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.journal_entries;
create trigger set_updated_at before update on public.journal_entries
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.conversations;
create trigger set_updated_at before update on public.conversations
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.memories;
create trigger set_updated_at before update on public.memories
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at on public.usage_tracking;
create trigger set_updated_at before update on public.usage_tracking
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- Auto-create a profile row when a new auth user is created.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, preferred_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.journal_entries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.potential_memories enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.reflection_insights enable row level security;
alter table public.usage_tracking enable row level security;
alter table public.analytics_events enable row level security;

-- profiles: user can read/update only their own row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- generic per-user-table policy generator (written out explicitly per table)
drop policy if exists "goals_all_own" on public.goals;
create policy "goals_all_own" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "journal_entries_all_own" on public.journal_entries;
create policy "journal_entries_all_own" on public.journal_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "conversations_all_own" on public.conversations;
create policy "conversations_all_own" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "messages_all_own" on public.messages;
create policy "messages_all_own" on public.messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "memories_all_own" on public.memories;
create policy "memories_all_own" on public.memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "potential_memories_all_own" on public.potential_memories;
create policy "potential_memories_all_own" on public.potential_memories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "daily_checkins_all_own" on public.daily_checkins;
create policy "daily_checkins_all_own" on public.daily_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reflection_insights_all_own" on public.reflection_insights;
create policy "reflection_insights_all_own" on public.reflection_insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "usage_tracking_all_own" on public.usage_tracking;
create policy "usage_tracking_all_own" on public.usage_tracking for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "analytics_events_select_own" on public.analytics_events;
create policy "analytics_events_select_own" on public.analytics_events for select using (auth.uid() = user_id);
drop policy if exists "analytics_events_insert_own" on public.analytics_events;
create policy "analytics_events_insert_own" on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
