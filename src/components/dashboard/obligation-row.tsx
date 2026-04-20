import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { ComputedObligation } from "@/lib/rules/types";
import { markObligation } from "@/app/dashboard/actions";
import { EvidenceDrawer } from "@/components/dashboard/evidence-drawer";
import type { EvidenceRow } from "@/lib/db/evidence";

const statusVariant = {
  met: "secondary",
  upcoming: "outline",
  overdue: "destructive",
  not_applicable: "ghost",
} as const;

const statusLabel = {
  met: "Compliant",
  upcoming: "Upcoming",
  overdue: "Overdue",
  not_applicable: "N/A",
} as const;

function formatPenalty(kobo: number | null): string | null {
  if (kobo == null || kobo === 0) return null;
  const naira = kobo / 100;
  if (naira >= 1_000_000_000) {
    return `\u20a6${(naira / 1_000_000_000).toFixed(1)}B penalty`;
  }
  if (naira >= 1_000_000) {
    return `\u20a6${(naira / 1_000_000).toFixed(0)}M penalty`;
  }
  return `\u20a6${naira.toLocaleString()} penalty`;
}

export function ObligationRow({
  item,
  evidence = [],
}: {
  item: ComputedObligation;
  evidence?: readonly EvidenceRow[];
}) {
  const penalty = formatPenalty(item.obligation.penaltyKobo);
  const isMet = item.status === "met";

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-1 items-start gap-3">
        <form action={markObligation} className="shrink-0 pt-0.5">
          <input type="hidden" name="code" value={item.obligation.code} />
          <input type="hidden" name="completed" value={isMet ? "false" : "true"} />
          <button
            type="submit"
            aria-label={isMet ? "Mark as not met" : "Mark as met"}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {isMet ? (
              <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-500" />
            ) : (
              <Circle className="size-5" />
            )}
          </button>
        </form>
        <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium leading-tight">{item.obligation.title}</h3>
          <Badge variant={statusVariant[item.status]}>
            {statusLabel[item.status]}
          </Badge>
          {item.obligation.verifyStatus === "unverified" && (
            <Badge variant="outline" className="text-[0.65rem]">
              unverified
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {item.obligation.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{item.obligation.clauseRef}</span>
          <a
            href={item.obligation.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
          >
            source
            <ExternalLink className="size-3" />
          </a>
          {penalty && <span className="text-destructive/80">{penalty}</span>}
        </div>
        <EvidenceDrawer code={item.obligation.code} evidence={evidence} />
      </div>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground sm:w-32">
        {item.dueDate ? (
          <>
            <p className="font-medium text-foreground">{item.dueDate}</p>
            <p>{dueLabel(item)}</p>
          </>
        ) : (
          <p>{dueLabel(item)}</p>
        )}
      </div>
    </div>
  );
}

function dueLabel(item: ComputedObligation): string {
  const rule = item.obligation.dueRule;
  switch (rule.type) {
    case "annual":
      return "Annual";
    case "quarterly":
      return "Quarterly";
    case "monthly":
      return "Monthly";
    case "once":
      return "One-off";
    case "within_days_of_event":
      return `${rule.days}d after ${rule.event.toLowerCase()}`;
  }
}
