"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { NAV_ITEMS } from "@/components/nav/nav-items";
import { cn, initials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Plan } from "@/types/database";

export function Sidebar({ preferredName, plan }: { preferredName?: string | null; plan: Plan }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-100 bg-white/60 dark:border-ink-800 dark:bg-ink-900/40 lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="text-xl">👋</span>
        <span className="font-serif text-lg font-semibold text-ink-900 dark:text-ink-50">HelloBuddy</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-clay-50 text-clay-700 dark:bg-clay-500/10 dark:text-clay-300"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {plan === "free" && (
        <Link
          href="/billing"
          className="mx-3 mb-3 flex items-center gap-2 rounded-xl border border-dashed border-clay-300 bg-clay-50/60 px-3 py-2.5 text-xs font-medium text-clay-700 hover:bg-clay-50"
        >
          <Sparkles className="h-3.5 w-3.5" /> Premium — coming soon
        </Link>
      )}

      <div className="flex items-center gap-3 border-t border-ink-100 px-4 py-4 dark:border-ink-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-sage-700">
          {initials(preferredName)}
        </div>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">
            {preferredName || "Friend"}
          </p>
          <p className="text-xs capitalize text-ink-400">{plan} plan</p>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
