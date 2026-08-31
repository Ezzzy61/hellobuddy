-- ============================================================================
-- HelloBuddy — Development seed data
--
-- This is OPTIONAL and intended for local development only. It seeds example
-- goals, journal entries, memories, and reflections for a single existing
-- auth user so you can preview the interface without manually creating data.
--
-- Usage:
--   1. Sign up for a HelloBuddy account locally (so a real auth.users row +
--      profiles row exists).
--   2. Find your user id: select id, email from auth.users;
--   3. Replace 'YOUR-USER-ID-HERE' below with that id.
--   4. Run this file against your Supabase project (SQL editor or `supabase
--      db execute -f supabase/seed.sql`).
--
-- Never run this against a production project with real users.
-- ============================================================================

do $$
declare
  target_user uuid := 'YOUR-USER-ID-HERE'; -- <-- replace me
begin
  if not exists (select 1 from auth.users where id = target_user) then
    raise notice 'No user found with id %. Update target_user in supabase/seed.sql first.', target_user;
    return;
  end if;

  update public.profiles
  set onboarding_completed = true,
      preferred_name = coalesce(preferred_name, 'Alex'),
      current_life_context = 'Recently started a new job and trying to build better habits.',
      current_priorities = 'Getting healthier and being more present with family.',
      communication_style = 'honest'
  where id = target_user;

  insert into public.goals (user_id, title, description, category, term, why_it_matters, progress, status, target_date)
  values
    (target_user, 'Go to the gym 3x a week', 'Consistent strength training.', 'fitness', 'short_term', 'I want more energy and confidence.', 40, 'active', current_date + interval '30 days'),
    (target_user, 'Feel confident and healthy in my body', 'Long-term health goal.', 'health', 'long_term', 'This affects how I show up everywhere else in my life.', 25, 'active', null),
    (target_user, 'Get promoted to senior role', 'Career growth goal.', 'career', 'long_term', 'Financial stability and professional pride.', 60, 'active', current_date + interval '180 days'),
    (target_user, 'Read one book a month', 'Personal growth habit.', 'personal_growth', 'short_term', null, 100, 'completed', current_date - interval '5 days');

  insert into public.journal_entries (user_id, title, content, mood, entry_date)
  values
    (target_user, 'A good start', 'Went to the gym this morning before work. Felt great and set a good tone for the day.', 'good', current_date - interval '1 day'),
    (target_user, null, 'Rough day at work — felt overwhelmed with the new project deadlines. Skipped the gym again.', 'rough', current_date - interval '3 days'),
    (target_user, 'Weekend reset', 'Spent time with family this weekend. Reminded me why work-life balance matters so much to me.', 'great', current_date - interval '5 days');

  insert into public.memories (user_id, category, content, source)
  values
    (target_user, 'goals', 'The user is working toward feeling confident and healthy in their body.', 'onboarding'),
    (target_user, 'values', 'The user values being present with family, especially on weekends.', 'conversation'),
    (target_user, 'about_me', 'The user recently started a new job and is adjusting to new deadlines.', 'onboarding');

  insert into public.daily_checkins (user_id, checkin_date, feeling, on_mind, focus)
  values (target_user, current_date, 'Okay', 'A big deadline at work this week.', 'Getting one solid workout in.')
  on conflict (user_id, checkin_date) do nothing;

  raise notice 'Seed data inserted for user %', target_user;
end $$;
