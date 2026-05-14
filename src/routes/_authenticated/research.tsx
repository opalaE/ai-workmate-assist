import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { researchTopic } from "@/lib/ai-features.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import { OutputCard, PageHeader } from "@/components/OutputCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({ component: Page });

function Page() {
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<any>("overview");
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setOutput(null);
    try { const r = await fn({ data: { topic, depth } }); setOutput(r.output); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <PageHeader title="AI Research Assistant" subtitle="Get a structured briefing on any topic." icon={BookOpen} />
      <Card className="p-6 border-border/60 shadow-[var(--shadow-card)]">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5"><Label>Research topic</Label><Input value={topic} onChange={(e) => setTopic(e.target.value)} required minLength={3} maxLength={500} placeholder="e.g. Trends in remote-first hiring 2025" /></div>
          <div className="space-y-1.5 max-w-xs"><Label>Depth</Label>
            <Select value={depth} onValueChange={setDepth}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="overview">Overview</SelectItem><SelectItem value="deep_dive">Deep dive</SelectItem></SelectContent></Select>
          </div>
          <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary-glow text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}Research
          </Button>
        </form>
      </Card>
      {output && <OutputCard output={output} />}
    </div>
  );
}
