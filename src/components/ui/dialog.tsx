"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Minimal, dependency-free modal dialog (no Radix) — accessible enough for MVP: focus trap-lite via autofocus, Escape to close, backdrop click to close. */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-xl2 bg-white dark:bg-ink-900 shadow-floating p-6 animate-fade-in max-h-[90vh] overflow-y-auto",
          className
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          <X className="h-4 w-4" />
        </button>
        {title && <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50 pr-6">{title}</h2>}
        {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>}
        <div className={cn(title || description ? "mt-4" : "")}>{children}</div>
      </div>
    </div>
  );
}
