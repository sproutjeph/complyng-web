import "server-only";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { extractText, getDocumentProxy } from "unpdf";
import { chunkDocument, type Chunk } from "@/lib/llm/chunker";
import { embed } from "@/lib/llm/embedder";
import { EMBEDDING_DIM } from "@/lib/llm/config";
import { getDb, vectorLiteral } from "@/lib/db/client";

export interface Source {
  frameworkCode: string;
  file: string;
  sourceUrl: string;
  statute: string;
}

const DOCS_DIR = path.join(process.cwd(), "content", "docs");
const MANIFEST = path.join(DOCS_DIR, "sources.json");
const FRAMEWORKS_DIR = path.join(process.cwd(), "content", "frameworks");

export async function loadSources(): Promise<Source[]> {
  const raw = await readFile(MANIFEST, "utf8").catch(() => null);
  if (!raw) return [];
  return JSON.parse(raw).sources as Source[];
}

export async function findSource(frameworkCode: string): Promise<Source | null> {
  const sources = await loadSources();
  return sources.find((s) => s.frameworkCode === frameworkCode) ?? null;
}

export async function readSourceRawText(source: Source): Promise<string | null> {
  const ext = path.extname(source.file).toLowerCase();
  const full = path.join(DOCS_DIR, source.file);
  if (!existsSync(full)) return null;

  if (ext === ".pdf") {
    const buf = await readFile(full);
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  if (ext === ".md" || ext === ".txt") {
    return await readFile(full, "utf8");
  }
  return null;
}

async function fallbackChunksFromJson(frameworkCode: string): Promise<Chunk[]> {
  const entries = await readdir(FRAMEWORKS_DIR).catch(() => [] as string[]);
  const chunks: Chunk[] = [];
  for (const f of entries) {
    if (!f.endsWith(".json")) continue;
    const data = JSON.parse(await readFile(path.join(FRAMEWORKS_DIR, f), "utf8"));
    if (data.code !== frameworkCode) continue;
    for (const ob of data.obligations ?? []) {
      chunks.push({
        frameworkCode: data.code,
        sourceUrl: ob.sourceUrl,
        clauseRef: ob.clauseRef,
        text: `${data.code} — ${ob.title}\n\nClause: ${ob.clauseRef}\n\n${ob.description}`,
      });
    }
  }
  return chunks;
}

export async function chunksForFramework(frameworkCode: string): Promise<Chunk[]> {
  const source = await findSource(frameworkCode);
  if (source) {
    const rawText = await readSourceRawText(source);
    if (rawText && rawText.trim().length >= 200) {
      return chunkDocument({
        frameworkCode,
        sourceUrl: source.sourceUrl,
        rawText,
      });
    }
  }
  return fallbackChunksFromJson(frameworkCode);
}

export interface IngestFrameworkResult {
  frameworkCode: string;
  chunkCount: number;
  deleted: number;
}

export async function ingestFramework(
  frameworkCode: string,
): Promise<IngestFrameworkResult> {
  const chunks = await chunksForFramework(frameworkCode);
  if (chunks.length === 0) {
    return { frameworkCode, chunkCount: 0, deleted: 0 };
  }

  const embeddings: number[][] = [];
  for (const c of chunks) {
    const vec = await embed(c.text, "RETRIEVAL_DOCUMENT");
    if (vec.length !== EMBEDDING_DIM) {
      throw new Error(`Unexpected embedding dim ${vec.length}`);
    }
    embeddings.push(vec);
  }

  const db = getDb();
  return db.begin(async (sql) => {
    const deleted = await sql`
      DELETE FROM regulatory_chunks WHERE framework_code = ${frameworkCode}
    `;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const v = vectorLiteral(embeddings[i]);
      await sql`
        INSERT INTO regulatory_chunks (framework_code, clause_ref, source_url, text, embedding)
        VALUES (${c.frameworkCode}, ${c.clauseRef}, ${c.sourceUrl}, ${c.text}, ${v}::vector)
      `;
    }
    return {
      frameworkCode,
      chunkCount: chunks.length,
      deleted: deleted.count ?? 0,
    };
  });
}
