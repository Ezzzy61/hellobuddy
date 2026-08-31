import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function relativeDay(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  const diffDays = Math.round((startOfDay(today).getTime() - startOfDay(d).getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return formatDate(d);
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function initials(name?: string | null): string {
  if (!name) return "B";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export const MOOD_META: Record<string, { label: string; emoji: string; color: string }> = {
  great: { label: "Great", emoji: "🌟", color: "bg-sage-200 text-sage-800" },
  good: { label: "Good", emoji: "🙂", color: "bg-sage-100 text-sage-700" },
  okay: { label: "Okay", emoji: "😐", color: "bg-cream-200 text-ink-700" },
  low: { label: "Low", emoji: "😔", color: "bg-clay-100 text-clay-800" },
  rough: { label: "Rough", emoji: "😞", color: "bg-clay-200 text-clay-900" },
};

export const GOAL_CATEGORY_LABEL: Record<string, string> = {
  health: "Health",
  fitness: "Fitness",
  career: "Career",
  finance: "Finance",
  relationships: "Relationships",
  personal_growth: "Personal Growth",
  education: "Education",
  custom: "Custom",
};

export const MEMORY_CATEGORY_LABEL: Record<string, string> = {
  about_me: "About Me",
  goals: "Goals",
  preferences: "Preferences",
  values: "Values",
  important_context: "Important Context",
  relationships: "Relationships",
  other: "Other",
};
