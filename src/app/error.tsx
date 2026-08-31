"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-100 text-clay-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="font-serif text-xl font-semibold text-ink-900">Something went wrong</h1>
      <p className="max-w-sm text-sm text-ink-500">
        Buddy hit a snag. This has been logged — try again, or head back home.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/home")}>
          Go home
        </Button>
      </div>
    </div>
  );
}
