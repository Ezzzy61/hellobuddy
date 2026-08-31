import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-50 px-6 text-center">
      <p className="text-3xl">🤔</p>
      <h1 className="font-serif text-xl font-semibold text-ink-900">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-500">The page you're looking for doesn't exist or may have moved.</p>
      <Link href="/">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
