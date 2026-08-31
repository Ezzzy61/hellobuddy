import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isDemo?: boolean;
  isCrisis?: boolean;
}

export function MessageBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%]",
          isUser
            ? "rounded-tr-sm bg-ink-900 text-white dark:bg-ink-100 dark:text-ink-900"
            : message.isCrisis
            ? "rounded-tl-sm border border-clay-300 bg-clay-50 text-clay-900"
            : "rounded-tl-sm bg-white text-ink-800 shadow-soft dark:bg-ink-800 dark:text-ink-100"
        )}
      >
        {message.isCrisis && !isUser && (
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-clay-700">
            <AlertTriangle className="h-3.5 w-3.5" /> Please read this
          </div>
        )}
        {message.content}
        {message.isDemo && !isUser && (
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">Demo mode</p>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white px-4 py-3.5 shadow-soft dark:bg-ink-800">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: "0ms" }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: "150ms" }} />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-400" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
