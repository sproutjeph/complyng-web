import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Play, Loader2 } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUserId } from "@/lib/profile";
import { getPolicyById, listGapFindingsByPolicy } from "@/lib/db/policy";
import { runGapAnalysis } from "@/app/dashboard/policies/gap-actions";

export const dynamic = "force-dynamic";

const severityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const policyId = Number(id);
  if (!Number.isFinite(policyId)) notFound();

  const userId = await requireUserId();
  const policy = await getPolicyById(policyId, userId);
  if (!policy) notFound();

  const gaps = await listGapFindingsByPolicy(policyId, userId);

  return (
    <>
      <DashboardNav current="/dashboard/policies" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/policies"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All policies
        </Link>

        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          {policy.filename}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {policy.chunkCount} chunks indexed · uploaded{" "}
          {new Date(policy.uploadedAt).toLocaleString()} · sha256{" "}
          <span className="font-mono text-[0.7rem]">
            {policy.sha256.slice(0, 12)}…
          </span>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <form action={runGapAnalysis}>
            <input type="hidden" name="policyId" value={policy.id} />
            <Button type="submit">
              <Play />
              {gaps.length === 0 ? "Run gap analysis" : "Re-run gap analysis"}
            </Button>
          </form>
          {gaps.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {gaps.length} finding{gaps.length === 1 ? "" : "s"} · last run{" "}
              {new Date(gaps[0].createdAt).toLocaleString()}
            </span>
          )}
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-heading text-base font-semibold">
            GAID 2025 gap findings
          </h2>
          {gaps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <Loader2 className="mx-auto mb-2 size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No analysis yet. Click “Run gap analysis” to compare this policy against GAID 2025.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {gaps.map((g) => (
                <li
                  key={g.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={severityVariant[g.severity] ?? "outline"}>
                      <AlertTriangle className="size-3" />
                      {g.severity}
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      {g.gaidArticle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · obligation <span className="font-mono">{g.obligationCode}</span>
                    </span>
                  </div>
                  <p className="mt-2 text-sm">{g.description}</p>
                  {(g.policyCitation || g.regulationCitation) && (
                    <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                      {g.policyCitation && (
                        <div className="rounded border border-border/60 bg-muted/30 p-2">
                          <p className="mb-1 font-medium uppercase tracking-wider text-muted-foreground">
                            Your policy
                          </p>
                          <p className="text-foreground/80">{g.policyCitation}</p>
                        </div>
                      )}
                      {g.regulationCitation && (
                        <div className="rounded border border-border/60 bg-muted/30 p-2">
                          <p className="mb-1 font-medium uppercase tracking-wider text-muted-foreground">
                            GAID 2025
                          </p>
                          <p className="text-foreground/80">{g.regulationCitation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
