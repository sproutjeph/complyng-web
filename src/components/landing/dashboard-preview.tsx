import { Badge } from "@/components/ui/badge";
import { FileCheck2, FileJson, Globe2 } from "lucide-react";

const obligations = [
  {
    name: "Register with NDPC (GAID 2025)",
    clause: "GAID Part II s.4",
    status: "met" as const,
    evidence: "2 records",
  },
  {
    name: "Designate a Data Protection Officer",
    clause: "GAID Part III s.12",
    status: "met" as const,
    evidence: "1 record",
  },
  {
    name: "72-hour breach notification",
    clause: "NDPA s.40",
    status: "upcoming" as const,
    evidence: "0 records",
  },
  {
    name: "CBN RBCF cyber incident report",
    clause: "CBN RBCF Part IV",
    status: "upcoming" as const,
    evidence: "0 records",
  },
  {
    name: "GAID Art. 23 — cross-border safeguards",
    clause: "GAID Part IV s.23",
    status: "overdue" as const,
    evidence: "gap found",
  },
] as const;

const statusVariant = {
  met: "secondary",
  upcoming: "outline",
  overdue: "destructive",
} as const;

const statusLabel = {
  met: "Compliant",
  upcoming: "Upcoming",
  overdue: "Gap",
} as const;

const scoreSegments = [
  { label: "GAID", value: 78 },
  { label: "NDPR", value: 85 },
  { label: "CBN", value: 72 },
  { label: "NCC", value: 60 },
  { label: "SEC", value: 90 },
] as const;

export function DashboardPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-muted/50" />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
            <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          </div>
          <span className="text-xs text-muted-foreground">
            app.complyng.ng/dashboard
          </span>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Compliance Score
              </p>
              <p className="font-heading text-3xl font-bold">77</p>
              <p className="text-[0.7rem] text-muted-foreground">
                12 met · 3 upcoming · 1 gap
              </p>
            </div>
            <div className="flex size-16 items-center justify-center rounded-full border-4 border-primary bg-background">
              <span className="font-heading text-lg font-bold">77%</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {scoreSegments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-3">
                <span className="w-14 text-xs font-medium text-muted-foreground">
                  {seg.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${seg.value}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                  {seg.value}%
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Obligations
            </p>
            {obligations.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.name}</p>
                  <p className="truncate font-mono text-[0.65rem] text-muted-foreground">
                    {item.clause} · {item.evidence}
                  </p>
                </div>
                <Badge variant={statusVariant[item.status]}>
                  {statusLabel[item.status]}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-[0.7rem] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileCheck2 className="size-3.5 text-primary" />
              sha256 evidence
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileJson className="size-3.5 text-primary" />
              OSCAL export
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="size-3.5 text-primary" />
              Trust Center
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
