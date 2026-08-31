import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { UsageStatus } from "@/lib/usage";

export function UsageBanner({ usage }: { usage: UsageStatus | null }) {
  if (!usage || usage.plan === "premium" || usage.limit === null) return null;

  if (usage.limitReached) {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-clay-200 bg-clay-50 p-4 text-sm text-clay-800 sm:mx-6">
        <p className="font-medium">You've reached today's Buddy limit.</p>
        <p className="mt-1 text-clay-700">Thanks for spending time with Buddy today. Your limit resets tomorrow.</p>
        <Link href="/billing" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-clay-700 underline">
          <Sparkles className="h-3.5 w-3.5" /> See Premium (coming soon)
        </Link>
      </div>
    );
  }

  if (usage.remaining !== null && usage.remaining <= 5) {
    return (
      <div className="mx-4 mb-3 rounded-xl border border-ink-100 bg-ink-50 p-3 text-xs text-ink-500 sm:mx-6 dark:border-ink-800 dark:bg-ink-900">
        {usage.remaining} message{usage.remaining === 1 ? "" : "s"} left today on the free plan.
      </div>
    );
  }

  return null;
}
