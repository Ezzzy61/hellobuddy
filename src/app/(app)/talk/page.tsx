import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { getUsageStatus } from "@/lib/usage";
import { ChatPanel } from "@/components/chat/chat-panel";
import type { DisplayMessage } from "@/components/chat/message-bubble";

export default async function TalkPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const supabase = createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", current.userId)
    .eq("mode", "talk")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let initialMessages: DisplayMessage[] = [];
  if (conversation) {
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(50);
    initialMessages = (messages ?? []).map((m) => ({
      id: m.id,
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
      isDemo: Boolean((m.metadata as any)?.isDemo),
      isCrisis: Boolean((m.metadata as any)?.isCrisis),
    }));
  }

  const usage = await getUsageStatus(supabase, current.userId);

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col lg:h-screen">
      <div className="border-b border-ink-100 px-4 py-5 sm:px-6 dark:border-ink-800">
        <p className="text-2xl">👋</p>
        <h1 className="mt-1 font-serif text-xl font-semibold text-ink-900 dark:text-ink-50 sm:text-2xl">
          Hey, {current.profile?.preferred_name || "Buddy"}. What's on your mind?
        </h1>
      </div>
      <div className="min-h-0 flex-1">
        <ChatPanel
          mode="talk"
          initialConversationId={conversation?.id}
          initialMessages={initialMessages}
          initialUsage={usage}
        />
      </div>
    </div>
  );
}
