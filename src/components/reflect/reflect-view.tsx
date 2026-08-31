"use client";

import * as React from "react";
import { Sparkles, X, TrendingUp } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MOOD_META, relativeDay } from "@/lib/utils";
import type { Goal, JournalEntry } from "@/types/database";
import type { Insight } from "@/lib/reflect";

export function ReflectView({
  insights,
  journalEntries,
  goals,
}: {
  insights: Insight[];
  journalEntries: JournalEntry[];
  goals: Goal[];
}) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const visibleInsights = insights.filter((i) => !dismissed.has(i.id));

  const moodEntries = journalEntries.filter((e) => e.mood);
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <PageContainer>
      <PageHeader title="Reflect" description="Your recent moods, themes, and goals in one place." />

      <div className="mb-8">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-ink-500">
          <Sparkles className="h-3.5 w-3.5" /> Possible patterns
        </h2>
        <div className="space-y-3">
          {visibleInsights.map((insight) => (
            <div key={insight.id} className="flex items-start justify-between gap-3 rounded-xl2 border border-sage-200 bg-sage-50 p-4 text-sm text-sage-800">
              <p>{insight.content}</p>
              <button onClick={() => setDismissed((prev) => new Set(prev).add(insight.id))} className="shrink-0 text-sage-500 hover:text-sage-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {visibleInsights.length === 0 && (
            <p className="text-sm text-ink-400">You've reviewed all current reflections. Check back after your next entry or check-in.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Recent moods</h2>
          {moodEntries.length === 0 ? (
            <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No mood data yet" description="Add a mood to your journal entries to see trends here." />
          ) : (
            <Card>
              <CardContent className="space-y-3 p-5">
                {moodEntries.slice(0, 7).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">{relativeDay(entry.entry_date)}</span>
                    <span className="flex items-center gap-1.5 font-medium text-ink-800 dark:text-ink-100">
                      {MOOD_META[entry.mood!].emoji} {MOOD_META[entry.mood!].label}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Goals overview</h2>
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 text-center">
              <div>
                <p className="text-3xl font-semibold text-ink-900 dark:text-ink-50">{activeGoals.length}</p>
                <p className="text-xs text-ink-400">Active goals</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-sage-600">{completedGoals.length}</p>
                <p className="text-xs text-ink-400">Completed</p>
              </div>
            </CardContent>
          </Card>

          {activeGoals.length > 0 && (
            <div className="mt-3 space-y-2">
              {activeGoals.slice(0, 4).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between rounded-xl border border-ink-100 bg-white px-4 py-2.5 text-sm dark:border-ink-800 dark:bg-ink-900">
                  <span className="text-ink-700 dark:text-ink-200">{goal.title}</span>
                  <Badge variant="outline">{goal.progress}%</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
