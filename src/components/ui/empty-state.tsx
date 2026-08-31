import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl2 border border-dashed border-ink-200 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-900/40 px-6 py-14 text-center",
        className
      )}
    >
      {icon && <div className="mb-4 text-ink-300 dark:text-ink-600">{icon}</div>}
      <h3 className="text-base font-semibold text-ink-800 dark:text-ink-100">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
