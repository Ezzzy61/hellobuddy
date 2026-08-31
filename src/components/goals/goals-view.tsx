"use client";

import * as React from "react";
import { Plus, Target } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalCard } from "@/components/goals/goal-card";
import { GoalEditor } from "@/components/goals/goal-editor";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { Goal, GoalStatus } from "@/types/database";

const FILTERS: { key: GoalStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

export function GoalsView({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = React.useState(initialGoals);
  const [filter, setFilter] = React.useState<GoalStatus | "all">("all");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const { toast } = useToast();

  const visible = filter === "all" ? goals : goals.filter((g) => g.status === filter);

  function handleSaved(goal: Goal) {
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === goal.id);
      return exists ? prev.map((g) => (g.id === goal.id ? goal : g)) : [goal, ...prev];
    });
    toast("Goal saved.");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this goal? This can't be undone.")) return;
    const prev = goals;
    setGoals((g) => g.filter((goal) => goal.id !== id));
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setGoals(prev);
      toast("Couldn't delete that goal.", "error");
    } else {
      toast("Goal deleted.");
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Goals"
        description="Set goals that matter to you — Buddy will check in on them honestly."
        action={
          <Button
            onClick={() => {
              setEditingGoal(null);
              setEditorOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> New goal
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.key ? "bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900" : "bg-ink-100 text-ink-500 hover:bg-ink-200"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Target className="h-10 w-10" />}
          title={goals.length === 0 ? "No goals yet" : "Nothing here yet"}
          description={
            goals.length === 0
              ? "Create your first goal — short-term or long-term — and tell Buddy why it matters."
              : "Try a different filter, or create a new goal."
          }
          action={
            <Button onClick={() => setEditorOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> New goal
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {visible.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => {
                setEditingGoal(goal);
                setEditorOpen(true);
              }}
              onDelete={() => handleDelete(goal.id)}
              onUpdate={handleSaved}
            />
          ))}
        </div>
      )}

      <GoalEditor open={editorOpen} onClose={() => setEditorOpen(false)} goal={editingGoal} onSaved={handleSaved} />
    </PageContainer>
  );
}
