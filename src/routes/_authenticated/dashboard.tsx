import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/ai-features.functions";
import { Card } from "@/components/ui/card";
import { Mail, NotebookPen, ListChecks, BookOpen, MessageSquare, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const TOOLS = [
  { to: "/email", title: "Smart Email", desc: "Draft tone-perfect emails for any audience.", icon: Mail },
  { to: "/meeting", title: "Meeting Notes", desc: "Summarize raw notes into actions and deadlines.", icon: NotebookPen },
  { to: "/tasks", title: "Task Planner", desc: "Prioritize your day or week with AI scheduling.", icon: ListChecks },
  { to: "/research", title: "Research Brief", desc: "Get structured insights on any topic.", icon: BookOpen },
  { to: "/chat", title: "AI Chat", desc: "Open-ended assistant for everything else.", icon: MessageSquare },
];

function Dashboard() {
  const fn = useServerFn(getDashboardStats);
  const { data } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => fn() });

  return (
    <div>
      <div className="rounded-2xl p-8 md:p-10 mb-8 text-primary-foreground shadow-[var(--shadow-elegant)]" style={{ background: "var(--gradient-prestige)" }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary-foreground/70 mb-3">
          <Sparkles className="h-3.5 w-3.5" /> Your workplace co-pilot
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">Welcome back. Let's reclaim your day.</h1>
        <p className="mt-3 text-primary-foreground/80 max-w-xl">Choose a tool to get started, or jump back into a conversation with your AI assistant.</p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div><div className="text-2xl font-semibold">{data?.outputCount ?? 0}</div><div className="text-primary-foreground/70">outputs created</div></div>
          <div><div className="text-2xl font-semibold">{data?.threadCount ?? 0}</div><div className="text-primary-foreground/70">conversations</div></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="p-6 h-full hover:shadow-[var(--shadow-card)] hover:border-primary/30 transition-all group cursor-pointer border-border/60">
              <div className="h-10 w-10 rounded-lg bg-secondary text-primary flex items-center justify-center mb-4">
                <t.icon className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t.title}</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {data?.recent && data.recent.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Recent activity</h2>
          <Card className="divide-y divide-border/60 border-border/60">
            {data.recent.map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground capitalize">{r.feature} · {new Date(r.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}