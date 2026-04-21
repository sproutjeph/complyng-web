#!/usr/bin/env bun
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDb } from "../src/lib/db/client";
import { ingestFramework, loadSources } from "../src/lib/ingest/ingest-framework";

const DOCS_DIR = path.join(process.cwd(), "content", "docs");
const FRAMEWORKS_DIR = path.join(process.cwd(), "content", "frameworks");

async function collectFrameworkCodes(): Promise<string[]> {
  const sources = await loadSources();
  const fromSources = sources.map((s) => s.frameworkCode);

  const fromJson: string[] = [];
  const entries = await readdir(FRAMEWORKS_DIR).catch(() => [] as string[]);
  for (const f of entries) {
    if (!f.endsWith(".json")) continue;
    const data = JSON.parse(await readFile(path.join(FRAMEWORKS_DIR, f), "utf8"));
    if (data.code) fromJson.push(data.code);
  }

  return Array.from(new Set([...fromSources, ...fromJson]));
}

async function main() {
  const codes = await collectFrameworkCodes();
  console.log(`Ingesting ${codes.length} framework(s): ${codes.join(", ")}`);

  let totalChunks = 0;
  for (const code of codes) {
    const r = await ingestFramework(code);
    console.log(
      `  ${code}: ${r.chunkCount} chunks (replaced ${r.deleted} existing rows)`,
    );
    totalChunks += r.chunkCount;
  }

  const db = getDb();
  const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM regulatory_chunks`;
  console.log(`\nIngest complete. regulatory_chunks rows: ${count}`);

  const snapshotPath = path.join(DOCS_DIR, ".last-ingest.json");
  await writeFile(
    snapshotPath,
    JSON.stringify(
      { at: new Date().toISOString(), frameworks: codes.length, chunks: totalChunks },
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
  .finally(() => getDb().end());
