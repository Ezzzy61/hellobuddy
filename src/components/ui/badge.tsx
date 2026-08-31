import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "sage" | "clay" | "outline" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900",
  sage: "bg-sage-100 text-sage-800",
  clay: "bg-clay-100 text-clay-800",
  outline: "border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300",
  muted: "bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
