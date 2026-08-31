import * as React from "react";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "warning" | "error" | "success";

const variantStyles: Record<AlertVariant, { classes: string; Icon: typeof Info }> = {
  info: { classes: "bg-ink-50 dark:bg-ink-800/60 border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-200", Icon: Info },
  warning: { classes: "bg-clay-50 border-clay-200 text-clay-800", Icon: AlertTriangle },
  error: { classes: "bg-red-50 border-red-200 text-red-800", Icon: AlertTriangle },
  success: { classes: "bg-sage-50 border-sage-200 text-sage-800", Icon: CheckCircle2 },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { classes, Icon } = variantStyles[variant];
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", classes, className)} role="alert">
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-1 opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}
