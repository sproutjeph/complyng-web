import { Badge } from "@/components/ui/badge";

const obligations = [
  { name: "CAC Annual Return", status: "met" as const, due: "Filed" },
  { name: "FIRS VAT Return", status: "upcoming" as const, due: "Apr 21" },
  { name: "PENCOM Remittance", status: "upcoming" as const, due: "Apr 30" },
  { name: "NSITF Contribution", status: "overdue" as const, due: "Overdue" },
  { name: "ITF 1% Levy", status: "met" as const, due: "Filed" },
] as const;

const statusVariant = {
  met: "secondary",
  upcoming: "outline",
  overdue: "destructive",
} as const;

const statusLabel = {
  met: "Compliant",
  upcoming: "Upcoming",
  overdue: "Overdue",
} as const;

const scoreSegments = [
  { label: "CAC", value: 100 },
  { label: "FIRS", value: 85 },
  { label: "PENCOM", value: 70 },
  { label: "NSITF", value: 40 },
  { label: "ITF", value: 100 },
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
            app.complyng.com/dashboard
          </span>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {/* Score header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Compliance Score
              </p>
              <p className="font-heading text-3xl font-bold">75</p>
            </div>
            <div className="flex size-16 items-center justify-center rounded-full border-4 border-primary bg-background">
              <span className="font-heading text-lg font-bold">75%</span>
            </div>
          </div>

          {/* Framework bars */}
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

          {/* Obligation list */}
          <div className="flex flex-col gap-1">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Obligations
            </p>
            {obligations.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {item.due}
                  </span>
                  <Badge variant={statusVariant[item.status]}>
                    {statusLabel[item.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
