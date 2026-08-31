"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Sparkles, BookOpen, Loader2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { JournalEditor } from "@/components/journal/journal-editor";
import { useToast } from "@/components/ui/toast";
import { formatDate, MOOD_META } from "@/lib/utils";
import type { JournalEntry } from "@/types/database";

export function JournalView({ initialEntries }: { initialEntries: JournalEntry[] }) {
  const [entries, setEntries] = React.useState(initialEntries);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<JournalEntry | null>(null);
  const [reflectingId, setReflectingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  function handleSaved(entry: JournalEntry) {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      const next = exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [entry, ...prev];
      return next.sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
    });
    toast("Journal entry saved.");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this journal entry? This can't be undone.")) return;
    const prev = entries;
    setEntries((e) => e.filter((entry) => entry.id !== id));
    const res = await fetch(`/api/journal/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setEntries(prev);
      toast("Couldn't delete that entry.", "error");
    } else {
      toast("Entry deleted.");
    }
  }

  async function handleReflect(entry: JournalEntry) {
    setReflectingId(entry.id);
    try {
      const res = await fetch(`/api/journal/${entry.id}/reflect`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, ai_reflection: data.reflection } : e)));
    } catch {
      toast("Couldn't generate a reflection right now.", "error");
    } finally {
      setReflectingId(null);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Journal"
        description="Write freely. Your entries are private and only visible to you."
        action={
          <Button
            onClick={() => {
              setEditingEntry(null);
              setEditorOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> New entry
          </Button>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="Your journal is empty"
          description="Write your first entry — a feeling, a moment, anything on your mind today."
          action={
            <Button onClick={() => setEditorOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Write your first entry
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.title && <h3 className="font-medium text-ink-900 dark:text-ink-50">{entry.title}</h3>}
                      <span className="text-xs text-ink-400">{formatDate(entry.entry_date)}</span>
                      {entry.mood && (
                        <Badge variant="outline">
                          {MOOD_META[entry.mood].emoji} {MOOD_META[entry.mood].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditingEntry(entry);
                        setEditorOpen(true);
                      }}
                      className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="rounded-lg p-2 text-ink-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                  {entry.content}
                </p>

                {entry.ai_reflection ? (
                  <div className="mt-4 rounded-xl bg-sage-50 p-3.5 text-sm text-sage-800">
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sage-600">
                      <Sparkles className="h-3.5 w-3.5" /> Buddy's reflection
                    </p>
                    {entry.ai_reflection}
                  </div>
                ) : (
                  <button
                    onClick={() => handleReflect(entry)}
                    disabled={reflectingId === entry.id}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:underline disabled:opacity-60"
                  >
                    {reflectingId === entry.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Ask Buddy to reflect on this entry
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <JournalEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        entry={editingEntry}
        onSaved={handleSaved}
      />
    </PageContainer>
  );
}
