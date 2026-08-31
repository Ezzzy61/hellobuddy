import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildTalkContext } from "@/lib/ai/context-builder";
import { buildConfusedModePrompt } from "@/lib/ai/prompts";
import { safeChat } from "@/lib/ai";
import { getUsageStatus, incrementUsage } from "@/lib/usage";
import { trackEvent } from "@/lib/analytics";
import { maybeExtractMemories } from "@/lib/ai/memory-extraction";
import type { ConversationMode } from "@/types/database";

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4000),
  mode: z.enum(["talk", "confused", "honest_mirror"]).default("talk"),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { conversationId, message, mode } = parsed.data;

  const usage = await getUsageStatus(supabase, user.id);
  if (usage.limitReached) {
    return NextResponse.json(
      {
        error: "limit_reached",
        message: "You've reached today's Buddy limit.",
        usage,
      },
      { status: 402 }
    );
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let activeConversationId = conversationId;
  let isFirstMessageInConversation = false;

  if (!activeConversationId) {
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, mode: mode as ConversationMode, title: message.slice(0, 60) })
      .select("id")
      .single();
    if (convError || !conversation) {
      return NextResponse.json({ error: "Could not start conversation" }, { status: 500 });
    }
    activeConversationId = conversation.id;
    isFirstMessageInConversation = true;
  }

  await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    user_id: user.id,
    role: "user",
    content: message,
  });

  const { systemPrompt, recentMessages } = await buildTalkContext({
    supabase,
    userId: user.id,
    conversationId: activeConversationId,
    queryText: message,
    communicationStyle: profile.communication_style,
    preferredName: profile.preferred_name,
    extraInstructions: mode === "confused" ? buildConfusedModePrompt(profile.communication_style) : undefined,
  });

  const chatMessages = [
    ...recentMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  const result = await safeChat({ systemPrompt, messages: chatMessages });

  await supabase.from("messages").insert({
    conversation_id: activeConversationId,
    user_id: user.id,
    role: "assistant",
    content: result.content,
    metadata: { isDemo: result.isDemo, isCrisis: Boolean(result.isCrisis), mode },
  });

  if (!result.isCrisis) {
    await incrementUsage(supabase, user.id);
  }

  // Non-blocking-ish best-effort memory suggestion (never breaks chat response on failure).
  maybeExtractMemories(supabase, user.id, message).catch((err) =>
    console.error("[chat] memory extraction failed", err)
  );

  if (isFirstMessageInConversation) {
    await trackEvent(supabase, user.id, "first_conversation", { mode });
  }
  if (mode === "honest_mirror") {
    await trackEvent(supabase, user.id, "honest_mirror_triggered", {});
  }

  const updatedUsage = await getUsageStatus(supabase, user.id);

  return NextResponse.json({
    conversationId: activeConversationId,
    reply: result.content,
    isDemo: result.isDemo,
    isCrisis: Boolean(result.isCrisis),
    usage: updatedUsage,
  });
}
