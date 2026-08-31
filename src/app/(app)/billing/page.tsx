import { Sparkles, Check } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PREMIUM_FEATURES = [
  "Unlimited daily conversations with Buddy",
  "Deeper reflection and pattern analysis",
  "Priority access to new features",
  "Extended memory and context retrieval",
];

export default function BillingPage() {
  return (
    <PageContainer>
      <PageHeader title="Premium" description="Billing isn't live yet — here's what's coming." />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-clay-500 to-clay-600 p-8 text-white">
          <Badge className="bg-white/20 text-white">Coming soon</Badge>
          <h2 className="mt-3 font-serif text-2xl font-semibold">HelloBuddy Premium</h2>
          <p className="mt-2 max-w-md text-sm text-clay-50">
            We're building a premium tier for people who want more from HelloBuddy. Payments
            aren't set up yet — this page previews what's ahead.
          </p>
        </div>
        <CardContent className="space-y-3 p-6">
          {PREMIUM_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3 text-sm text-ink-700 dark:text-ink-200">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-600">
                <Check className="h-3 w-3" />
              </div>
              {f}
            </div>
          ))}
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-ink-50 p-4 text-sm text-ink-500 dark:bg-ink-800">
            <Sparkles className="h-4 w-4 shrink-0 text-clay-500" />
            Want early access when Premium launches? Keep using HelloBuddy — we'll let early
            users know first.
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
