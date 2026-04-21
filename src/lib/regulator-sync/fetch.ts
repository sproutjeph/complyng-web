import "server-only";
import { createHash } from "node:crypto";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { findSource, readSourceRawText, type Source } from "@/lib/ingest/ingest-framework";

export type FetchOrigin = "remote" | "local" | "none";

export interface FetchedSource {
  frameworkCode: string;
  sourceUrl: string;
  origin: FetchOrigin;
  rawText: string;
  normalized: string;
  contentHash: string;
}

const REMOTE_FETCH_TIMEOUT_MS = 20_000;
const MIN_CONTENT_CHARS = 200;

function normalize(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\t ]+/g, " ")
    .trim();
}

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function fetchRemoteText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "ComplyNG-RegulatorSync/1.0" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (contentType.includes("application/pdf") || ext === ".pdf") {
      const buf = Buffer.from(await res.arrayBuffer());
      const pdf = await getDocumentProxy(new Uint8Array(buf));
      const { text } = await extractText(pdf, { mergePages: true });
      return Array.isArray(text) ? text.join("\n") : text;
    }
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchFrameworkSource(
  frameworkCode: string,
): Promise<FetchedSource | null> {
  const source: Source | null = await findSource(frameworkCode);
  if (!source) return null;

  let origin: FetchOrigin = "none";
  let rawText: string | null = null;

  if (process.env.REGULATOR_SYNC_REMOTE !== "0") {
    rawText = await fetchRemoteText(source.sourceUrl);
    if (rawText && rawText.trim().length >= MIN_CONTENT_CHARS) {
      origin = "remote";
    } else {
      rawText = null;
    }
  }

  if (!rawText) {
    rawText = await readSourceRawText(source);
    if (rawText && rawText.trim().length >= MIN_CONTENT_CHARS) {
      origin = "local";
    } else {
      return null;
    }
  }

  const normalized = normalize(rawText);
  return {
    frameworkCode,
    sourceUrl: source.sourceUrl,
    origin,
    rawText,
    normalized,
    contentHash: sha256(normalized),
  };
}
