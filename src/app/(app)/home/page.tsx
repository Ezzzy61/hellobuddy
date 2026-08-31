import Link from "next/link";
import { MessageCircle, BookOpen, Target, HelpCircle, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/shared/page-header";
import { CheckinWidget } from "@/components/home/checkin-widget";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trackEvent } from "@/lib/analytics";
import { GOAL_CATEGORY_LABEL, MOOD_META, relativeDay } from "@/lib/utils";
import type { DailyCheckin, Goal, JournalEntry } from "@/types/database";

const QUICK_LINKS = [
  { href: "/talk", icon: MessageCircle, label: "Talk to Buddy", description: "Say what's on your mind" },
  { href: "/journal", icon: BookOpen, label: "Write in your journal", description: "Free-form reflection" },
  { href: "/goals", icon: Target, label: "Check your goals", description: "See how you're tracking" },
  { href: "/confused", icon: HelpCircle, label: "I'm Confused", description: "Think through something hard" },
];

export default async function HomePage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [checkinRes, goalsRes, journalRes] = await Promise.all([
    supabase.from("daily_checkins").select("*").eq("user_id", current.userId).eq("checkin_date", today).maybeSingle(),
    supabase.from("goals").select("*").eq("user_id", current.userId).eq("status", "active").order("updated_at", { ascending: false }).limit(3),
    supabase.from("journal_entries").select("*").eq("user_id", current.userId).order("entry_date", { ascending: false }).limit(3),
  ]);

  // Best-effort "return visit" analytics ping — never blocks rendering.
  trackEvent(supabase, current.userId, "return_visit", {}).catch(() => {});

  const goals = (goalsRes.data as Goal[]) ?? [];
  const journalEntries = (journalRes.data as JournalEntry[]) ?? [];
  const name = current.profile?.preferred_name || "there";

  return (
    <PageContainer>
      <div className="mb-8">
        <p className="text-2xl">👋</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-ink-900 dark:text-ink-50 sm:text-3xl">
          Hey, {name}.
        </h1>
        <p className="mt-1 text-ink-500">What's on your mind today?</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-3 rounded-xl2 border border-ink-100 bg-white p-4 shadow-soft transition-transform hover:-translate-y-0.5 dark:border-ink-800 dark:bg-ink-900"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-50 text-clay-500">
                  <link.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{link.label}</p>
                  <p className="text-xs text-ink-400">{link.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Active goals</h2>
              <Link href="/goals" className="text-xs font-medium text-clay-600 hover:underline">
                View all
              </Link>
            </div>
            {goals.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-ink-500">
                  You don't have any active goals yet.{" "}
                  <Link href="/goals" className="font-medium text-clay-600 hover:underline">
                    Create one
                  </Link>
                  .
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <Card key={goal.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-ink-900 dark:text-ink-50">{goal.title}</p>
                          <Badge variant="outline" className="mt-1">
                            {GOAL_CATEGORY_LABEL[goal.category]}
                          </Badge>
                        </div>
                        <span className="text-sm text-ink-400">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="mt-3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Recent journal entries</h2>
              <Link href="/journal" className="text-xs font-medium text-clay-600 hover:underline">
                View all
              </Link>
            </div>
            {journalEntries.length === 0 ? (
              <Card>
                <CardContent className="p-5 text-sm text-ink-500">
                  Nothing written yet.{" "}
                  <Link href="/journal" className="font-medium text-clay-600 hover:underline">
                    Start your first entry
                  </Link>
                  .
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {journalEntries.map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-xs text-ink-400">
                        <span>{relativeDay(entry.entry_date)}</span>
                        {entry.mood && <span>{MOOD_META[entry.mood].emoji} {MOOD_META[entry.mood].label}</span>}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-ink-700 dark:text-ink-200">{entry.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <CheckinWidget initialCheckin={checkinRes.data as DailyCheckin | null} />
        </div>
      </div>
    </PageContainer>
  );
}
