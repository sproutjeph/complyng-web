"use server";

import path from "node:path";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/profile";
import { saveUploadedEvidence } from "@/lib/policy/storage";
import {
  deleteEvidence,
  insertFileEvidence,
  insertLinkEvidence,
} from "@/lib/db/evidence";
import { toggleObligationCompletion } from "@/lib/db/profile";

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg", ".md", ".txt", ".csv", ".json"]);

export async function attachFileEvidence(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) throw new Error("Missing obligation code");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No evidence file provided");
  }
  if (file.size > MAX_EVIDENCE_BYTES) {
    throw new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB.`);
  }
  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Unsupported evidence type: ${ext}. Allow PDF, MD, TXT, CSV, JSON, PNG, JPG.`);
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const storagePath = await saveUploadedEvidence(userId, sha256, ext.slice(1), buf);
  const note = String(formData.get("note") ?? "").trim() || null;

  await insertFileEvidence({
    userId,
    obligationCode: code,
    filename: file.name,
    storagePath,
    mime: file.type || "application/octet-stream",
    sha256,
    note,
    uploadedBy: userId,
  });

  await toggleObligationCompletion(userId, code, true);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/obligations/${code}`);
}

export async function attachLinkEvidence(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) throw new Error("Missing obligation code");
  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("Evidence URL must start with http:// or https://");
  const note = String(formData.get("note") ?? "").trim() || null;

  await insertLinkEvidence({
    userId,
    obligationCode: code,
    url,
    note,
    uploadedBy: userId,
  });

  await toggleObligationCompletion(userId, code, true);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/obligations/${code}`);
}

export async function removeEvidence(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) throw new Error("Missing evidence id");
  await deleteEvidence(userId, id);
  revalidatePath("/dashboard");
}
