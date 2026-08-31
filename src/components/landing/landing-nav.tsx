import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/60 bg-cream-50/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">👋</span>
          <span className="font-serif text-lg font-semibold text-ink-900">HelloBuddy</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-600 md:flex">
          <a href="#talk" className="hover:text-ink-900">Talk</a>
          <a href="#remember" className="hover:text-ink-900">Remember</a>
          <a href="#reflect" className="hover:text-ink-900">Reflect</a>
          <a href="#grow" className="hover:text-ink-900">Grow</a>
          <a href="#beta" className="hover:text-ink-900">Beta</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Start Your Journey</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
