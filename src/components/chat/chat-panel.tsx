"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble, TypingIndicator, type DisplayMessage } from "@/components/chat/message-bubble";
import { UsageBanner } from "@/components/chat/usage-banner";
import type { UsageStatus } from "@/lib/usage";
import type { ConversationMode } from "@/types/database";
import { useToast } from "@/components/ui/toast";

export function ChatPanel({
  mode,
  initialConversationId,
  initialMessages,
  initialUsage,
  placeholder = "What's on your mind?",
  onExchange,
}: {
  mode: ConversationMode;
  initialConversationId?: string;
  initialMessages: DisplayMessage[];
  initialUsage: UsageStatus | null;
  placeholder?: string;
  onExchange?: (userText: string, replyText: string) => void;
}) {
  const [conversationId, setConversationId] = React.useState<string | undefined>(initialConversationId);
  const [messages, setMessages] = React.useState<DisplayMessage[]>(initialMessages);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [usage, setUsage] = React.useState<UsageStatus | null>(initialUsage);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    if (usage?.limitReached) return;

    const optimisticUser: DisplayMessage = { id: `local-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: text, mode }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setUsage(data.usage);
        toast("You've reached today's Buddy limit.", "error");
        return;
      }
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setConversationId(data.conversationId);
      setUsage(data.usage);
      setMessages((prev) => [
        ...prev,
        {
          id: `reply-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          isDemo: data.isDemo,
          isCrisis: data.isCrisis,
        },
      ]);
      onExchange?.(text, data.reply);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't reach Buddy. Please try again.", "error");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <UsageBanner usage={usage} />
      <div ref={scrollRef} className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {sending && <TypingIndicator />}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-ink-100 bg-white/70 p-3 backdrop-blur sm:p-4 dark:border-ink-800 dark:bg-ink-900/60"
      >
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={usage?.limitReached ? "You've reached today's Buddy limit." : placeholder}
            disabled={sending || usage?.limitReached}
            rows={1}
            className="min-h-[46px] flex-1 resize-none py-3"
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim() || usage?.limitReached}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
