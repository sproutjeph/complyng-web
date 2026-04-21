import "server-only";
import { getDb } from "@/lib/db/client";
import { fetchFrameworkSource } from "./fetch";
import {
  getLatestSnapshot,
  insertChangeEvent,
  insertSnapshot,
  markEventApplied,
  markEventError,
} from "./db";
import { summarizeDiff } from "./diff";
import { applyRegulatorChange } from "./apply";
import { sendChangeAlert } from "./email";

const MONITORED_FRAMEWORKS = ["NDPC-GAID"] as const;

export interface SyncOutcome {
  frameworkCode: string;
  status: "unchanged" | "baseline" | "applied" | "error" | "unavailable";
  snapshotId?: number;
  eventId?: number;
  summary?: string;
  origin?: string;
  affectedPolicyCount?: number;
  emailsSent?: number;
  emailsSkipped?: number;
  error?: string;
}

export interface SyncSummary {
  at: string;
  outcomes: SyncOutcome[];
}

async function distinctUserIdsWithGaps(): Promise<string[]> {
  const db = getDb();
  const rows = await db`SELECT DISTINCT user_id FROM gap_finding`;
  return rows.map((r: Record<string, unknown>) => r.user_id as string);
}

function dashboardUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.VERCEL_URL
    ?? "http://localhost:3000";
  const withScheme = base.startsWith("http") ? base : `https://${base}`;
  return `${withScheme}/dashboard/changes`;
}

async function syncFramework(frameworkCode: string): Promise<SyncOutcome> {
  try {
    const fetched = await fetchFrameworkSource(frameworkCode);
    if (!fetched) {
      return {
        frameworkCode,
        status: "unavailable",
        error: "no source available (remote fetch failed and no local file)",
      };
    }

    const previous = await getLatestSnapshot(frameworkCode);
    if (previous && previous.contentHash === fetched.contentHash) {
      return { frameworkCode, status: "unchanged", origin: fetched.origin };
    }

    const snapshot = await insertSnapshot({
      frameworkCode,
      sourceUrl: fetched.sourceUrl,
      contentHash: fetched.contentHash,
      content: fetched.normalized,
    });

    const summary = await summarizeDiff({
      frameworkCode,
      previous: previous?.content ?? null,
      current: fetched.normalized,
    });

    const event = await insertChangeEvent({
      frameworkCode,
      previousSnapshotId: previous?.id ?? null,
      currentSnapshotId: snapshot.id,
      summary,
    });

    if (!previous) {
      await markEventApplied(event.id, 0);
      return {
        frameworkCode,
        status: "baseline",
        snapshotId: snapshot.id,
        eventId: event.id,
        summary,
        origin: fetched.origin,
        affectedPolicyCount: 0,
      };
    }

    try {
      const apply = await applyRegulatorChange(frameworkCode);
      await markEventApplied(event.id, apply.affectedPolicyCount);

      let emailsSent = 0;
      let emailsSkipped = 0;
      const userIds = await distinctUserIdsWithGaps();
      for (const userId of userIds) {
        const result = await sendChangeAlert({
          userId,
          frameworkCode,
          summaryMarkdown: summary,
          dashboardUrl: dashboardUrl(),
        });
        if (result === "sent") emailsSent++;
        else emailsSkipped++;
      }

      return {
        frameworkCode,
        status: "applied",
        snapshotId: snapshot.id,
        eventId: event.id,
        summary,
        origin: fetched.origin,
        affectedPolicyCount: apply.affectedPolicyCount,
        emailsSent,
        emailsSkipped,
      };
    } catch (e) {
      await markEventError(event.id);
      return {
        frameworkCode,
        status: "error",
        snapshotId: snapshot.id,
        eventId: event.id,
        summary,
        origin: fetched.origin,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  } catch (e) {
    return {
      frameworkCode,
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function runRegulatorSync(): Promise<SyncSummary> {
  const outcomes: SyncOutcome[] = [];
  for (const code of MONITORED_FRAMEWORKS) {
    outcomes.push(await syncFramework(code));
  }
  return { at: new Date().toISOString(), outcomes };
}
