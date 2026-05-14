import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { planTasks } from "@/lib/ai-features.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListChecks, Loader2, Sparkles } from "lucide-react";
import { OutputCard, PageHeader } from "@/components/OutputCard";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({ component: Page });

function Page() {
  const fn = useServerFn(planTasks);
  const [goals, setGoals] = useState("");
  const [horizon, setHorizon] = useState<any>("today");
  const [constraints, setConstraints] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setOutput(null);
    try { const r = await fn({ data: { goals, horizon, constraints } }); setOutput(r.output); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  };
  return (
    <div>
      <PageHeader title="AI Task Planner" subtitle="Brain-dump your goals — get a prioritized, scheduled plan." icon={ListChecks} />
      <Card className="p-6 border-border/60 shadow-[var(--shadow-card)]">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5"><Label>Goals / brain dump</Label><Textarea value={goals} onChange={(e) => setGoals(e.target.value)} required minLength={5} maxLength={5000} rows={8} placeholder="List everything on your mind..." /></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Horizon</Label>
              <Select value={horizon} onValueChange={setHorizon}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="today">Today</SelectItem><SelectItem value="this_week">This week</SelectItem><SelectItem value="this_sprint">This sprint</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1.5 md:col-span-2"><Label>Constraints (optional)</Label><Input value={constraints} onChange={(e) => setConstraints(e.target.value)} maxLength={2000} placeholder="e.g. 2hr meeting at 2pm, prefer mornings for deep work" /></div>
          </div>
          <Button type="submit" disabled={busy} className="bg-primary hover:bg-primary-glow text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}Plan my work
          </Button>
        </form>
      </Card>
      {output && <OutputCard output={output} />}
    </div>
  );
}
