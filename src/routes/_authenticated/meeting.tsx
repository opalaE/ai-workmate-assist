import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { summarizeMeeting } from "@/lib/ai-features.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { NotebookPen, Loader2, Sparkles } from "lucide-react";
import { OutputCard, PageHeader } from "@/components/OutputCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meeting")({ component: Page });

function Page() {
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [meetingTitle, setTitle] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setOutput(null);
    try { const r = await fn({ data: { notes, meetingTitle } }); setOutput(r.output); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <PageHeader title="Meeting Notes Summarizer" subtitle="Paste raw notes or a transcript — get key points, decisions, and action items." icon={NotebookPen} />
      <Card className="p-6 border-border/60 shadow-[var(--shadow-card)]">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5"><Label>Meeting title (optional)</Label><Input value={meetingTitle} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Q3 product review" /></div>
          <div className="space-y-1.5"><Label>Raw notes / transcript</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} required minLength={20} maxLength={20000} rows={12} placeholder="Paste your meeting notes here..." /></div>
          <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary-glow text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}Summarize
          </Button>
        </form>
      </Card>
      {output && <OutputCard output={output} />}
    </div>
  );
}
