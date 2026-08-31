"use client";

import * as React from "react";
import { Loader2, Check, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { DailyCheckin } from "@/types/database";

const FEELINGS = ["Great", "Good", "Okay", "Low", "Rough"];

export function CheckinWidget({ initialCheckin }: { initialCheckin: DailyCheckin | null }) {
  const [checkin, setCheckin] = React.useState(initialCheckin);
  const [feeling, setFeeling] = React.useState(initialCheckin?.feeling ?? "");
  const [onMind, setOnMind] = React.useState(initialCheckin?.on_mind ?? "");
  const [focus, setFocus] = React.useState(initialCheckin?.focus ?? "");
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(!initialCheckin);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeling, onMind, focus }),
      });
      const data = await res.json();
      if (res.ok) {
        setCheckin(data.checkin);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (checkin && !editing) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-sage-700">
              <Check className="h-4 w-4" /> Today's check-in
            </p>
            <button onClick={() => setEditing(true)} className="text-xs text-ink-400 hover:underline">
              Edit
            </button>
          </div>
          <div className="mt-3 space-y-1.5 text-sm text-ink-600">
            {checkin.feeling && <p><span className="font-medium text-ink-800">Feeling:</span> {checkin.feeling}</p>}
            {checkin.on_mind && <p><span className="font-medium text-ink-800">On your mind:</span> {checkin.on_mind}</p>}
            {checkin.focus && <p><span className="font-medium text-ink-800">Focus today:</span> {checkin.focus}</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink-800 dark:text-ink-100">
          <Sun className="h-4 w-4 text-clay-500" /> Daily check-in
        </p>

        {step === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-ink-600">How are you feeling today?</p>
            <div className="flex flex-wrap gap-2">
              {FEELINGS.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFeeling(f);
                    setStep(1);
                  }}
                  className={`rounded-full border px-3.5 py-1.5 text-sm ${
                    feeling === f ? "border-clay-400 bg-clay-50 text-clay-800" : "border-ink-200 text-ink-500 hover:border-ink-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2">
            <p className="text-sm text-ink-600">What's one thing on your mind?</p>
            <Input value={onMind} onChange={(e) => setOnMind(e.target.value)} placeholder="One thing..." autoFocus />
            <Button size="sm" onClick={() => setStep(2)} className="mt-1">
              Next
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2">
            <p className="text-sm text-ink-600">What's one thing you'd like to focus on?</p>
            <Textarea value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="One focus for today..." rows={2} autoFocus />
            <Button size="sm" onClick={save} disabled={saving} className="mt-1 gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save check-in
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
