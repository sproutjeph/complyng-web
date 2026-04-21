import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownSummary({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={className ?? "space-y-1.5 text-sm leading-relaxed"}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("- ")) {
          return (
            <p key={i} className="flex gap-2">
              <span aria-hidden className="select-none text-muted-foreground">•</span>
              <span>{renderInline(trimmed.slice(2))}</span>
            </p>
          );
        }
        return <p key={i}>{renderInline(trimmed)}</p>;
      })}
    </div>
  );
}
