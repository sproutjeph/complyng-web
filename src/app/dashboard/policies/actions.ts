"use server";

import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { parsePolicy } from "@/lib/policy/parser";
import { saveUploadedPolicy } from "@/lib/policy/storage";
import { embed } from "@/lib/llm/embedder";
import { insertPolicyWithChunks } from "@/lib/db/policy";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "text/markdown", "text/plain"]);
const ALLOWED_EXTS = [".pdf", ".md", ".markdown", ".txt"];

export type UploadResult = { error: string };

export async function uploadPolicy(
  formData: FormData,
): Promise<UploadResult | void> {
  const userId = await requireUserId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file before uploading." };
  }
  if (file.size > MAX_BYTES) {
    return {
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`,
    };
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return {
      error: `Unsupported file type: ${ext || "(none)"}. Upload PDF, MD, or TXT.`,
    };
  }
  const mime = file.type && ALLOWED.has(file.type) ? file.type : guessMime(ext);

  let policyId: number;
  try {
    const buf = await file.arrayBuffer();
    const parsed = await parsePolicy(buf, file.name);

    if (parsed.chunks.length === 0) {
      return {
        error: "Couldn't find readable text in this file. Try a text-based PDF or Markdown.",
      };
    }

    await saveUploadedPolicy(parsed.sha256, ext.slice(1), new Uint8Array(buf));

    const embeddings: number[][] = [];
    for (const c of parsed.chunks) {
      embeddings.push(await embed(c.content, "RETRIEVAL_DOCUMENT"));
    }

    policyId = await insertPolicyWithChunks({
      userId,
      filename: file.name,
      mime: parsed.mime || mime,
      sha256: parsed.sha256,
      textBytes: parsed.text.length,
      chunks: parsed.chunks.map((c, i) => ({
        section: c.section,
        content: c.content,
        embedding: embeddings[i],
      })),
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Upload failed. Try again.",
    };
  }

  revalidatePath("/dashboard/policies");
  redirect(`/dashboard/policies/${policyId}`);
}

function guessMime(ext: string): string {
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".md" || ext === ".markdown") return "text/markdown";
  return "text/plain";
}
