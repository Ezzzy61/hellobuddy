-- ============================================================================
-- Adds a country field to profiles so the self-harm crisis response can show
-- locally relevant emergency numbers and helplines instead of guessing (or
-- defaulting to US-only numbers) for users outside the US.
-- ============================================================================

alter table public.profiles add column if not exists country text;

comment on column public.profiles.country is
  'ISO 3166-1 alpha-2 country code (e.g. IN, US, GB). Used only to select which crisis-support resources are shown in the safety response — not used for any other purpose.';
