import { notFound } from "next/navigation";
import Link from "next/link";
import { Shield, CheckCircle2, CircleAlert, FileText, Link2 as LinkIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTrustCenterBySlug } from "@/lib/db/trust";

export const dynamic = "force-dynamic";

interface OscalFinding {
  uuid?: string;
  title?: string;
  description?: string;
  target?: { target_id?: string; status?: { state?: string; reason?: string } };
  props?: Array<{ name?: string; value?: string }>;
  links?: Array<{ href?: string; rel?: string }>;
  related_observations?: Array<{ observation_uuid?: string }>;
}

interface OscalObservation {
  uuid?: string;
  title?: string;
  description?: string;
  collected?: string;
  links?: Array<{ href?: string; rel?: string }>;
  props?: Array<{ name?: string; value?: string }>;
}

function propValue(
  props: Array<{ name?: string; value?: string }> | undefined,
  name: string,
): string | null {
  if (!props) return null;
  for (const p of props) if (p.name === name) return p.value ?? null;
  return null;
}

function stateLabel(state: string | undefined): {
  label: string;
  variant: "secondary" | "destructive" | "outline" | "ghost";
} {
  switch (state) {
    case "satisfied":
      return { label: "Compliant", variant: "secondary" };
    case "not-satisfied":
      return { label: "Overdue", variant: "destructive" };
    case "other":
      return { label: "Upcoming", variant: "outline" };
    case "not-applicable":
      return { label: "N/A", variant: "ghost" };
    default:
      return { label: state ?? "unknown", variant: "outline" };
  }
}

