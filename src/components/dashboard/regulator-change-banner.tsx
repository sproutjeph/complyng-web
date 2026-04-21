import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { getLatestAppliedEvent } from "@/lib/regulator-sync/db";

export async function RegulatorChangeBanner() {
  const event = await getLatestAppliedEvent();
  if (!event) return null;
  if (event.previousSnapshotId === null && event.affectedPolicyCount === 0) {
    return null;
  }

  const when = event.appliedAt
    ? new Date(event.appliedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href="/dashboard/changes"
      className="group mb-4 flex items-center gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-950/60"
    >
      <BellRing className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {event.frameworkCode} updated{when ? ` on ${when}` : ""}
          {event.affectedPolicyCount > 0 && (
            <> — {event.affectedPolicyCount} polic{event.affectedPolicyCount === 1 ? "y" : "ies"} re-analysed.</>
          )}
        </p>
        <p className="truncate text-xs opacity-80">
          Review the changelog and any new gaps.
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
