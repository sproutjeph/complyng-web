import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";
import type { ComputedObligation } from "@/lib/rules/types";
import type { EvidenceRow } from "@/lib/db/evidence";

export interface OscalInput {
  userId: string;
  entityName: string;
  entityType: string;
  obligations: readonly ComputedObligation[];
  evidenceByCode: ReadonlyMap<string, readonly EvidenceRow[]>;
  generatedAt?: Date;
}

export interface OscalAttestation {
  document: Record<string, unknown>;
  contentHash: string;
  signature: string | null;
  signedAt: string;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}

function deterministicUuid(namespace: string, value: string): string {
  const hash = createHash("sha1").update(`${namespace}:${value}`).digest("hex");
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function findingState(status: ComputedObligation["status"]): string {
  switch (status) {
    case "met":
      return "satisfied";
    case "overdue":
      return "not-satisfied";
    case "upcoming":
      return "other";
    case "not_applicable":
      return "not-applicable";
  }
}

function buildObservation(ev: EvidenceRow): Record<string, unknown> {
  const uuid = deterministicUuid("complyng:evidence", String(ev.id));
  const descriptionParts: string[] = [];
  if (ev.kind === "file" && ev.filename) {
    descriptionParts.push(`Uploaded file: ${ev.filename}`);
    if (ev.sha256) descriptionParts.push(`sha256: ${ev.sha256}`);
  } else if (ev.kind === "link" && ev.url) {
    descriptionParts.push(`Verification URL: ${ev.url}`);
  } else if (ev.note) {
    descriptionParts.push(`Note: ${ev.note}`);
  }
  if (ev.note && ev.kind !== "note") descriptionParts.push(`Note: ${ev.note}`);

  const links: Array<Record<string, unknown>> = [];
  if (ev.kind === "link" && ev.url) {
    links.push({ href: ev.url, rel: "reference" });
  }

  return {
    uuid,
    title: `Evidence ${ev.id} for ${ev.obligationCode}`,
    description: descriptionParts.join(" — ") || "Evidence record",
    methods: [ev.kind === "file" ? "EXAMINE" : "INTERVIEW"],
    types: ["evidence"],
    collected: ev.uploadedAt,
    ...(links.length > 0 ? { links } : {}),
    props: [
      { name: "evidence-kind", value: ev.kind },
      ...(ev.sha256 ? [{ name: "sha256", value: ev.sha256 }] : []),
      ...(ev.mime ? [{ name: "mime", value: ev.mime }] : []),
      { name: "uploaded-by", value: ev.uploadedBy },
    ],
  };
}

function buildFinding(
  item: ComputedObligation,
  evidence: readonly EvidenceRow[],
  observationUuids: string[],
): Record<string, unknown> {
  const uuid = deterministicUuid("complyng:finding", item.obligation.code);
  const relatedObservations = observationUuids.map((u) => ({
    observation_uuid: u,
  }));
  return {
    uuid,
    title: item.obligation.title,
    description: `${item.obligation.description}\n\nClause: ${item.obligation.clauseRef}\nStatus reason: ${item.reason}`,
    target: {
      type: "objective-id",
      target_id: item.obligation.code,
      status: {
        state: findingState(item.status),
        reason: item.status,
      },
    },
    props: [
      { name: "framework", value: item.framework.code },
      { name: "clause-ref", value: item.obligation.clauseRef },
      { name: "verify-status", value: item.obligation.verifyStatus },
      ...(item.dueDate ? [{ name: "due-date", value: item.dueDate }] : []),
      ...(item.obligation.penaltyKobo != null
        ? [
            {
              name: "penalty-kobo",
              value: String(item.obligation.penaltyKobo),
            },
          ]
        : []),
      { name: "evidence-count", value: String(evidence.length) },
    ],
    links: [{ href: item.obligation.sourceUrl, rel: "reference" }],
    ...(relatedObservations.length > 0
      ? { related_observations: relatedObservations }
      : {}),
  };
}

export function buildOscalAttestation(input: OscalInput): OscalAttestation {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const assessmentUuid = deterministicUuid(
    "complyng:assessment",
    `${input.userId}:${generatedAt.slice(0, 10)}`,
  );
  const subjectUuid = deterministicUuid("complyng:subject", input.userId);

  const observations: Array<Record<string, unknown>> = [];
  const findings: Array<Record<string, unknown>> = [];

  for (const item of input.obligations) {
    const ev = input.evidenceByCode.get(item.obligation.code) ?? [];
    const uuids: string[] = [];
    for (const e of ev) {
      const obs = buildObservation(e);
      observations.push(obs);
      uuids.push(String(obs.uuid));
    }
    findings.push(buildFinding(item, ev, uuids));
  }

  const document = {
    "assessment-results": {
      uuid: assessmentUuid,
      metadata: {
        title: `ComplyNG attestation — ${input.entityName}`,
        published: generatedAt,
        "last-modified": generatedAt,
        version: "1.0.0",
        "oscal-version": "1.1.2",
        props: [
          { name: "entity-name", value: input.entityName },
          { name: "entity-type", value: input.entityType },
          { name: "generator", value: "complyng" },
        ],
        parties: [
          {
            uuid: subjectUuid,
            type: "organization",
            name: input.entityName,
          },
        ],
      },
      "import-ap": {
        href: "#complyng-assessment-plan",
        remarks:
          "Assessment plan is implicit: Nigerian regulatory frameworks (NDPC-GAID, NDPC-NDPR, CBN, NCC, FIRS, SEC).",
      },
      results: [
        {
          uuid: deterministicUuid("complyng:result", input.userId),
          title: "Compliance posture snapshot",
          description:
            "Automated assessment of obligations from loaded frameworks, with evidence-backed findings.",
          start: generatedAt,
          end: generatedAt,
          "reviewed-controls": {
            "control-selections": [
              {
                description: "All computed obligations for the entity profile",
              },
            ],
          },
          observations,
          findings,
        },
      ],
    },
  };

  const canonical = stableStringify(document);
  const contentHash = createHash("sha256").update(canonical).digest("hex");
  const secret = process.env.ATTESTATION_HMAC_SECRET ?? "";
  const signature = secret
    ? createHmac("sha256", secret).update(canonical).digest("hex")
    : null;

  return {
    document,
    contentHash,
    signature,
    signedAt: generatedAt,
  };
}

export function attestationFilename(entityName: string, date: Date): string {
  const slug = entityName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "entity";
  const day = date.toISOString().slice(0, 10);
  return `complyng-attestation-${slug}-${day}.json`;
}

export { randomUUID };
