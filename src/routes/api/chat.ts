import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider, DEFAULT_MODEL } from "@/lib/ai-gateway";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("messages required", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const model = createLovableAiGatewayProvider(key)(DEFAULT_MODEL);
        const system = `You are Aria, a professional AI workplace productivity assistant. Be concise, practical, and helpful. Use markdown for structure when useful. Remind users that AI-generated content may require human review when giving consequential advice.`;
        const result = streamText({ model, system, messages: await convertToModelMessages(messages) });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});