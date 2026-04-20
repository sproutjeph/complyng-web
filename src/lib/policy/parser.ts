import "server-only";
import { createHash } from "node:crypto";
import { extractText, getDocumentProxy } from "unpdf";
import { CHUNK_OVERLAP, CHUNK_SIZE } from "@/lib/llm/config";

export interface PolicyChunk {
  section: string;
  content: string;
}

export interface ParsedPolicy {
  sha256: string;
  mime: string;
  text: string;
  chunks: PolicyChunk[];
}

export async function parsePolicy(
  buffer: ArrayBuffer,
  filename: string,
): Promise<ParsedPolicy> {
  const bytes = new Uint8Array(buffer);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const lower = filename.toLowerCase();

  let text: string;
  let mime: string;
  if (lower.endsWith(".pdf")) {
    mime = "application/pdf";
    const pdf = await getDocumentProxy(bytes);
    const extracted = await extractText(pdf, { mergePages: true });
    text = Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text;
  } else if (lower.endsWith(".md") || lower.endsWith(".markdown")) {
    mime = "text/markdown";
    text = new TextDecoder().decode(bytes);
  } else if (lower.endsWith(".txt")) {
    mime = "text/plain";
    text = new TextDecoder().decode(bytes);
  } else {
    throw new Error(`Unsupported policy file type: ${filename}`);
  }

  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[\t ]+/g, " ")
    .trim();

  if (cleaned.length < 200) {
    throw new Error(
      `Extracted only ${cleaned.length} characters from ${filename} — policy appears empty or unreadable.`,
    );
  }

  const chunks = chunkPolicyText(cleaned);
  return { sha256, mime, text: cleaned, chunks };
}

function chunkPolicyText(cleaned: string): PolicyChunk[] {
  const out: PolicyChunk[] = [];
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
    const content = cleaned.slice(i, cut).trim();
    if (content.length > 50) {
      out.push({
        section: inferSection(content) ?? `Section ${out.length + 1}`,
        content,
      });
    }
    if (cut >= cleaned.length) break;
    const next = Math.max(cut - CHUNK_OVERLAP, i + 1);
    i = next;
  }
  return out;
}

const SECTION_PATTERNS: RegExp[] = [
  /^([A-Z][A-Za-z0-9 ,&/'-]{3,80})\n/,
  /\b(Section\s+\d+[A-Z.]*(?:\s*[-:–]\s*[A-Za-z ,&/'-]{3,80})?)/,
  /\b(\d+\.\s+[A-Z][A-Za-z ,&/'-]{3,80})/,
  /\b(Article\s+\d+[A-Z.]*)/,
];

function inferSection(text: string): string | null {
  for (const pat of SECTION_PATTERNS) {
    const m = text.match(pat);
    if (m) return m[1].trim().replace(/\s+/g, " ").slice(0, 120);
  }
  return null;
}
