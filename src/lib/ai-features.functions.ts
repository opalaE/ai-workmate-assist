import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "./ai-gateway";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return createLovableAiGatewayProvider(key)(DEFAULT_MODEL);
}

async function saveOutput(supabase: any, userId: string, feature: string, title: string, input: unknown, output: string) {
  const { error } = await supabase.from("generated_outputs").insert({
    user_id: userId, feature, title, input: input as any, output,
  });
  if (error) console.error("save output error", error);
}

/* ---------------- Email Generator ---------------- */
const emailSchema = z.object({
  topic: z.string().min(3).max(2000),
  audience: z.string().min(1).max(200),
  tone: z.enum(["professional", "friendly", "persuasive", "concise", "apologetic", "enthusiastic"]),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  context: z.string().max(2000).optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => emailSchema.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an expert business communications writer. Write polished, professional emails that match the requested tone and audience.
Rules:
- Always include a strong subject line on the first line as: "Subject: ..."
- Then a greeting, 1-3 short paragraphs of body, a clear call to action, and a sign-off ("Best regards,").
- Keep it appropriate for workplace/business context.
- Length guidelines: short = under 80 words; medium = 100-180 words; long = 200-320 words.
- Use plain text only. No markdown headings.`;
    const prompt = `Write an email.\n\nAudience: ${data.audience}\nTone: ${data.tone}\nDesired length: ${data.length}\nTopic / purpose: ${data.topic}\nAdditional context: ${data.context || "(none)"}\n\nReturn only the email.`;
    const { text } = await generateText({ model: getModel(), system, prompt });
    await saveOutput(context.supabase, context.userId, "email", data.topic.slice(0, 80), data, text);
    return { output: text };
  });

/* ---------------- Meeting Notes Summarizer ---------------- */
const meetingSchema = z.object({
  notes: z.string().min(20).max(20000),
  meetingTitle: z.string().max(200).optional().default(""),
});
export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => meetingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an expert executive assistant. Convert raw meeting notes or transcripts into a clean, structured summary.
Output strictly in markdown with these sections (omit a section only if truly nothing applies):

## Summary
2-4 sentence overview.

## Key Discussion Points
- bullets

## Decisions
- bullets

## Action Items
- [ ] **<owner>** — <action> _(due: <date or "TBD">)_

## Deadlines
- <date> — <what>

Be concise and faithful to the source. Do not invent owners; use "Unassigned" if unknown.`;
    const prompt = `Meeting title: ${data.meetingTitle || "(untitled)"}\n\nRaw notes:\n${data.notes}`;
    const { text } = await generateText({ model: getModel(), system, prompt });
    await saveOutput(context.supabase, context.userId, "meeting", data.meetingTitle || "Meeting summary", data, text);
    return { output: text };
  });

/* ---------------- Task Planner ---------------- */
const tasksSchema = z.object({
  goals: z.string().min(5).max(5000),
  horizon: z.enum(["today", "this_week", "this_sprint"]).default("today"),
  constraints: z.string().max(2000).optional().default(""),
});
export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => tasksSchema.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are a senior productivity coach. Take a brain-dump of goals and produce a prioritized, scheduled plan.
Output in markdown:

## Priorities (Eisenhower)
| # | Task | Urgency | Importance | Est. time |
|---|------|---------|------------|-----------|

## Suggested Schedule
Block the work into a realistic schedule for the chosen horizon. Use H:MM time blocks for "today", day labels (Mon, Tue...) for "this_week", week labels (W1, W2) for "this_sprint".

## Focus Tip
One short, specific recommendation.

Be realistic, group related items, and account for breaks.`;
    const prompt = `Horizon: ${data.horizon}\nConstraints: ${data.constraints || "(none)"}\n\nGoals / brain dump:\n${data.goals}`;
    const { text } = await generateText({ model: getModel(), system, prompt });
    await saveOutput(context.supabase, context.userId, "tasks", `Plan — ${data.horizon}`, data, text);
    return { output: text };
  });

/* ---------------- Research Assistant ---------------- */
const researchSchema = z.object({
  topic: z.string().min(3).max(500),
  depth: z.enum(["overview", "deep_dive"]).default("overview"),
});
export const researchTopic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => researchSchema.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an analyst producing structured research briefings for busy professionals.
Output in markdown:

## Executive Summary
3-4 sentences.

## Key Insights
- 5-7 bullets, each with a concrete claim.

## Background
1-2 short paragraphs.

## Considerations / Trade-offs
- bullets

## Recommended Next Steps
- bullets

## Caveats
Note that this is AI-generated and may need verification against primary sources. Do not fabricate statistics or sources.`;
    const prompt = `Research topic: ${data.topic}\nDepth: ${data.depth}`;
    const { text } = await generateText({ model: getModel(), system, prompt });
    await saveOutput(context.supabase, context.userId, "research", data.topic, data, text);
    return { output: text };
  });

/* ---------------- History ---------------- */
export const listOutputs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ feature: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("generated_outputs").select("*").order("created_at", { ascending: false }).limit(20);
    if (data.feature) q = q.eq("feature", data.feature);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [] };
  });

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count: outputCount } = await context.supabase.from("generated_outputs").select("*", { count: "exact", head: true });
    const { count: threadCount } = await context.supabase.from("chat_threads").select("*", { count: "exact", head: true });
    const { data: recent } = await context.supabase.from("generated_outputs").select("id,feature,title,created_at").order("created_at", { ascending: false }).limit(5);
    return {
      outputCount: outputCount ?? 0,
      threadCount: threadCount ?? 0,
      recent: recent ?? [],
    };
  });