import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function OutputCard({ output }: { output: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Card className="p-6 mt-6 border-border/60 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI Output</div>
        <Button size="sm" variant="ghost" onClick={copy}>
          {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
          Copy
        </Button>
      </div>
      <article className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-p:text-foreground/90 prose-strong:text-foreground prose-table:text-sm">
        <ReactMarkdown>{output}</ReactMarkdown>
      </article>
      <p className="text-[11px] text-muted-foreground mt-6 pt-4 border-t border-border/60">
        AI-generated content may require human review.
      </p>
    </Card>
  );
}

export function PageHeader({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: any }) {
  return (
    <div className="mb-8 flex items-start gap-4">
      <div className="h-11 w-11 rounded-xl flex items-center justify-center text-primary-foreground shrink-0" style={{ background: "var(--gradient-prestige)" }}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
      </div>
    </div>
  );
}