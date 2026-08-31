"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn, MOOD_META } from "@/lib/utils";
import type { JournalEntry, Mood } from "@/types/database";

const MOODS: Mood[] = ["great", "good", "okay", "low", "rough"];

export function JournalEditor({
  open,
  onClose,
  entry,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  entry?: JournalEntry | null;
  onSaved: (entry: JournalEntry) => void;
}) {
  const [title, setTitle] = React.useState(entry?.title ?? "");
  const [content, setContent] = React.useState(entry?.content ?? "");
  const [mood, setMood] = React.useState<Mood | null>(entry?.mood ?? null);
  const [entryDate, setEntryDate] = React.useState(entry?.entry_date ?? new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setContent(entry?.content ?? "");
      setMood(entry?.mood ?? null);
      setEntryDate(entry?.entry_date ?? new Date().toISOString().slice(0, 10));
      setError(null);
    }
  }, [open, entry]);

  async function handleSave() {
    if (!content.trim()) {
      setError("Write something before saving.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isEdit = Boolean(entry);
      const res = await fetch(isEdit ? `/api/journal/${entry!.id}` : "/api/journal", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title || null, content, mood, entryDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save entry");
      onSaved(data.entry);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={entry ? "Edit entry" : "New journal entry"} className="max-w-xl">
      <div className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="title">Title (optional)</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short title" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Mood</Label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? null : m)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  mood === m ? "border-clay-400 bg-clay-50 text-clay-800" : "border-ink-200 text-ink-500 hover:border-ink-300"
                )}
              >
                {MOOD_META[m].emoji} {MOOD_META[m].label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">What's on your mind?</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="Write freely — this is your space."
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save entry
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
