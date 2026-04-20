import { getDb, vectorLiteral } from "./db";
import { embed } from "./embedder";
import { TOP_K } from "./config";

export interface RetrievedChunk {
  frameworkCode: string;
  clauseRef: string;
  sourceUrl: string;
  text: string;
  similarity: number;
}

export async function retrieve(question: string, k = TOP_K): Promise<RetrievedChunk[]> {
  const queryVec = await embed(question, "RETRIEVAL_QUERY");
  const db = getDb();
  const vec = vectorLiteral(queryVec);
  const rows = await db`
    SELECT framework_code, clause_ref, source_url, text,
           1 - (embedding <=> ${vec}::vector) AS similarity
    FROM regulatory_chunks
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${k}
  `;
  return rows.map((r) => ({
    frameworkCode: r.framework_code as string,
    clauseRef: r.clause_ref as string,
    sourceUrl: r.source_url as string,
    text: r.text as string,
    similarity: Number(r.similarity),
  }));
}
