"use server";

import { revalidatePath } from "next/cache";
import { requireUserId, getProfile, getCompletedCodes } from "@/lib/profile";
import { loadFrameworks } from "@/lib/rules/load";
import { computeObligations } from "@/lib/rules/engine";
import { listEvidenceByUser } from "@/lib/db/evidence";
import type { EvidenceRow } from "@/lib/db/evidence";
import { buildOscalAttestation } from "@/lib/export/oscal";
import {
  getTrustCenterByUser,
  isSlugAvailable,
  setTrustCenterPublic,
  upsertTrustCenter,
} from "@/lib/db/trust";

const SLUG_RX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/;

function slugifyFallback(name: string, userId: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  if (base.length >= 3) return base;
  const tail = userId.replace(/[^a-z0-9]/gi, "").slice(-8).toLowerCase();
  return `deeppay-${tail || "entity"}`;
}

async function snapshotAttestation(userId: string) {
  const [profile, frameworks, completed, allEvidence] = await Promise.all([
    getProfile(),
    loadFrameworks(),
    getCompletedCodes(),
    listEvidenceByUser(userId),
  ]);
  const evidenceByCode = new Map<string, EvidenceRow[]>();
  for (const e of allEvidence) {
    const bucket = evidenceByCode.get(e.obligationCode);
    if (bucket) bucket.push(e);
    else evidenceByCode.set(e.obligationCode, [e]);
  }
  const obligations = computeObligations(profile, frameworks, {
    completedCodes: completed,
  });
  const att = buildOscalAttestation({
    userId,
    entityName: profile.name,
    entityType: profile.entityType,
    obligations,
    evidenceByCode,
  });
  return { profile, obligations, evidenceByCode, att };
}

export async function saveTrustCenterSlug(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const requested = String(formData.get("slug") ?? "").trim().toLowerCase();
  const profile = await getProfile();
  const slug = requested || slugifyFallback(profile.name, userId);
  if (!SLUG_RX.test(slug)) {
    throw new Error(
      "Slug must be 3-40 chars, lowercase a-z 0-9 and dashes, not starting/ending with dash.",
    );
  }
  const available = await isSlugAvailable(slug, userId);
  if (!available) throw new Error(`Slug "${slug}" is already taken.`);

  const existing = await getTrustCenterByUser(userId);
  const { att } = await snapshotAttestation(userId);
  await upsertTrustCenter({
    userId,
    slug,
    isPublic: existing?.isPublic ?? false,
    attestationHash: att.contentHash,
    attestation: att.document,
  });
  revalidatePath("/dashboard/trust");
  if (existing?.slug && existing.slug !== slug) {
    revalidatePath(`/trust/${existing.slug}`);
  }
  revalidatePath(`/trust/${slug}`);
}

export async function publishTrustCenter(): Promise<void> {
  const userId = await requireUserId();
  const profile = await getProfile();
  const existing = await getTrustCenterByUser(userId);
  const slug = existing?.slug ?? slugifyFallback(profile.name, userId);
  const { att } = await snapshotAttestation(userId);
  await upsertTrustCenter({
    userId,
    slug,
    isPublic: true,
    attestationHash: att.contentHash,
    attestation: att.document,
  });
  revalidatePath("/dashboard/trust");
  revalidatePath(`/trust/${slug}`);
}

export async function unpublishTrustCenter(): Promise<void> {
  const userId = await requireUserId();
  const row = await setTrustCenterPublic(userId, false);
  revalidatePath("/dashboard/trust");
  if (row?.slug) revalidatePath(`/trust/${row.slug}`);
}

export async function refreshTrustCenter(): Promise<void> {
  const userId = await requireUserId();
  const existing = await getTrustCenterByUser(userId);
  if (!existing) throw new Error("No trust center configured yet.");
  const { att } = await snapshotAttestation(userId);
  await upsertTrustCenter({
    userId,
    slug: existing.slug,
    isPublic: existing.isPublic,
    attestationHash: att.contentHash,
    attestation: att.document,
  });
  revalidatePath("/dashboard/trust");
  revalidatePath(`/trust/${existing.slug}`);
}
