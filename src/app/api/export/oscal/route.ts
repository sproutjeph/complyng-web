import { NextResponse } from "next/server";
import { requireUserId, getProfile, getCompletedCodes } from "@/lib/profile";
import { loadFrameworks } from "@/lib/rules/load";
import { computeObligations } from "@/lib/rules/engine";
import { listEvidenceByUser } from "@/lib/db/evidence";
import type { EvidenceRow } from "@/lib/db/evidence";
import {
  attestationFilename,
  buildOscalAttestation,
} from "@/lib/export/oscal";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await requireUserId();
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

  const now = new Date();
  const attestation = buildOscalAttestation({
    userId,
    entityName: profile.name,
    entityType: profile.entityType,
    obligations,
    evidenceByCode,
    generatedAt: now,
  });

  const payload = {
    ...attestation.document,
    "complyng-attestation": {
      "content-hash": attestation.contentHash,
      "hash-algorithm": "sha256",
      signature: attestation.signature,
      "signed-at": attestation.signedAt,
      "signature-algorithm": attestation.signature ? "hmac-sha256" : null,
    },
  };

  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  const filename = attestationFilename(profile.name, now);

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/oscal+json; charset=utf-8",
      "cache-control": "no-store",
      ...(wantsDownload
        ? { "content-disposition": `attachment; filename="${filename}"` }
        : {}),
    },
  });
}
