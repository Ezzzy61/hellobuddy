"use client";

import * as React from "react";
import { Pencil, Trash2, CalendarDays, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { formatDate, GOAL_CATEGORY_LABEL } from "@/lib/utils";
import type { Goal, GoalStatus } from "@/types/database";

const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

const STALE_DAYS = 14;

function isStale(goal: Goal): boolean {
  const reference = goal.last_checked_in_at ?? goal.created_at;
  const days = (Date.now() - new Date(reference).getTime()) / 86400000;
  return goal.status === "active" && days > STALE_DAYS;
}

export function GoalCard({
  goal,
  onEdit,
  onDelete,
  onUpdate,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (goal: Goal) => void;
}) {
  const [progress, setProgress] = React.useState(goal.progress);
  const [saving, setSaving] = React.useState(false);
  const stale = isStale(goal);

  async function persist(update: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const data = await res.json();
      if (res.ok) onUpdate(data.goal);
    } finally {
      setSaving(false);
    }
  }

  async function handleProgressCommit() {
    if (progress !== goal.progress) {
      await persist({ progress, checkIn: true });
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-ink-900 dark:text-ink-50">{goal.title}</h3>
              <Badge variant="outline">{GOAL_CATEGORY_LABEL[goal.category]}</Badge>
              <Badge variant="muted">{goal.term === "short_term" ? "Short-term" : "Long-term"}</Badge>
            </div>
            {goal.description && <p className="mt-1.5 text-sm text-ink-500">{goal.description}</p>}
            {goal.why_it_matters && (
              <p className="mt-1.5 text-xs italic text-ink-400">Why it matters: {goal.why_it_matters}</p>
            )}
            {goal.target_date && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-400">
                <CalendarDays className="h-3 w-3" /> Target: {formatDate(goal.target_date)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <button onClick={onEdit} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Edit goal">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete goal">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            onMouseUp={handleProgressCommit}
            onTouchEnd={handleProgressCommit}
            disabled={saving}
            className="w-full accent-clay-500"
          />
          <Progress value={progress} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Select
            value={goal.status}
            onChange={(e) => persist({ status: e.target.value as GoalStatus })}
            className="h-9 w-auto text-xs"
            disabled={saving}
          >
            {(Object.keys(STATUS_LABEL) as GoalStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>

          {stale && (
            <div className="flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1 text-xs text-ink-600">
              <HelpCircle className="h-3.5 w-3.5" />
              You haven't checked in on this goal recently.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
