# HelloBuddy

**Your biggest supporter. Your honest mirror.**

HelloBuddy is an AI-powered personal reflection and growth companion. It is **not** an AI
therapist, a medical or diagnostic tool, or an emergency service. It exists to help you talk
freely about your life, journal conversationally, reflect honestly, set and track goals, remember
what matters to you, and think more clearly when things feel confusing — with support that is
kind, but never just tells you what you want to hear.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [AI provider setup](#ai-provider-setup)
- [Local development](#local-development)
- [Deployment (Vercel)](#deployment-vercel)
- [Architecture overview](#architecture-overview)
- [Privacy principles](#privacy-principles)
- [Safety](#safety)
- [Known limitations (v1)](#known-limitations-v1)
- [Roadmap](#roadmap)

---

## Features

- **Talk** — a warm, honest conversational interface. Buddy listens, reflects back what it
  hears, asks one thoughtful follow-up at a time, and practices "Honest Mirror" behavior:
  respectfully naming contradictions between stated priorities and described behavior, always
  phrased as a possibility ("One possible pattern is...") and never as certainty.
- **Journal** — free-form entries with mood tagging, editing, deletion, and optional one-tap AI
  reflection per entry.
- **Goals** — short- and long-term goals with category, "why this matters," target date, progress,
  and status. Stale goals (no check-in in 14+ days) are surfaced automatically.
- **I'm Confused** — a structured 8-step reflection workflow (what happened → facts vs.
  assumptions → options → what matters → fears → regret) that ends in a synthesized "Honest
  Reflection / Facts vs Assumptions / What Seems Important / Possible Options / A Small Next
  Step" writeup.
- **My Story** — paste old journal entries, notes, or a life summary; HelloBuddy suggests
  potential memories for you to approve, edit, or reject. Nothing is saved automatically.
- **Memory** — full transparency into everything HelloBuddy remembers, grouped by category, fully
  editable and deletable, with a "delete all" option.
- **Reflect** — a dashboard of rule-based, clearly-labeled-as-possible insights: mood trends,
  recurring topics, stale goals, and completed goals — always phrased with humility.
- **Daily check-in** — three quick questions (feeling / on your mind / today's focus), surfaced
  on Home.
- **Free/Premium usage architecture** — a configurable daily AI-message limit for free users,
  with a "Premium — coming soon" screen and no real billing wired up yet (by design).
- **Safety-first design** — a lightweight, conservative self-harm/crisis detector that
  short-circuits normal coaching in favor of a clear, supportive message encouraging the user to
  contact real help immediately.
- **Works without any AI key** — a demo AI provider means the entire product can be explored
  end-to-end with zero credentials, clearly labeled as demo output.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** with a small hand-rolled component kit (shadcn-style primitives, no Radix
  dependency, so the whole UI kit is dependency-light and easy to read)
- **Supabase** for auth + Postgres, with Row Level Security on every table
- **AI provider abstraction** — OpenAI, Anthropic, or Google Gemini, chosen via one environment
  variable, all implemented as small `fetch`-based clients (no extra SDKs). A demo provider is
  the default fallback.
- Deployable to **Vercel** with zero code changes.

## Project structure

```
src/
  app/
    page.tsx                  # Landing page
    login/, signup/           # Auth
    auth/callback/route.ts    # OAuth / email confirmation callback
    onboarding/                # Multi-step onboarding (outside the app shell)
    (app)/                     # Authenticated app shell (sidebar + mobile nav)
      home/ talk/ journal/ goals/ reflect/ confused/ story/ memory/ settings/ billing/
    api/                       # Route handlers (chat, journal, goals, memories, story, confused, checkin, onboarding, settings)
  components/
    ui/                        # Hand-rolled UI primitives (button, card, dialog, input, ...)
    chat/ journal/ goals/ memory/ story/ confused/ reflect/ home/ onboarding/ nav/ landing/ settings/
  lib/
    ai/                        # Provider abstraction, prompts, context builder, memory extraction
    supabase/                  # Browser/server/middleware Supabase clients
    usage.ts                   # Free/premium usage tracking
    analytics.ts                # Lightweight event tracking
    reflect.ts                  # Rule-based insight generation
    env.ts                       # Centralized env access + validation
  types/database.ts            # Hand-written types mirroring the SQL schema
supabase/
  migrations/0001_init.sql     # Full schema + RLS policies
  seed.sql                     # Optional local dev seed data
```

## Getting started

```bash
git clone <your-fork-url> hellobuddy
cd hellobuddy
npm install
cp .env.example .env.local
# fill in .env.local — see "Environment variables" below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** this project was scaffolded in an environment without npm registry access, so
> dependencies are declared in `package.json` but `npm install` needs to run somewhere with
> normal internet access (your machine, or Vercel's build step) before first run.

If Supabase environment variables are missing, the app still boots and shows a clear "Supabase
isn't configured yet" message on any page that needs it, instead of crashing. If no AI provider
key is configured, `AI_PROVIDER=demo` (the default) is used automatically and every AI response is
clearly labeled as a demo response.

## Environment variables

See [`.env.example`](./.env.example) for the full list with comments. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only; only needed for future admin/background jobs |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | No | Set `true` to show "Continue with Google" (also configure the provider in Supabase) |
| `AI_PROVIDER` | No (default `demo`) | `openai` \| `anthropic` \| `gemini` \| `demo` |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | If using OpenAI | |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | If using Anthropic | |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | If using Gemini | |
| `NEXT_PUBLIC_APP_URL` | Recommended | Used for OAuth redirect URLs |
| `FREE_PLAN_DAILY_MESSAGE_LIMIT` | No (default `30`) | Daily AI message allowance for free plan |

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the Project URL and `anon public` key into
   `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run the schema migration: open the SQL editor and paste the contents of
   `supabase/migrations/0001_init.sql`, or use the CLI:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   This creates every table, foreign key, index, the `handle_new_user` trigger (which
   auto-creates a `profiles` row on signup), `updated_at` triggers, and full Row Level Security
   policies so each user can only ever read/write their own rows.
4. **Email auth** works out of the box. For **Google auth**, go to **Authentication →
   Providers → Google** in Supabase, add your OAuth client ID/secret, set the redirect URL to
   `<your-app-url>/auth/callback`, and set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`.
5. (Optional) Seed example data for local development: edit `supabase/seed.sql` with a real user
   id from `auth.users`, then run it against your project. Seed data is never auto-applied and
   never shown to real users automatically.

## AI provider setup

Pick one in `.env.local`:

```bash
# OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-latest

# Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-flash

# No key? Leave AI_PROVIDER=demo (or unset) — the app works fully, with clearly labeled demo replies.
```

All three providers implement the same `AIProvider` interface (`src/lib/ai/types.ts`):
`chat`, `summarize`, `extractMemories`, `reflect`. Adding a fourth provider means writing one new
file in `src/lib/ai/providers/` and one line in `src/lib/ai/index.ts`.

## Local development

```bash
npm run dev        # start the dev server
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build        # production build
```

## Deployment (Vercel)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.example` in the Vercel project settings.
4. Deploy. No custom build configuration is required — Vercel auto-detects Next.js.
5. Update your Supabase Auth redirect URLs (and Google OAuth redirect URI, if used) to include
   your production domain's `/auth/callback`.

## Architecture overview

- **Auth & data access**: Supabase Auth issues a session cookie managed via `@supabase/ssr`.
  `middleware.ts` refreshes the session and redirects unauthenticated users away from protected
  routes; every protected page additionally verifies auth server-side via
  `src/lib/current-user.ts` as defense in depth. All data access goes through Supabase's
  Postgres client with Row Level Security enforcing per-user isolation at the database layer —
  even a bug in application code cannot leak another user's data.
- **AI abstraction**: `src/lib/ai/types.ts` defines the `AIProvider` interface. Concrete
  providers live in `src/lib/ai/providers/`. `getAIProvider()` picks the configured provider (or
  falls back to `demo` if credentials are missing), and `safeChat()` wraps every conversational
  call with a self-harm/crisis check that runs **before** the model is ever called, plus a
  fallback to the demo response if the live provider errors.
- **Context builder** (`src/lib/ai/context-builder.ts`): rather than sending a user's entire
  history to the model, it retrieves a bounded set of the most relevant active memories, active
  goals, and recent journal entries (via a simple keyword-overlap relevance score) plus the last
  ~12 messages of the current conversation, and assembles them into one system prompt.
- **Memory extraction**: after a sufficiently substantive user message, or when analyzing
  imported "My Story" text, the active provider's `extractMemories()` proposes 0–6 candidate
  memories. These are inserted into `potential_memories` with `status = 'pending'` and are
  **never** auto-promoted — a user must explicitly approve (optionally after editing) or reject
  each one from the Memory or My Story page.
- **Usage tracking** (`src/lib/usage.ts`): one row per user per UTC day in `usage_tracking`.
  Free-plan users are capped at `FREE_PLAN_DAILY_MESSAGE_LIMIT` AI messages/day; premium users
  (a `plan` column on `profiles`, currently always `free` by default) are unlimited. No billing
  provider is wired up — the `/billing` page is a "Premium — coming soon" screen, and the schema
  is intentionally billing-ready (a `plan` enum) for a future Stripe integration.
- **Analytics** (`src/lib/analytics.ts`): inserts rows into `analytics_events` for a small,
  deliberate set of product events (signup, onboarding completed, first conversation, journal
  created, goal created, daily check-in completed, return visit, memory approved, etc). No raw
  message content is ever stored in analytics.
- **Reflection insights** (`src/lib/reflect.ts`): simple, transparent rule-based logic — mood
  trend comparison between two recent windows, keyword-frequency topic detection, and
  stale-goal detection. No ML/clustering, and every insight is phrased as a possibility
  ("One possible pattern...", "Does this resonate?").

## Privacy principles

- Every user-owned table has Row Level Security scoped to `auth.uid() = user_id` (or `= id` for
  `profiles`) — a user can never read or write another user's rows, even via a bug in the app.
- No personal memory is ever saved without explicit user approval — extracted/suggested memories
  always land in a separate `potential_memories` table first.
- The Memory page shows exactly what's remembered, in plain language, with full edit/delete
  control and a "delete all" option.
- Analytics tracks product events only, never raw journal/conversation content.
- The AI is instructed, at the prompt level, to never claim certainty about the user or people in
  their life, and to use humble, hedged language throughout.

## Safety

HelloBuddy is not therapy, a medical service, or an emergency resource, and the product
communicates this at onboarding and in Settings. A lightweight, deliberately conservative
pattern-based check (`detectImminentRisk` in `src/lib/ai/prompts.ts`) looks for language
suggesting imminent self-harm risk in any message sent to Talk, Confused mode, or Journal
reflection flows. When triggered, the app **skips normal coaching entirely** and returns a fixed,
supportive message encouraging the user to contact local emergency services or a trusted person
immediately — it never claims to be equipped to handle a crisis itself. This is a basic keyword
heuristic, not a clinical safety system — see "Known limitations" below.

## Known limitations (v1)

- The self-harm detector is a conservative regex heuristic, not a clinical-grade classifier. It
  can miss indirect language and should not be relied on as the product's sole safety mechanism
  in a real deployment.
- No billing integration — Premium is a "coming soon" placeholder with no payment processing.
- No push/email reminders — goal and check-in nudges are in-app only, as scoped.
- Memory/goal/journal relevance retrieval uses simple keyword overlap, not embeddings — good
  enough for MVP-scale data, but it won't semantically match paraphrased content.
- Reflection insights are rule-based, not statistically validated — intentionally scoped this
  way per the product principle of never presenting a pattern as a fact.
- "My Story" import only accepts pasted text, not file uploads, per the MVP scope.
- No streaming AI responses yet (responses arrive as a single completed reply).
- No automated test suite included in this pass.

## Roadmap

- Real-time streaming chat responses.
- Embedding-based semantic memory/goal/journal retrieval.
- Stripe billing integration for the existing free/premium architecture.
- Push/email reminders building on the existing in-app check-in system.
- A more robust, human-reviewed crisis-detection pipeline.
- File upload support for My Story (PDF/DOCX import).
- Export/download of a user's full data (journal, goals, memories).
