"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/components/nav/nav-items";
import { usePathname } from "next/navigation";

export function MobileTopbar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-100 bg-cream-50/90 px-4 py-3 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/90 lg:hidden">
      <Link href="/home" className="flex items-center gap-2">
        <span className="text-lg">👋</span>
        <span className="font-serif font-semibold text-ink-900 dark:text-ink-50">HelloBuddy</span>
      </Link>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Menu">
        <div className="grid grid-cols-2 gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-xl border border-ink-100 px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50 dark:border-ink-800 dark:text-ink-200"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
