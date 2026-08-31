"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { CommunicationStyle } from "@/types/database";

const LIFE_AREAS: { key: string; label: string }[] = [
  { key: "health", label: "Health" },
  { key: "career", label: "Career" },
  { key: "relationships", label: "Relationships" },
  { key: "family", label: "Family" },
  { key: "social", label: "Friends / social life" },
  { key: "personal_growth", label: "Personal growth" },
  { key: "work_life_balance", label: "Work-life balance" },
];

const STYLES: { key: CommunicationStyle; title: string; description: string }[] = [
  { key: "gentle", title: "Gentle", description: "Warm and encouraging." },
  { key: "honest", title: "Honest", description: "Direct, balanced and compassionate. (Recommended)" },
  { key: "push_me", title: "Push Me", description: "Challenge excuses constructively, without insults or humiliation." },
];

const TOTAL_STEPS = 6;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [preferredName, setPreferredName] = React.useState("");
  const [currentLifeContext, setCurrentLifeContext] = React.useState("");
  const [currentPriorities, setCurrentPriorities] = React.useState("");
  const [shortTermGoal, setShortTermGoal] = React.useState("");
  const [longTermGoal, setLongTermGoal] = React.useState("");
  const [ratings, setRatings] = React.useState<Record<string, number>>({});
  const [style, setStyle] = React.useState<CommunicationStyle>("honest");
  const [safetyAck, setSafetyAck] = React.useState(false);

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredName: preferredName || "Friend",
          currentLifeContext,
          currentPriorities,
          shortTermGoal,
          longTermGoal,
          lifeAreaRatings: ratings,
          communicationStyle: style,
          safetyAck,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong saving your answers.");
      }
      router.push("/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-clay-400" : "bg-ink-100"
              )}
            />
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {step === 0 && (
        <Step title="Let's get to know you." description="Just a few quick questions — skip anything optional.">
          <div className="space-y-1.5">
            <Label htmlFor="name">What should Buddy call you?</Label>
            <Input
              id="name"
              autoFocus
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              placeholder="Your preferred name or nickname"
            />
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step title="What's going on in your life right now?" description="Optional — share as much or as little as you'd like.">
          <div className="space-y-1.5">
            <Label htmlFor="context">What's currently happening in your life?</Label>
            <Textarea
              id="context"
              value={currentLifeContext}
              onChange={(e) => setCurrentLifeContext(e.target.value)}
              placeholder="e.g. Starting a new job, going through a big transition, feeling stretched thin..."
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priorities">What matters most to you right now?</Label>
            <Textarea
              id="priorities"
              value={currentPriorities}
              onChange={(e) => setCurrentPriorities(e.target.value)}
              placeholder="e.g. Getting healthier, being more present with family..."
              rows={3}
            />
          </div>
        </Step>
      )}

      {step === 2 && (
        <Step title="Any goals on your mind?" description="Optional — you can always add more later in Goals.">
          <div className="space-y-1.5">
            <Label htmlFor="short">A short-term goal</Label>
            <Input
              id="short"
              value={shortTermGoal}
              onChange={(e) => setShortTermGoal(e.target.value)}
              placeholder="e.g. Go to the gym 3x this week"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="long">A long-term goal</Label>
            <Input
              id="long"
              value={longTermGoal}
              onChange={(e) => setLongTermGoal(e.target.value)}
              placeholder="e.g. Feel confident and healthy in my body"
            />
          </div>
        </Step>
      )}

      {step === 3 && (
        <Step
          title="How satisfied do you feel right now?"
          description="These are self-reflections, not measurements of anything clinical. Optional — skip any you'd rather not rate."
        >
          <div className="space-y-5">
            {LIFE_AREAS.map((area) => (
              <div key={area.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-ink-700">{area.label}</span>
                  <span className="text-ink-400">{ratings[area.key] ?? "—"}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={ratings[area.key] ?? 5}
                  onChange={(e) =>
                    setRatings((r) => ({ ...r, [area.key]: Number(e.target.value) }))
                  }
                  className="w-full accent-clay-500"
                />
              </div>
            ))}
          </div>
        </Step>
      )}

      {step === 4 && (
        <Step title="How should Buddy talk to you?" description="You can change this anytime in Settings.">
          <div className="space-y-3">
            {STYLES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStyle(s.key)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-colors",
                  style === s.key
                    ? "border-clay-400 bg-clay-50"
                    : "border-ink-200 hover:border-ink-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink-900">{s.title}</span>
                  {style === s.key && <Check className="h-4 w-4 text-clay-600" />}
                </div>
                <p className="mt-1 text-sm text-ink-500">{s.description}</p>
              </button>
            ))}
          </div>
        </Step>
      )}

      {step === 5 && (
        <Step title="One important thing." description="Please read before you continue.">
          <Alert variant="info">
            HelloBuddy is a personal reflection and growth companion. It is <strong>not</strong>{" "}
            a therapist, doctor, or emergency service, and it can't diagnose anything. If you're
            ever in crisis or in danger, please contact local emergency services or a trusted
            person right away.
          </Alert>
          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={safetyAck}
              onChange={(e) => setSafetyAck(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-clay-500"
            />
            I understand HelloBuddy is not a substitute for professional or emergency care.
          </label>
        </Step>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0 || submitting} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < TOTAL_STEPS - 1 ? (
          <Button onClick={next} disabled={step === 0 && !preferredName.trim()} className="gap-1.5">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={!safetyAck || submitting} className="gap-1.5">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Meet Buddy <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Step({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-ink-900">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}
