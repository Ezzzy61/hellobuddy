"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { GOAL_CATEGORY_LABEL } from "@/lib/utils";
import type { Goal, GoalCategory, GoalTerm } from "@/types/database";

const CATEGORIES = Object.keys(GOAL_CATEGORY_LABEL) as GoalCategory[];

export function GoalEditor({
  open,
  onClose,
  goal,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  goal?: Goal | null;
  onSaved: (goal: Goal) => void;
}) {
  const [title, setTitle] = React.useState(goal?.title ?? "");
  const [description, setDescription] = React.useState(goal?.description ?? "");
  const [category, setCategory] = React.useState<GoalCategory>(goal?.category ?? "personal_growth");
  const [term, setTerm] = React.useState<GoalTerm>(goal?.term ?? "short_term");
  const [whyItMatters, setWhyItMatters] = React.useState(goal?.why_it_matters ?? "");
  const [targetDate, setTargetDate] = React.useState(goal?.target_date ?? "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(goal?.title ?? "");
      setDescription(goal?.description ?? "");
      setCategory(goal?.category ?? "personal_growth");
      setTerm(goal?.term ?? "short_term");
      setWhyItMatters(goal?.why_it_matters ?? "");
      setTargetDate(goal?.target_date ?? "");
      setError(null);
    }
  }, [open, goal]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Give your goal a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isEdit = Boolean(goal);
      const res = await fetch(isEdit ? `/api/goals/${goal!.id}` : "/api/goals", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          category,
          term,
          whyItMatters: whyItMatters || null,
          targetDate: targetDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save goal");
      onSaved(data.goal);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={goal ? "Edit goal" : "New goal"} className="max-w-xl">
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="space-y-1.5">
          <Label htmlFor="goal-title">Title</Label>
          <Input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Get to the gym 3x a week" autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="goal-category">Category</Label>
            <Select id="goal-category" value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {GOAL_CATEGORY_LABEL[c]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-term">Timeframe</Label>
            <Select id="goal-term" value={term} onChange={(e) => setTerm(e.target.value as GoalTerm)}>
              <option value="short_term">Short-term</option>
              <option value="long_term">Long-term</option>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goal-description">Description</Label>
          <Textarea
            id="goal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What does success look like?"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goal-why">Why this matters</Label>
          <Textarea
            id="goal-why"
            value={whyItMatters}
            onChange={(e) => setWhyItMatters(e.target.value)}
            rows={2}
            placeholder="Buddy will use this to check in honestly later."
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="goal-date">Target date (optional)</Label>
          <Input id="goal-date" type="date" value={targetDate ?? ""} onChange={(e) => setTargetDate(e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save goal
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
