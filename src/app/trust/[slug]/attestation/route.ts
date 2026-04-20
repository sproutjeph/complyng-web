import { NextResponse } from "next/server";
import { getTrustCenterBySlug } from "@/lib/db/trust";
import { attestationFilename } from "@/lib/export/oscal";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const trust = await getTrustCenterBySlug(slug);
  if (!trust || !trust.attestation) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ar = trust.attestation["assessment-results"] as
    | Record<string, unknown>
    | undefined;
  const metadata = ar?.metadata as Record<string, unknown> | undefined;
  const propsArr =
    (metadata?.props as Array<{ name?: string; value?: string }> | undefined) ??
    [];
  const entityName =
    propsArr.find((p) => p.name === "entity-name")?.value ?? slug;

  const payload = {
    ...trust.attestation,
    "complyng-attestation": {
      "content-hash": trust.attestationHash,
      "hash-algorithm": "sha256",
      signature: null,
      "signed-at": trust.publishedAt,
      "signature-algorithm": null,
      "trust-center-slug": slug,
    },
  };

  const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
  const filename = attestationFilename(
    entityName,
    trust.publishedAt ? new Date(trust.publishedAt) : new Date(),
  );

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
