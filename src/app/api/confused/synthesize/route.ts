import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildTalkContext } from "@/lib/ai/context-builder";
import { buildConfusedModePrompt, detectImminentRisk, SELF_HARM_CRISIS_RESPONSE } from "@/lib/ai/prompts";
import { getAIProvider } from "@/lib/ai";
import { getUsageStatus, incrementUsage } from "@/lib/usage";
import { trackEvent } from "@/lib/analytics";

const answersSchema = z.object({
  whatHappened: z.string().trim().max(3000).optional(),
  howFeeling: z.string().trim().max(1000).optional(),
  facts: z.string().trim().max(2000).optional(),
  assumptions: z.string().trim().max(2000).optional(),
  options: z.string().trim().max(2000).optional(),
  whatMatters: z.string().trim().max(1000).optional(),
  biggestFear: z.string().trim().max(1000).optional(),
  regret: z.string().trim().max(1000).optional(),
});

const bodySchema = z.object({ answers: answersSchema });

const STEP_LABELS: Record<keyof z.infer<typeof answersSchema>, string> = {
  whatHappened: "What happened?",
  howFeeling: "How are you feeling?",
  facts: "What facts do you know?",
  assumptions: "What assumptions might you be making?",
  options: "What options do you have?",
  whatMatters: "What matters most?",
  biggestFear: "What are you most afraid of?",
  regret: "What would you regret more?",
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { answers } = parsed.data;

  const combinedText = (Object.keys(answers) as (keyof typeof answers)[])
    .filter((k) => answers[k])
    .map((k) => `${STEP_LABELS[k]}\n${answers[k]}`)
    .join("\n\n");

  if (!combinedText.trim()) {
    return NextResponse.json({ error: "Answer at least one question first." }, { status: 400 });
  }

  if (detectImminentRisk(combinedText)) {
    return NextResponse.json({ synthesis: SELF_HARM_CRISIS_RESPONSE, isCrisis: true });
  }

  const usage = await getUsageStatus(supabase, user.id);
  if (usage.limitReached) {
    return NextResponse.json({ error: "limit_reached", message: "You've reached today's Buddy limit.", usage }, { status: 402 });
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: conversation } = await supabase
    .from("conversations")
    .insert({ user_id: user.id, mode: "confused", title: "I'm Confused session" })
    .select("id")
    .single();

  const { systemPrompt } = await buildTalkContext({
    supabase,
    userId: user.id,
    queryText: combinedText,
    communicationStyle: profile.communication_style,
    preferredName: profile.preferred_name,
    extraInstructions: buildConfusedModePrompt(profile.communication_style),
  });

  const provider = getAIProvider();
  const synthesis = await provider.reflect({
    instructions: `${systemPrompt}\n\nThe user has worked through the "I'm Confused" structured reflection below. Produce a synthesis using EXACTLY these section headers, each on its own line, followed by 1-3 sentences: "Honest Reflection", "Facts vs Assumptions", "What Seems Important", "Possible Options", "A Small Next Step". Ground it in what the user actually wrote — quote or paraphrase specifics rather than staying abstract. Use humble language ("Based on what you've shared...").`,
    context: combinedText,
  });

  if (conversation) {
    await supabase.from("messages").insert([
      { conversation_id: conversation.id, user_id: user.id, role: "user", content: combinedText },
      { conversation_id: conversation.id, user_id: user.id, role: "assistant", content: synthesis, metadata: { mode: "confused" } },
    ]);
  }

  await incrementUsage(supabase, user.id);
  await trackEvent(supabase, user.id, "confused_session_completed", {});

  return NextResponse.json({ synthesis, conversationId: conversation?.id });
}
