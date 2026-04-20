import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const POLICIES_DIR = path.join(process.cwd(), "data", "policies");
const EVIDENCE_DIR = path.join(process.cwd(), "data", "evidence");

export async function saveUploadedPolicy(sha256: string, ext: string, bytes: Uint8Array): Promise<string> {
  await mkdir(POLICIES_DIR, { recursive: true });
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const filePath = path.join(POLICIES_DIR, `${sha256}.${safeExt}`);
  await writeFile(filePath, bytes);
  return filePath;
}

export async function saveUploadedEvidence(
  userId: string,
  sha256: string,
  ext: string,
  bytes: Uint8Array,
): Promise<string> {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  const dir = path.join(EVIDENCE_DIR, safeUser);
  await mkdir(dir, { recursive: true });
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const filePath = path.join(dir, `${sha256}.${safeExt}`);
  await writeFile(filePath, bytes);
  return filePath;
}
