"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { CommunicationStyle, Profile } from "@/types/database";
import Link from "next/link";

const STYLES: { key: CommunicationStyle; title: string; description: string }[] = [
  { key: "gentle", title: "Gentle", description: "Warm and encouraging." },
  { key: "honest", title: "Honest", description: "Direct, balanced and compassionate." },
  { key: "push_me", title: "Push Me", description: "Challenge excuses constructively." },
];

export function SettingsView({ profile, email }: { profile: Profile; email: string | null }) {
  const [preferredName, setPreferredName] = React.useState(profile.preferred_name ?? "");
  const [style, setStyle] = React.useState<CommunicationStyle>(profile.communication_style);
  const [saving, setSaving] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferredName, communicationStyle: style }),
      });
      if (!res.ok) throw new Error();
      toast("Settings saved.");
      router.refresh();
    } catch {
      toast("Couldn't save your settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your profile, communication style, and account." />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>{email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Preferred name</Label>
              <Input id="name" value={preferredName} onChange={(e) => setPreferredName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Communication style</CardTitle>
            <CardDescription>How should Buddy talk to you?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {STYLES.map((s) => (
              <button
                key={s.key}
                onClick={() => setStyle(s.key)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-colors",
                  style === s.key ? "border-clay-400 bg-clay-50" : "border-ink-200 hover:border-ink-300"
                )}
              >
                <p className="font-medium text-ink-900">{s.title}</p>
                <p className="mt-1 text-sm text-ink-500">{s.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-clay-500" /> Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <Badge variant={profile.plan === "premium" ? "sage" : "muted"} className="capitalize">
                {profile.plan}
              </Badge>
              <p className="mt-2 text-sm text-ink-500">
                {profile.plan === "free"
                  ? "You're on the free plan with a daily Buddy conversation limit."
                  : "You have unlimited daily conversations."}
              </p>
            </div>
            <Link href="/billing">
              <Button variant="outline" size="sm">
                {profile.plan === "free" ? "See Premium" : "Manage plan"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sage-500" /> Safety &amp; privacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="info">
              HelloBuddy is a personal reflection and growth companion — not therapy, a medical
              service, or an emergency resource. It cannot diagnose conditions and never claims
              certainty about you or people in your life. If you're in crisis, please contact
              local emergency services or a trusted person immediately.
            </Alert>
            <p className="mt-3 text-xs text-ink-400">
              Your journal, conversations, and memories are private to your account and protected
              by row-level security in the database — only you can access them.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-ink-900 dark:text-ink-50">Log out</p>
              <p className="text-xs text-ink-400">You'll need to log back in to continue.</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
