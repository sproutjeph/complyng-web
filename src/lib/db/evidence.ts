import "server-only";
import { getDb } from "./client";

export type EvidenceKind = "file" | "link" | "note";

export interface EvidenceRow {
  id: number;
  userId: string;
  obligationCode: string;
  kind: EvidenceKind;
  filename: string | null;
  storagePath: string | null;
  mime: string | null;
  sha256: string | null;
  url: string | null;
  note: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

function rowToEvidence(r: Record<string, unknown>): EvidenceRow {
  return {
    id: Number(r.id),
    userId: r.user_id as string,
    obligationCode: r.obligation_code as string,
    kind: r.kind as EvidenceKind,
    filename: (r.filename as string | null) ?? null,
    storagePath: (r.storage_path as string | null) ?? null,
    mime: (r.mime as string | null) ?? null,
    sha256: (r.sha256 as string | null) ?? null,
    url: (r.url as string | null) ?? null,
    note: (r.note as string | null) ?? null,
    uploadedBy: r.uploaded_by as string,
    uploadedAt: (r.uploaded_at as Date).toISOString(),
  };
}

export async function insertFileEvidence(input: {
  userId: string;
  obligationCode: string;
  filename: string;
  storagePath: string;
  mime: string;
  sha256: string;
  note: string | null;
  uploadedBy: string;
}): Promise<number> {
  const db = getDb();
  const [row] = await db<{ id: number }[]>`
    INSERT INTO evidence (user_id, obligation_code, kind, filename, storage_path, mime, sha256, note, uploaded_by)
    VALUES (${input.userId}, ${input.obligationCode}, 'file', ${input.filename}, ${input.storagePath},
            ${input.mime}, ${input.sha256}, ${input.note}, ${input.uploadedBy})
    RETURNING id
  `;
  return row.id;
}

export async function insertLinkEvidence(input: {
  userId: string;
  obligationCode: string;
  url: string;
  note: string | null;
  uploadedBy: string;
}): Promise<number> {
  const db = getDb();
  const [row] = await db<{ id: number }[]>`
    INSERT INTO evidence (user_id, obligation_code, kind, url, note, uploaded_by)
    VALUES (${input.userId}, ${input.obligationCode}, 'link', ${input.url}, ${input.note}, ${input.uploadedBy})
    RETURNING id
  `;
  return row.id;
}

export async function listEvidenceByUser(userId: string): Promise<EvidenceRow[]> {
  const db = getDb();
  const rows = await db`
    SELECT * FROM evidence
    WHERE user_id = ${userId}
    ORDER BY obligation_code, uploaded_at DESC
  `;
  return rows.map(rowToEvidence);
}

export async function listEvidenceForObligation(
  userId: string,
  obligationCode: string,
): Promise<EvidenceRow[]> {
  const db = getDb();
  const rows = await db`
    SELECT * FROM evidence
    WHERE user_id = ${userId} AND obligation_code = ${obligationCode}
    ORDER BY uploaded_at DESC
  `;
  return rows.map(rowToEvidence);
}

export async function deleteEvidence(
  userId: string,
  evidenceId: number,
): Promise<EvidenceRow | null> {
  const db = getDb();
  const rows = await db`
    DELETE FROM evidence
    WHERE id = ${evidenceId} AND user_id = ${userId}
    RETURNING *
  `;
  if (rows.length === 0) return null;
  return rowToEvidence(rows[0]);
}

export async function countEvidenceByObligation(
  userId: string,
): Promise<Map<string, number>> {
  const db = getDb();
  const rows = await db`
    SELECT obligation_code, COUNT(*)::int AS n
    FROM evidence
    WHERE user_id = ${userId}
    GROUP BY obligation_code
  `;
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.obligation_code as string, Number(r.n));
  }
  return map;
}
