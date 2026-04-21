import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUserId, getProfile } from "@/lib/profile";
import { getTrustCenterByUser } from "@/lib/db/trust";
import {
  publishTrustCenter,
  refreshTrustCenter,
  saveTrustCenterSlug,
  unpublishTrustCenter,
} from "./actions";
import { ExternalLink, Globe2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function suggestSlug(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return s.length >= 3 ? s : "deeppay";
}

export default async function TrustCenterAdminPage() {
  const userId = await requireUserId();
  const [profile, trust, reqHeaders] = await Promise.all([
    getProfile(),
    getTrustCenterByUser(userId),
    headers(),
  ]);

  const host = reqHeaders.get("host") ?? "localhost:3000";
  const proto = reqHeaders.get("x-forwarded-proto") ?? "http";
  const slug = trust?.slug ?? suggestSlug(profile.name);
  const publicUrl = `${proto}://${host}/trust/${slug}`;

  return (
    <>
      <DashboardNav current="/dashboard/trust" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Trust Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish a regulator-facing page showing your live compliance posture
            and a hash-anchored OSCAL attestation. NDPC or procurement teams can
            verify the hash against an exported OSCAL file.
          </p>
        </div>

        <section className="rounded-lg border border-border bg-card p-5">
          <form action={saveTrustCenterSlug} className="space-y-3">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Trust center slug
              </label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {proto}://{host}/trust/
                </span>
                <input
                  type="text"
                  name="slug"
                  defaultValue={slug}
                  pattern="[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?"
                  className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Lowercase a-z, 0-9, dashes. 3-40 chars.
              </p>
            </div>
            <Button type="submit" size="sm" variant="secondary">
              Save slug
            </Button>
          </form>
        </section>

        <section className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg font-semibold">Status</h2>
                <Badge
                  variant={trust?.isPublic ? "secondary" : "outline"}
                  className="text-[0.65rem]"
                >
                  {trust?.isPublic ? "Public" : "Unpublished"}
                </Badge>
              </div>
              {trust?.publishedAt && trust.isPublic && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Published {new Date(trust.publishedAt).toLocaleString()}
                </p>
              )}
              {trust?.attestationHash && (
                <p className="mt-2 break-all text-[0.7rem] text-muted-foreground">
                  <span className="font-medium">Attestation sha256:</span>{" "}
                  <span className="font-mono">{trust.attestationHash}</span>
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {trust?.isPublic ? (
                <>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {publicUrl}
                    <ExternalLink className="size-3" />
                  </a>
                  <div className="flex gap-2">
                    <form action={refreshTrustCenter}>
                      <Button type="submit" size="sm" variant="outline">
                        <RefreshCw className="size-3.5" />
                        Refresh snapshot
                      </Button>
                    </form>
                    <form action={unpublishTrustCenter}>
                      <Button type="submit" size="sm" variant="destructive">
                        Unpublish
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <form action={publishTrustCenter}>
                  <Button type="submit" size="sm">
                    <Globe2 className="size-3.5" />
                    Publish Trust Center
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        <p className="mt-6 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
          Publishing takes a snapshot of your current OSCAL attestation and
          stores it at{" "}
          <span className="font-mono">{publicUrl}</span>. Anyone with the URL
          can view obligations and evidence metadata (filenames and sha256
          hashes — not file contents). Use{" "}
          <Link
            href="/api/export/oscal?download=1"
            className="text-primary hover:underline"
          >
            Export OSCAL
          </Link>{" "}
          to download the signed JSON and hash-verify it against the trust
          page.
        </p>
      </main>
    </>
  );
}
