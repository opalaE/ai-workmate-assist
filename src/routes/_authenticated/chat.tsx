import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Sparkles, Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/OutputCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({ component: ChatPage });

function ChatPage() {
  const { user } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [loadingThread, setLoadingThread] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingThread(true);
      const { data: existing } = await supabase.from("chat_threads").select("id").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      let tid = existing?.id;
      if (!tid) {
        const { data: created, error } = await supabase.from("chat_threads").insert({ user_id: user.id, title: "New chat" }).select("id").single();
        if (error) { toast.error(error.message); setLoadingThread(false); return; }
        tid = created.id;
      }
      const { data: msgs } = await supabase.from("chat_messages").select("*").eq("thread_id", tid).order("created_at");
      const ui: UIMessage[] = (msgs ?? []).map((m: any) => ({ id: m.id, role: m.role, parts: m.parts as any }));
      setThreadId(tid);
      setInitial(ui);
      setLoadingThread(false);
    })();
  }, [user]);

  if (loadingThread || !threadId || !initial) {
    return (
      <div>
        <PageHeader title="AI Chat" subtitle="Your always-on workplace assistant." icon={MessageSquare} />
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </div>
    );
  }
  return <ChatWindow key={threadId} threadId={threadId} initial={initial} userId={user!.id} onNew={async () => {
    const { data, error } = await supabase.from("chat_threads").insert({ user_id: user!.id, title: "New chat" }).select("id").single();
    if (error) return toast.error(error.message);
    setThreadId(data.id); setInitial([]);
  }} />;
}

function ChatWindow({ threadId, initial, userId, onNew }: { threadId: string; initial: UIMessage[]; userId: string; onNew: () => void }) {
  const [input, setInput] = useState("");
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" })).current;
  const { messages, sendMessage, status } = useChat({ id: threadId, messages: initial, transport, onError: (e) => toast.error(e.message) });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedRef = useRef<Set<string>>(new Set(initial.map((m) => m.id)));

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, status]);
  useEffect(() => { inputRef.current?.focus(); }, [threadId, status]);

  // Persist new messages when stream finishes
  useEffect(() => {
    if (status !== "ready") return;
    (async () => {
      for (const m of messages) {
        if (lastSavedRef.current.has(m.id)) continue;
        const { error } = await supabase.from("chat_messages").insert({
          thread_id: threadId, user_id: userId, role: m.role, parts: m.parts as any,
        });
        if (!error) lastSavedRef.current.add(m.id);
      }
      await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    })();
  }, [status, messages, threadId, userId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    sendMessage({ text: t });
    setInput("");
  };
  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="AI Chat" subtitle="Your always-on workplace assistant." icon={MessageSquare} />
        <Button variant="outline" size="sm" onClick={onNew}><Plus className="h-4 w-4 mr-2" />New chat</Button>
      </div>
      <Card className="border-border/60 shadow-[var(--shadow-card)] flex flex-col h-[65vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="h-12 w-12 mx-auto rounded-xl flex items-center justify-center text-primary-foreground" style={{ background: "var(--gradient-prestige)" }}>
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Ask anything — drafting, planning, summarizing, brainstorming.</p>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p: any) => (p.type === "text" ? p.text : "")).join("");
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm whitespace-pre-wrap">{text}</div>
                </div>
              );
            }
            return (
              <div key={m.id} className="max-w-[85%]">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Aria</div>
                <article className="prose prose-sm max-w-none prose-p:text-foreground/90 prose-headings:text-foreground"><ReactMarkdown>{text}</ReactMarkdown></article>
              </div>
            );
          })}
          {status === "submitted" && <div className="text-xs text-muted-foreground italic">Aria is thinking…</div>}
        </div>
        <form onSubmit={submit} className="border-t border-border/60 p-3 flex gap-2 items-end">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e as any); } }}
            placeholder="Message Aria..."
            rows={1}
            className="resize-none min-h-[44px] max-h-32"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary-glow text-primary-foreground h-11 w-11 shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </Card>
      <p className="text-[11px] text-muted-foreground mt-3 text-center">AI-generated content may require human review.</p>
    </div>
  );
}