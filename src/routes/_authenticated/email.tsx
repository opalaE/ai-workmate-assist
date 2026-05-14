import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateEmail } from "@/lib/ai-features.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Loader2, Sparkles } from "lucide-react";
import { OutputCard, PageHeader } from "@/components/OutputCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/email")({ component: EmailPage });

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<any>("professional");
  const [length, setLength] = useState<any>("medium");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setOutput(null);
    try {
      const r = await fn({ data: { topic, audience, tone, length, context } });
      setOutput(r.output);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to generate"); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Smart Email Generator" subtitle="Draft on-tone, audience-aware emails in seconds." icon={Mail} />
      <Card className="p-6 border-border/60 shadow-[var(--shadow-card)]">
        <form onSubmit={submit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Audience</Label><Input value={audience} onChange={(e) => setAudience(e.target.value)} required maxLength={200} placeholder="e.g. Senior client, internal team..." /></div>
            <div className="space-y-1.5"><Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["professional","friendly","persuasive","concise","apologetic","enthusiastic"].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent></Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Topic / purpose</Label><Textarea value={topic} onChange={(e) => setTopic(e.target.value)} required minLength={3} maxLength={2000} rows={3} placeholder="What is this email about?" /></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1"><Label>Length</Label>
              <Select value={length} onValueChange={setLength}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="short">Short</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="long">Long</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5 md:col-span-2"><Label>Additional context (optional)</Label><Input value={context} onChange={(e) => setContext(e.target.value)} maxLength={2000} placeholder="Background or constraints" /></div>
          </div>
          <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary-glow text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate email
          </Button>
        </form>
      </Card>
      {output && <OutputCard output={output} />}
    </div>
  );
}