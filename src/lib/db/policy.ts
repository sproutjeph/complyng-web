import "server-only";
import { getDb, vectorLiteral } from "./client";

export interface PolicyDocumentRow {
  id: number;
  userId: string;
  filename: string;
  mime: string | null;
  sha256: string;
  textBytes: number;
  chunkCount: number;
  uploadedAt: string;
}

export interface GapFindingRow {
  id: number;
  policyId: number;
  userId: string;
  obligationCode: string;
  gaidArticle: string;
  severity: string;
  description: string;
  policyCitation: string | null;
  regulationCitation: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

interface InsertPolicyInput {
  userId: string;
  filename: string;
  mime: string;
  sha256: string;
  textBytes: number;
  chunks: ReadonlyArray<{
    section: string;
    content: string;
    embedding: number[];
  }>;
}

export async function insertPolicyWithChunks(
  input: InsertPolicyInput,
): Promise<number> {
  const db = getDb();
  return db.begin(async (sql) => {
    const [doc] = await sql<{ id: number }[]>`
      INSERT INTO policy_document (user_id, filename, mime, sha256, text_bytes, chunk_count)
      VALUES (${input.userId}, ${input.filename}, ${input.mime}, ${input.sha256}, ${input.textBytes}, ${input.chunks.length})
      RETURNING id
    `;
    for (const c of input.chunks) {
      const v = vectorLiteral(c.embedding);
      await sql`
        INSERT INTO policy_chunk (policy_id, section, content, embedding)
        VALUES (${doc.id}, ${c.section}, ${c.content}, ${v}::vector)
      `;
    }
    return doc.id;
  });
}

function rowToPolicy(r: Record<string, unknown>): PolicyDocumentRow {
  return {
    id: Number(r.id),
    userId: r.user_id as string,
    filename: r.filename as string,
    mime: (r.mime as string | null) ?? null,
    sha256: r.sha256 as string,
    textBytes: Number(r.text_bytes),
    chunkCount: Number(r.chunk_count),
    uploadedAt: (r.uploaded_at as Date).toISOString(),
  };
}

export async function listPoliciesByUser(userId: string): Promise<PolicyDocumentRow[]> {
  const db = getDb();
  const rows = await db`
    SELECT id, user_id, filename, mime, sha256, text_bytes, chunk_count, uploaded_at
    FROM policy_document
    WHERE user_id = ${userId}
    ORDER BY uploaded_at DESC
  `;
  return rows.map(rowToPolicy);
}

export async function getLatestPolicy(userId: string): Promise<PolicyDocumentRow | null> {
  const db = getDb();
  const rows = await db`
    SELECT id, user_id, filename, mime, sha256, text_bytes, chunk_count, uploaded_at
    FROM policy_document
    WHERE user_id = ${userId}
    ORDER BY uploaded_at DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToPolicy(rows[0]);
}

export async function getPolicyById(id: number, userId: string): Promise<PolicyDocumentRow | null> {
  const db = getDb();
  const rows = await db`
    SELECT id, user_id, filename, mime, sha256, text_bytes, chunk_count, uploaded_at
    FROM policy_document
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToPolicy(rows[0]);
}

export async function retrievePolicyChunks(
  policyId: number,
  queryEmbedding: number[],
  topK = 6,
): Promise<Array<{ section: string; content: string; similarity: number }>> {
  const db = getDb();
  const v = vectorLiteral(queryEmbedding);
  const rows = await db`
    SELECT section, content, 1 - (embedding <=> ${v}::vector) AS similarity
    FROM policy_chunk
    WHERE policy_id = ${policyId}
    ORDER BY embedding <=> ${v}::vector
    LIMIT ${topK}
  `;
  return rows.map((r: Record<string, unknown>) => ({
    section: (r.section as string) ?? "",
    content: r.content as string,
    similarity: Number(r.similarity),
  }));
}

export async function insertGapFinding(input: {
  policyId: number;
  userId: string;
  obligationCode: string;
  gaidArticle: string;
  severity: string;
  description: string;
  policyCitation: string | null;
  regulationCitation: string | null;
}): Promise<number> {
  const db = getDb();
  const [row] = await db<{ id: number }[]>`
    INSERT INTO gap_finding (
      policy_id, user_id, obligation_code, gaid_article, severity, description,
      policy_citation, regulation_citation
    )
    VALUES (
      ${input.policyId}, ${input.userId}, ${input.obligationCode}, ${input.gaidArticle},
      ${input.severity}, ${input.description}, ${input.policyCitation}, ${input.regulationCitation}
    )
    RETURNING id
  `;
  return row.id;
}

export async function listGapFindingsByPolicy(policyId: number, userId: string): Promise<GapFindingRow[]> {
  const db = getDb();
  const rows = await db`
    SELECT id, policy_id, user_id, obligation_code, gaid_article, severity, description,
           policy_citation, regulation_citation, resolved_at, created_at
    FROM gap_finding
    WHERE policy_id = ${policyId} AND user_id = ${userId}
    ORDER BY
      CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 ELSE 3 END,
      created_at DESC
  `;
  return rows.map((r: Record<string, unknown>) => ({
    id: Number(r.id),
    policyId: Number(r.policy_id),
    userId: r.user_id as string,
    obligationCode: r.obligation_code as string,
    gaidArticle: r.gaid_article as string,
    severity: r.severity as string,
    description: r.description as string,
    policyCitation: (r.policy_citation as string | null) ?? null,
    regulationCitation: (r.regulation_citation as string | null) ?? null,
    resolvedAt: r.resolved_at ? (r.resolved_at as Date).toISOString() : null,
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function deleteGapFindingsForPolicy(policyId: number, userId: string): Promise<void> {
  const db = getDb();
  await db`DELETE FROM gap_finding WHERE policy_id = ${policyId} AND user_id = ${userId}`;
}
