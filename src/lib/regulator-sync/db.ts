import "server-only";
import { getDb } from "@/lib/db/client";

export interface SnapshotRow {
  id: number;
  frameworkCode: string;
  sourceUrl: string;
  contentHash: string;
  content: string;
  fetchedAt: string;
}

export interface ChangeEventRow {
  id: number;
  frameworkCode: string;
  previousSnapshotId: number | null;
  currentSnapshotId: number;
  summary: string;
  status: "new" | "applied" | "error";
  affectedPolicyCount: number;
  detectedAt: string;
  appliedAt: string | null;
}

function rowToSnapshot(r: Record<string, unknown>): SnapshotRow {
  return {
    id: Number(r.id),
    frameworkCode: r.framework_code as string,
    sourceUrl: r.source_url as string,
    contentHash: r.content_hash as string,
    content: r.content as string,
    fetchedAt: (r.fetched_at as Date).toISOString(),
  };
}

function rowToEvent(r: Record<string, unknown>): ChangeEventRow {
  return {
    id: Number(r.id),
    frameworkCode: r.framework_code as string,
    previousSnapshotId: r.previous_snapshot_id ? Number(r.previous_snapshot_id) : null,
    currentSnapshotId: Number(r.current_snapshot_id),
    summary: r.summary as string,
    status: r.status as "new" | "applied" | "error",
    affectedPolicyCount: Number(r.affected_policy_count),
    detectedAt: (r.detected_at as Date).toISOString(),
    appliedAt: r.applied_at ? (r.applied_at as Date).toISOString() : null,
  };
}

export async function getLatestSnapshot(
  frameworkCode: string,
): Promise<SnapshotRow | null> {
  const db = getDb();
  const rows = await db`
    SELECT id, framework_code, source_url, content_hash, content, fetched_at
    FROM regulatory_source_snapshot
    WHERE framework_code = ${frameworkCode}
    ORDER BY fetched_at DESC
    LIMIT 1
  `;
  return rows[0] ? rowToSnapshot(rows[0]) : null;
}

export async function insertSnapshot(input: {
  frameworkCode: string;
  sourceUrl: string;
  contentHash: string;
  content: string;
}): Promise<SnapshotRow> {
  const db = getDb();
  const [row] = await db`
    INSERT INTO regulatory_source_snapshot
      (framework_code, source_url, content_hash, content)
    VALUES
      (${input.frameworkCode}, ${input.sourceUrl}, ${input.contentHash}, ${input.content})
    RETURNING id, framework_code, source_url, content_hash, content, fetched_at
  `;
  return rowToSnapshot(row);
}

export async function insertChangeEvent(input: {
  frameworkCode: string;
  previousSnapshotId: number | null;
  currentSnapshotId: number;
  summary: string;
}): Promise<ChangeEventRow> {
  const db = getDb();
  const [row] = await db`
    INSERT INTO regulatory_change_event
      (framework_code, previous_snapshot_id, current_snapshot_id, summary, status)
    VALUES
      (${input.frameworkCode}, ${input.previousSnapshotId}, ${input.currentSnapshotId}, ${input.summary}, 'new')
    RETURNING id, framework_code, previous_snapshot_id, current_snapshot_id,
              summary, status, affected_policy_count, detected_at, applied_at
  `;
  return rowToEvent(row);
}

export async function markEventApplied(
  id: number,
  affectedPolicyCount: number,
): Promise<void> {
  const db = getDb();
  await db`
    UPDATE regulatory_change_event
    SET status = 'applied', affected_policy_count = ${affectedPolicyCount}, applied_at = NOW()
    WHERE id = ${id}
  `;
}

export async function markEventError(id: number): Promise<void> {
  const db = getDb();
  await db`
    UPDATE regulatory_change_event SET status = 'error' WHERE id = ${id}
  `;
}

export async function listChangeEvents(limit = 50): Promise<ChangeEventRow[]> {
  const db = getDb();
  const rows = await db`
    SELECT id, framework_code, previous_snapshot_id, current_snapshot_id,
           summary, status, affected_policy_count, detected_at, applied_at
    FROM regulatory_change_event
    ORDER BY detected_at DESC
    LIMIT ${limit}
  `;
  return rows.map(rowToEvent);
}

export async function getLatestAppliedEvent(): Promise<ChangeEventRow | null> {
  const db = getDb();
  const rows = await db`
    SELECT id, framework_code, previous_snapshot_id, current_snapshot_id,
           summary, status, affected_policy_count, detected_at, applied_at
    FROM regulatory_change_event
    WHERE status = 'applied'
    ORDER BY applied_at DESC
    LIMIT 1
  `;
  return rows[0] ? rowToEvent(rows[0]) : null;
}
