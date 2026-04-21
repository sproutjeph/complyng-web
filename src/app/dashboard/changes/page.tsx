import Link from "next/link";
import { CalendarClock, FileSearch, FileWarning } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { MarkdownSummary } from "@/components/dashboard/markdown-summary";
import { Badge } from "@/components/ui/badge";
import { requireUserId } from "@/lib/profile";
import { listChangeEvents } from "@/lib/regulator-sync/db";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

async function countUserGaps(userId: string): Promise<number> {
  const db = getDb();
  const [{ count }] = await db<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM gap_finding
    WHERE user_id = ${userId} AND resolved_at IS NULL
  `;
  return count;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ChangesPage() {
  const userId = await requireUserId();
  const [events, userGapCount] = await Promise.all([
    listChangeEvents(100),
    countUserGaps(userId),
  ]);

  const applied = events.filter((e) => e.status === "applied");

  return (
    <>
      <DashboardNav current="/dashboard/changes" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Regulator changelog
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              ComplyNG polls NDPC-GAID daily. When the regulation changes, we re-ingest the text, re-run gap analysis against your policies, and log the change below.
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {applied.length} {applied.length === 1 ? "event" : "events"}
          </Badge>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <FileSearch className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No regulator changes detected yet. The first sync run will record a baseline — subsequent runs will appear here only if the source document changes.
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {event.frameworkCode}
                  </Badge>
                  <Badge
                    variant={
                      event.status === "applied"
                        ? "secondary"
                        : event.status === "error"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {event.status === "applied" && event.previousSnapshotId === null
                      ? "baseline"
                      : event.status}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {formatDateTime(event.detectedAt)}
                  </span>
                  {event.affectedPolicyCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <FileWarning className="size-3.5" />
                      {event.affectedPolicyCount} polic
                      {event.affectedPolicyCount === 1 ? "y" : "ies"} re-analysed
                    </span>
                  )}
                </div>

                <MarkdownSummary text={event.summary} />

                {event.status === "applied" && event.previousSnapshotId !== null && (
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
                    <Link
                      href="/dashboard/policies"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Review your policies →
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      You currently have {userGapCount} open gap
                      {userGapCount === 1 ? "" : "s"}.
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}
