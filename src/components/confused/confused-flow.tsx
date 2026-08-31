"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface StepDef {
  key: string;
  question: string;
  placeholder: string;
}

const STEPS: StepDef[] = [
  { key: "whatHappened", question: "What happened?", placeholder: "Describe the situation, as plainly as you can." },
  { key: "howFeeling", question: "How are you feeling?", placeholder: "Name the feelings, even if there are several." },
  { key: "facts", question: "What facts do you know?", placeholder: "Only things you know for certain — not interpretations." },
  { key: "assumptions", question: "What assumptions might you be making?", placeholder: "What are you filling in, that you don't actually know?" },
  { key: "options", question: "What options do you have?", placeholder: "List as many as you can, even ones that seem unlikely." },
  { key: "whatMatters", question: "What matters most?", placeholder: "What's the thing you don't want to lose sight of?" },
  { key: "biggestFear", question: "What are you most afraid of?", placeholder: "Be honest — this stays between you and Buddy." },
  { key: "regret", question: "What would you regret more?", placeholder: "Acting, or not acting? Which feels worse in a year?" },
];

export function ConfusedFlow() {
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [synthesis, setSynthesis] = React.useState<string | null>(null);
  const [isCrisis, setIsCrisis] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const current = STEPS[step];

  function updateAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/confused/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setError(data.message);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSynthesis(data.synthesis);
      setIsCrisis(Boolean(data.isCrisis));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setSynthesis(null);
    setError(null);
  }

  if (synthesis) {
    return (
      <PageContainer>
        <PageHeader title="I'm Confused" description="Here's what Buddy noticed, based on what you shared." />
        <div
          className={cn(
            "whitespace-pre-wrap rounded-xl2 border p-6 text-sm leading-relaxed shadow-soft",
            isCrisis ? "border-clay-300 bg-clay-50 text-clay-900" : "border-ink-100 bg-white text-ink-800 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100"
          )}
        >
          {synthesis}
        </div>
        <Button variant="outline" onClick={reset} className="mt-5 gap-1.5">
          <RotateCcw className="h-4 w-4" /> Start a new reflection
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="I'm confused." description="Let's slow down and think through it." />

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mb-6 flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-clay-400" : "bg-ink-100")} />
        ))}
      </div>

      <div className="rounded-xl2 border border-ink-100 bg-white p-6 shadow-soft dark:border-ink-800 dark:bg-ink-900">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-400">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink-900 dark:text-ink-50">{current.question}</h2>
        <Textarea
          value={answers[current.key] ?? ""}
          onChange={(e) => updateAnswer(e.target.value)}
          placeholder={current.placeholder}
          rows={6}
          autoFocus
        />

        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} className="gap-1.5">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              See my reflection
            </Button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-ink-400">
        You can skip any question — Buddy will work with whatever you share.
      </p>
    </PageContainer>
  );
}
