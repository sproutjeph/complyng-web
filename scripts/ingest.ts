#!/usr/bin/env bun
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { extractText, getDocumentProxy } from "unpdf";
import postgres from "postgres";
import { chunkDocument, type Chunk } from "../src/lib/llm/chunker";
import { embed } from "../src/lib/llm/embedder";
import { EMBEDDING_DIM } from "../src/lib/llm/config";
import { vectorLiteral } from "../src/lib/llm/db";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}
const db = postgres(url);

interface Source {
  frameworkCode: string;
  file: string;
  sourceUrl: string;
  statute: string;
}

const DOCS_DIR = path.join(process.cwd(), "content", "docs");
const MANIFEST = path.join(DOCS_DIR, "sources.json");

async function extractFromFile(file: string, frameworkCode: string, sourceUrl: string): Promise<Chunk[]> {
  const ext = path.extname(file).toLowerCase();
  const full = path.join(DOCS_DIR, file);
  if (!existsSync(full)) {
    console.warn(`\u26a0  Missing ${file} \u2014 skipping. Place the file at ${full} (see README/DEMO.md).`);
    return [];
  }

  let rawText: string;
  if (ext === ".pdf") {
    const buf = await readFile(full);
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    rawText = Array.isArray(text) ? text.join("\n") : text;
  } else if (ext === ".md" || ext === ".txt") {
    rawText = await readFile(full, "utf8");
  } else {
    console.warn(`\u26a0  Skipping ${file} \u2014 unsupported extension ${ext}`);
    return [];
  }

  if (rawText.trim().length < 200) {
    console.warn(`\u26a0  ${file} extracted too little text (${rawText.trim().length} chars) \u2014 skipping.`);
    return [];
  }

  return chunkDocument({ frameworkCode, sourceUrl, rawText });
}

async function fallbackFromJsonObligations(): Promise<Chunk[]> {
  const frameworksDir = path.join(process.cwd(), "content", "frameworks");
  const entries = await readdir(frameworksDir);
  const chunks: Chunk[] = [];
  for (const f of entries) {
    if (!f.endsWith(".json")) continue;
    const data = JSON.parse(await readFile(path.join(frameworksDir, f), "utf8"));
    for (const ob of data.obligations) {
      chunks.push({
        frameworkCode: data.code,
        sourceUrl: ob.sourceUrl,
        clauseRef: ob.clauseRef,
        text: `${data.code} \u2014 ${ob.title}\n\nClause: ${ob.clauseRef}\n\n${ob.description}`,
      });
    }
  }
  return chunks;
}

async function main() {
  const manifestRaw = await readFile(MANIFEST, "utf8").catch(() => null);
  const sources: Source[] = manifestRaw ? JSON.parse(manifestRaw).sources : [];

  console.log(`Found ${sources.length} source(s) in manifest.`);
  const allChunks: Chunk[] = [];
  const haveSourceChunks = new Set<string>();
  for (const s of sources) {
    const chunks = await extractFromFile(s.file, s.frameworkCode, s.sourceUrl);
    console.log(`  ${s.frameworkCode} \u2190 ${s.file}: ${chunks.length} chunks`);
    if (chunks.length > 0) haveSourceChunks.add(s.frameworkCode);
    allChunks.push(...chunks);
  }

  const fallback = await fallbackFromJsonObligations();
  const added = fallback.filter((c) => !haveSourceChunks.has(c.frameworkCode));
  if (added.length > 0) {
    console.log(
      `Adding ${added.length} fallback chunks for frameworks without source PDFs: ${[
        ...new Set(added.map((c) => c.frameworkCode)),
      ].join(", ")}.`,
    );
    allChunks.push(...added);
  }

  console.log(`\nEmbedding ${allChunks.length} chunks via Gemini \u2026`);
  const embeddings: number[][] = [];
  for (let i = 0; i < allChunks.length; i++) {
    const c = allChunks[i];
    const vec = await embed(c.text, "RETRIEVAL_DOCUMENT");
    if (vec.length !== EMBEDDING_DIM) {
      throw new Error(`Unexpected embedding dim ${vec.length}`);
    }
    embeddings.push(vec);
    if ((i + 1) % 10 === 0 || i === allChunks.length - 1) {
      process.stdout.write(`\r  ${i + 1}/${allChunks.length}`);
    }
  }
  process.stdout.write("\n");

  console.log("Clearing old rows \u2026");
  await db`TRUNCATE regulatory_chunks RESTART IDENTITY`;

  console.log(`Inserting ${allChunks.length} rows \u2026`);
  for (let i = 0; i < allChunks.length; i++) {
    const c = allChunks[i];
    const v = vectorLiteral(embeddings[i]);
    await db`
      INSERT INTO regulatory_chunks (framework_code, clause_ref, source_url, text, embedding)
      VALUES (${c.frameworkCode}, ${c.clauseRef}, ${c.sourceUrl}, ${c.text}, ${v}::vector)
    `;
  }

  const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM regulatory_chunks`;
  console.log(`\nIngest complete. regulatory_chunks rows: ${count}`);

  const snapshotPath = path.join(DOCS_DIR, ".last-ingest.json");
  await writeFile(
    snapshotPath,
    JSON.stringify(
      { at: new Date().toISOString(), sources: sources.length, chunks: allChunks.length },
      null,
      2,
    ),
  );
  console.log(`Wrote ${snapshotPath}`);
}

main()
  .catch((e) => {
    console.error("Ingest failed:", e);
    process.exitCode = 1;
  })
  .finally(() => db.end());
