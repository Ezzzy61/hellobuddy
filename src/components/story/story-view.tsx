"use client";

import * as React from "react";
import { ScrollText, Sparkles, Loader2 } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { PotentialMemoryCard } from "@/components/memory/potential-memory-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import type { Memory, PotentialMemory } from "@/types/database";

export function StoryView({ initialPending }: { initialPending: PotentialMemory[] }) {
  const [text, setText] = React.useState("");
  const [pending, setPending] = React.useState(initialPending);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  async function handleAnalyze() {
    setError(null);
    if (text.trim().split(/\s+/).length < 5) {
      setError("Paste a bit more so Buddy has something to work with.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/story/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong analyzing that.");
      if (data.suggestions.length === 0) {
        toast("No clear memories stood out from that text — feel free to try a different excerpt.");
      } else {
        setPending((prev) => [...data.suggestions, ...prev]);
        toast(`Buddy found ${data.suggestions.length} potential memor${data.suggestions.length === 1 ? "y" : "ies"} to review.`);
      }
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleResolved(id: string, approved?: Memory) {
    setPending((prev) => prev.filter((p) => p.id !== id));
    toast(approved ? "Memory saved." : "Suggestion dismissed.");
  }

  return (
    <PageContainer>
      <PageHeader title="My Story" description="Your story didn't start with HelloBuddy." />

      <Alert variant="info" className="mb-6">
        Paste old journal entries, notes, or a personal life summary. Buddy will suggest a handful
        of potential memories — you decide what's kept, edited, or rejected. Nothing is saved
        automatically.
      </Alert>

      <div className="mb-8 rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft dark:border-ink-800 dark:bg-ink-900">
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a previous journal entry, notes, or a summary of where you're at in life..."
          rows={10}
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-ink-400">{text.trim() ? `${text.trim().split(/\s+/).length} words` : "Paste text, then let Buddy suggest memories"}</p>
          <Button onClick={handleAnalyze} disabled={analyzing || !text.trim()} className="gap-1.5">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
          Suggested memories ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-10 w-10" />}
            title="No suggestions yet"
            description="Paste something above and Buddy will suggest a few memories worth remembering, for you to review."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <PotentialMemoryCard key={p.id} memory={p} onResolved={handleResolved} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
