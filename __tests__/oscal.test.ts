import { describe, expect, test } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { buildOscalAttestation, attestationFilename } from "@/lib/export/oscal";
import type { ComputedObligation } from "@/lib/rules/types";
import type { EvidenceRow } from "@/lib/db/evidence";

const fixedNow = new Date("2026-05-01T10:00:00Z");

const sampleObligations: ComputedObligation[] = [
  {
    framework: { code: "NDPC-GAID", name: "NDPC GAID 2025" },
    obligation: {
      code: "NDPC-GAID-REG-001",
      title: "Register with NDPC",
      description: "All data controllers of major importance must register.",
      clauseRef: "GAID 2025 Part II s.4",
      sourceUrl: "https://ndpc.gov.ng/gaid",
      trigger: { type: "if_processes_personal_data" },
      dueRule: { type: "annual", month: 3, day: 31 },
      penaltyKobo: 50_000_000_00,
      verifyStatus: "unverified",
    },
    status: "met",
    dueDate: "2026-03-31",
    reason: "evidence-on-file",
  },
  {
    framework: { code: "NDPC-GAID", name: "NDPC GAID 2025" },
    obligation: {
      code: "NDPC-GAID-DPO-002",
      title: "Designate a DPO",
      description: "Entities of major importance must appoint a DPO.",
      clauseRef: "GAID 2025 Part III s.12",
      sourceUrl: "https://ndpc.gov.ng/gaid",
      trigger: { type: "always" },
      dueRule: { type: "once" },
      penaltyKobo: null,
      verifyStatus: "unverified",
    },
    status: "overdue",
    dueDate: null,
    reason: "no-evidence",
  },
];

const sampleEvidence: EvidenceRow[] = [
  {
    id: 42,
    userId: "user_ABC",
    obligationCode: "NDPC-GAID-REG-001",
    kind: "file",
    filename: "ndpc-receipt.pdf",
    storagePath: "data/evidence/user_ABC/abc.pdf",
    mime: "application/pdf",
    sha256: "a".repeat(64),
    url: null,
    note: "2026 registration receipt",
    uploadedBy: "user_ABC",
    uploadedAt: "2026-04-15T09:12:00.000Z",
  },
];

function makeInput() {
  const evidenceByCode = new Map<string, EvidenceRow[]>();
  evidenceByCode.set("NDPC-GAID-REG-001", sampleEvidence.map((e) => ({ ...e })));
  return {
    userId: "user_ABC",
    entityName: "Acme Pay",
    entityType: "fintech",
    obligations: sampleObligations,
    evidenceByCode,
    generatedAt: fixedNow,
  };
}

describe("oscal attestation", () => {
  test("produces deterministic content hash for stable input", () => {
    const a = buildOscalAttestation(makeInput());
    const b = buildOscalAttestation(makeInput());
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  test("hash changes when evidence is added", () => {
    const a = buildOscalAttestation(makeInput());
    const input2 = makeInput();
    input2.evidenceByCode.get("NDPC-GAID-REG-001")!.push({
      ...sampleEvidence[0],
      id: 43,
      sha256: "b".repeat(64),
      filename: "extra.pdf",
    });
    const b = buildOscalAttestation(input2);
    expect(a.contentHash).not.toBe(b.contentHash);
  });

  test("emits finding per obligation and observation per evidence", () => {
    const att = buildOscalAttestation(makeInput());
    const ar = att.document["assessment-results"] as Record<string, unknown>;
    const results = ar.results as Array<Record<string, unknown>>;
    const findings = results[0].findings as unknown[];
    const observations = results[0].observations as unknown[];
    expect(findings).toHaveLength(2);
    expect(observations).toHaveLength(1);
  });

  test("maps obligation state to OSCAL state correctly", () => {
    const att = buildOscalAttestation(makeInput());
    const ar = att.document["assessment-results"] as Record<string, unknown>;
    const results = ar.results as Array<Record<string, unknown>>;
    const findings = results[0].findings as Array<{
      target?: { status?: { state?: string } };
    }>;
    expect(findings[0].target?.status?.state).toBe("satisfied");
    expect(findings[1].target?.status?.state).toBe("not-satisfied");
  });

  test("signs with HMAC when ATTESTATION_HMAC_SECRET is set", () => {
    process.env.ATTESTATION_HMAC_SECRET = "test-secret";
    try {
      const att = buildOscalAttestation(makeInput());
      expect(att.signature).toMatch(/^[0-9a-f]{64}$/);
      const expected = createHmac("sha256", "test-secret")
        .update(JSON.stringify(att.document, Object.keys(att.document).sort()))
        .digest("hex");
      expect(att.signature).not.toBe(expected);
      const noSecretAtt = (() => {
        delete process.env.ATTESTATION_HMAC_SECRET;
        return buildOscalAttestation(makeInput());
      })();
      expect(noSecretAtt.signature).toBeNull();
    } finally {
      delete process.env.ATTESTATION_HMAC_SECRET;
    }
  });

  test("content hash is sha256 of canonical JSON", () => {
    const att = buildOscalAttestation(makeInput());
    expect(att.contentHash).toHaveLength(64);
    const roundtrip = createHash("sha256")
      .update(att.contentHash)
      .digest("hex");
    expect(roundtrip).not.toBe(att.contentHash);
  });

  test("attestationFilename slugifies entity name", () => {
    const name = attestationFilename("Acme Pay Ltd.", fixedNow);
    expect(name).toBe("complyng-attestation-acme-pay-ltd-2026-05-01.json");
  });
});
