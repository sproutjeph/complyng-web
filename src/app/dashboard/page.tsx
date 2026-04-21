import { loadFrameworks } from "@/lib/rules/load";
import { computeObligations, complianceScore } from "@/lib/rules/engine";
import { getCompletedCodes, getProfile } from "@/lib/profile";
import { requireUserId } from "@/lib/profile";
import { listEvidenceByUser } from "@/lib/db/evidence";
import { ScoreCard } from "@/components/dashboard/score-card";
import { ObligationRow } from "@/components/dashboard/obligation-row";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { RegulatorChangeBanner } from "@/components/dashboard/regulator-change-banner";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import type { EvidenceRow } from "@/lib/db/evidence";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
  const score = complianceScore(obligations);
  const met = obligations.filter((o) => o.status === "met").length;
  const overdue = obligations.filter((o) => o.status === "overdue").length;

  const byFramework = groupBy(obligations, (o) => o.framework.code);
  const frameworkOrder = [...byFramework.keys()].sort();

  return (
    <>
      <DashboardNav current="/dashboard" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {profile.entityType.replace(/_/g, " ")}
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              {profile.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/export/oscal?download=1"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Download className="size-3.5" />
              Export OSCAL
            </a>
            <Link
              href="/dashboard/profile"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Edit profile
            </Link>
          </div>
        </div>

        <RegulatorChangeBanner />

        <ScoreCard
          score={score}
          total={obligations.length}
          met={met}
          overdue={overdue}
        />

        <div className="mt-6 mb-2 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Obligations across {byFramework.size} regulators
          </h2>
          <Link
            href="/dashboard/ask"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ask about a regulation
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {obligations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
            No obligations match this profile. Try editing the profile to add
            licenses or processing attributes.
          </p>
        ) : (
          <div className="space-y-6">
            {frameworkOrder.map((code) => {
              const items = byFramework.get(code)!;
              const framework = items[0].framework;
              return (
                <section key={code}>
                  <div className="mb-2 flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {code}
                    </Badge>
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      {framework.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {items.length} obligation{items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {items.map((item) => (
                      <ObligationRow
                        key={item.obligation.code}
                        item={item}
                        evidence={evidenceByCode.get(item.obligation.code) ?? []}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="mt-10 rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          Hackathon prototype. Every obligation is marked{" "}
          <span className="font-mono">unverified</span> until reviewed by
          counsel — do not treat as legal advice.
        </p>
      </main>
    </>
  );
}

function groupBy<T, K>(arr: readonly T[], key: (x: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const x of arr) {
    const k = key(x);
    const bucket = m.get(k);
    if (bucket) bucket.push(x);
    else m.set(k, [x]);
  }
  return m;
}
