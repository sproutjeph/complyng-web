import { CHUNK_OVERLAP, CHUNK_SIZE } from "./config";

export interface Chunk {
  frameworkCode: string;
  sourceUrl: string;
  clauseRef: string;
  text: string;
}

export function chunkDocument(params: {
  frameworkCode: string;
  sourceUrl: string;
  rawText: string;
}): Chunk[] {
  const { frameworkCode, sourceUrl, rawText } = params;
  const cleaned = rawText
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\t ]+/g, " ")
    .trim();

  const chunks: Chunk[] = [];
  let i = 0;
  while (i < cleaned.length) {
    const end = Math.min(i + CHUNK_SIZE, cleaned.length);
    let cut = end;
    if (end < cleaned.length) {
      const para = cleaned.lastIndexOf("\n\n", end);
      const sent = cleaned.lastIndexOf(". ", end);
      const candidate = Math.max(para, sent);
      if (candidate > i + CHUNK_SIZE / 2) cut = candidate;
    }
    const text = cleaned.slice(i, cut).trim();
    if (text.length > 50) {
      chunks.push({
        frameworkCode,
        sourceUrl,
        clauseRef: inferClauseRef(text) ?? `${frameworkCode} p.${chunks.length + 1}`,
        text,
      });
    }
    if (cut >= cleaned.length) break;
    const next = Math.max(cut - CHUNK_OVERLAP, i + 1);
    i = next;
  }
  return chunks;
}

const CLAUSE_PATTERNS: RegExp[] = [
  /\bSection\s+(\d+[A-Z]?(?:\([^)]+\))?)/i,
  /\bS\.\s*(\d+[A-Z]?(?:\([^)]+\))?)/i,
  /\bArticle\s+(\d+[A-Z]?)/i,
  /\bRule\s+(\d+(?:\.\d+)?)/i,
  /\bPart\s+([IVX]+|\d+)/i,
  /\bParagraph\s+(\d+(?:\.\d+)?)/i,
];

function inferClauseRef(text: string): string | null {
  for (const pat of CLAUSE_PATTERNS) {
    const m = text.match(pat);
    if (m) return m[0].trim().replace(/\s+/g, " ");
  }
  return null;
}
