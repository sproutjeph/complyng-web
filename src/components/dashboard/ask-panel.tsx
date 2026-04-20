"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ExternalLink, Loader2 } from "lucide-react";

interface Citation {
  frameworkCode: string;
  clauseRef: string;
  sourceUrl: string;
  excerpt: string;
}

interface AskResponse {
  answer: string;
  citations: Citation[];
}

const examples = [
  "What does NDPA require when a personal data breach occurs?",
  "What cybersecurity controls must a CBN-licensed fintech have in place?",
  "Which content must a platform take down within 24 hours under NITDA's Code?",
];

export function AskPanel() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AskResponse | null>(null);

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="flex flex-col gap-2"
      >
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Under NDPA 2023, within how many hours must I notify NDPC of a breach?"
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Answers are grounded only in ingested source texts.
          </p>
          <Button type="submit" disabled={loading || q.trim() === ""}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Send className="size-3.5" />
                Ask
              </>
            )}
          </Button>
        </div>
      </form>

      {!result && !loading && !error && (
        <div className="rounded-lg border border-dashed border-border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Try
          </p>
          <div className="flex flex-col gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQ(ex);
                  submit(ex);
                }}
                className="text-left text-sm text-foreground/80 hover:text-primary hover:underline"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Answer
            </p>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {result.answer}
            </div>
          </div>
          {result.citations.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Citations ({result.citations.length})
              </p>
              <div className="flex flex-col gap-2">
                {result.citations.map((c, i) => (
                  <a
                    key={i}
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-1 rounded-lg border border-border bg-card p-3 text-sm transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {c.frameworkCode}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.clauseRef}
                      </span>
                      <ExternalLink className="ml-auto size-3 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {c.excerpt}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