export default async function PublicTrustCenter({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trust = await getTrustCenterBySlug(slug);
  if (!trust || !trust.attestation) notFound();

  const ar = trust.attestation["assessment-results"] as
    | Record<string, unknown>
    | undefined;
  if (!ar) notFound();

  const metadata = ar.metadata as Record<string, unknown> | undefined;
  const metadataProps = (metadata?.props ?? []) as Array<{
    name?: string;
    value?: string;
  }>;
  const entityName = propValue(metadataProps, "entity-name") ?? slug;
  const entityType = propValue(metadataProps, "entity-type") ?? "";
  const published = (metadata?.published as string | undefined) ?? null;

  const results = (ar.results ?? []) as Array<Record<string, unknown>>;
  const result0 = results[0] ?? {};
  const findings = ((result0.findings ?? []) as OscalFinding[]) ?? [];
  const observations = ((result0.observations ??
    []) as OscalObservation[]) ?? [];
  const observationsByUuid = new Map<string, OscalObservation>();
  for (const o of observations) {
    if (o.uuid) observationsByUuid.set(o.uuid, o);
  }

  const framed = findings.map((f) => {
    const state = f.target?.status?.state;
    const obs = (f.related_observations ?? [])
      .map((r) => (r.observation_uuid ? observationsByUuid.get(r.observation_uuid) : null))
      .filter((o): o is OscalObservation => Boolean(o));
    return {
      finding: f,
      state,
      framework: propValue(f.props, "framework") ?? "",
      clauseRef: propValue(f.props, "clause-ref") ?? "",
      evidence: obs,
    };
  });

  const byFramework = new Map<string, typeof framed>();
  for (const f of framed) {
    const k = f.framework || "OTHER";
    const bucket = byFramework.get(k);
    if (bucket) bucket.push(f);
    else byFramework.set(k, [f]);
  }
  const frameworkOrder = [...byFramework.keys()].sort();

  const total = framed.length;
  const met = framed.filter((f) => f.state === "satisfied").length;
  const overdue = framed.filter((f) => f.state === "not-satisfied").length;
  const score = total === 0 ? 0 : Math.round((met / total) * 100);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <span className="font-bold tracking-tight">ComplyNG</span>
          </Link>
          <span className="text-xs text-muted-foreground">Public Trust Center</span>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {entityType.replace(/_/g, " ")}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {entityName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nigerian regulatory posture, attested via OSCAL. Hash-anchored and
          verifiable.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Compliance score</p>
            <p className="font-heading text-2xl font-bold">{score}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Obligations met</p>
            <p className="font-heading text-2xl font-bold">
              {met}
              <span className="text-base text-muted-foreground">/{total}</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p
              className={`font-heading text-2xl font-bold ${
                overdue > 0 ? "text-destructive" : ""
              }`}
            >
              {overdue}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Frameworks</p>
            <p className="font-heading text-2xl font-bold">
              {byFramework.size}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-xs">
          <p className="font-medium">Attestation hash (sha256)</p>
          <p className="mt-1 break-all font-mono text-[0.7rem] text-muted-foreground">
            {trust.attestationHash ?? "—"}
          </p>
          {published && (
            <p className="mt-2 text-muted-foreground">
              Snapshot published{" "}
              <time dateTime={published}>
                {new Date(published).toLocaleString()}
              </time>
            </p>
          )}
          <p className="mt-2 text-muted-foreground">
            Regulators can{" "}
            <a
              href={`/trust/${slug}/attestation?download=1`}
              className="text-primary hover:underline"
            >
              download this snapshot as OSCAL JSON
            </a>{" "}
            and verify the hash byte-for-byte against{" "}
            <span className="font-mono">canonical(document)</span>.
          </p>
        </div>

        {frameworkOrder.map((code) => {
          const items = byFramework.get(code)!;
          return (
            <section key={code} className="mt-8">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {code}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {items.length} obligation{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map(({ finding, state, clauseRef, evidence }) => {
                  const tone = stateLabel(state);
                  const Icon = state === "satisfied" ? CheckCircle2 : CircleAlert;
                  const iconClass =
                    state === "satisfied"
                      ? "text-emerald-600 dark:text-emerald-500"
                      : state === "not-satisfied"
                        ? "text-destructive"
                        : "text-muted-foreground";
                  const sourceLink = (finding.links ?? []).find(
                    (l) => l.rel === "reference",
                  );
                  return (
                    <article
                      key={finding.uuid ?? finding.target?.target_id}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`mt-0.5 size-5 shrink-0 ${iconClass}`} />
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium leading-tight">
                              {finding.title}
                            </h3>
                            <Badge variant={tone.variant}>{tone.label}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="font-mono">{clauseRef}</span>
                            {sourceLink?.href && (
                              <a
                                href={sourceLink.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                              >
                                source
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                            <span>
                              {evidence.length} evidence record
                              {evidence.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          {evidence.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs">
                              {evidence.map((e) => {
                                const kind =
                                  propValue(e.props, "evidence-kind") ?? "note";
                                const sha = propValue(e.props, "sha256");
                                const ref = (e.links ?? []).find(
                                  (l) => l.rel === "reference",
                                );
                                const Icon2 = kind === "file" ? FileText : LinkIcon;
                                return (
                                  <li
                                    key={e.uuid}
                                    className="flex items-start gap-2 rounded border border-border/60 bg-muted/20 p-2"
                                  >
                                    <Icon2 className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                      {ref?.href ? (
                                        <a
                                          href={ref.href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="truncate font-medium hover:underline"
                                        >
                                          {ref.href}
                                        </a>
                                      ) : (
                                        <p className="truncate font-medium">
                                          {e.description}
                                        </p>
                                      )}
                                      {sha && (
                                        <p className="text-[0.65rem] text-muted-foreground">
                                          sha256{" "}
                                          <span className="font-mono">
                                            {sha.slice(0, 16)}…
                                          </span>
                                          {e.collected && (
                                            <>
                                              {" · "}
                                              {new Date(
                                                e.collected,
                                              ).toLocaleDateString()}
                                            </>
                                          )}
                                        </p>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        <footer className="mt-12 border-t border-border/50 pt-6 text-xs text-muted-foreground">
          <p>
            Hackathon prototype — obligations are generated automatically from
            Nigerian regulatory frameworks (NDPC GAID 2025, NDPR 2019, CBN, NCC,
            FIRS, SEC). This page is not legal advice.
          </p>
        </footer>
      </section>
    </main>
  );
}
