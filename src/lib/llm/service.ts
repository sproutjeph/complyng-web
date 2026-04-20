import { retrieve, type RetrievedChunk } from "./retriever";
import { answer } from "./answerer";

export interface AskResponse {
  answer: string;
  citations: {
    frameworkCode: string;
    clauseRef: string;
    sourceUrl: string;
    excerpt: string;
  }[];
}

export async function ask(question: string): Promise<AskResponse> {
  const chunks = await retrieve(question);
  if (chunks.length === 0) {
    return {
      answer:
        "No regulatory context has been ingested yet. Run `bun run ingest` to embed the NITDA, NDPC, CBN, NCC, and SEC source documents.",
      citations: [],
    };
  }
  const { text, usedChunkIndices } = await answer(question, chunks);
  const keep = usedChunkIndices.length > 0 ? usedChunkIndices : chunks.map((_, i) => i).slice(0, 3);
  const cited = keep.map((i) => toCitation(chunks[i]));
  return { answer: text, citations: dedupe(cited) };
}

function toCitation(c: RetrievedChunk) {
  const excerpt = c.text.length > 280 ? c.text.slice(0, 277).trim() + "\u2026" : c.text;
  return {
    frameworkCode: c.frameworkCode,
    clauseRef: c.clauseRef,
    sourceUrl: c.sourceUrl,
    excerpt,
  };
}

function dedupe<T extends { frameworkCode: string; clauseRef: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    const key = `${x.frameworkCode}:${x.clauseRef}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
