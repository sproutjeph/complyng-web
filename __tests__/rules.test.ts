import { describe, expect, test } from "vitest";
import { computeObligations, complianceScore } from "@/lib/rules/engine";
import { loadFrameworks } from "@/lib/rules/load";
import type { BusinessProfile } from "@/lib/rules/types";

const fixedNow = new Date("2026-05-01T00:00:00Z");

const fintech: BusinessProfile = {
  name: "Acme Pay",
  entityType: "fintech",
  processesPersonalData: true,
  userCountNG: 250_000,
  handlesPayments: true,
  offersDigitalAssets: false,
  isLicensedByCBN: true,
  isLicensedByNCC: false,
  isLicensedBySEC: false,
};

const platform: BusinessProfile = {
  name: "NaijaShare",
  entityType: "platform",
  processesPersonalData: true,
  userCountNG: 2_000_000,
  handlesPayments: false,
  offersDigitalAssets: false,
  isLicensedByCBN: false,
  isLicensedByNCC: false,
  isLicensedBySEC: false,
};

const telco: BusinessProfile = {
  name: "Zoom Telco",
  entityType: "telco",
  processesPersonalData: true,
  userCountNG: 5_000_000,
  handlesPayments: false,
  offersDigitalAssets: false,
  isLicensedByCBN: false,
  isLicensedByNCC: true,
  isLicensedBySEC: false,
};

const vasp: BusinessProfile = {
  name: "KoboEx",
  entityType: "vasp",
  processesPersonalData: true,
  userCountNG: 50_000,
  handlesPayments: true,
  offersDigitalAssets: true,
  isLicensedByCBN: false,
  isLicensedByNCC: false,
  isLicensedBySEC: true,
};

describe("computeObligations", () => {
  test("fintech sees CBN + NDPC obligations, not NCC/NITDA", async () => {
    const frameworks = await loadFrameworks();
    const obs = computeObligations(fintech, frameworks, { now: fixedNow });
    const codes = new Set(obs.map((o) => o.framework.code));
    expect(codes.has("CBN")).toBe(true);
    expect(codes.has("NDPC")).toBe(true);
    expect(codes.has("NCC")).toBe(false);
    expect(codes.has("NITDA")).toBe(false);
    expect(codes.has("SEC")).toBe(false);
  });

  test("platform above 100k users triggers NITDA incorporation", async () => {
    const frameworks = await loadFrameworks();
    const obs = computeObligations(platform, frameworks, { now: fixedNow });
    const inc = obs.find((o) => o.obligation.code === "NITDA-INC-001");
    expect(inc).toBeDefined();
  });

  test("small platform under 100k users skips NITDA incorporation", async () => {
    const frameworks = await loadFrameworks();
    const small = { ...platform, userCountNG: 5_000 };
    const obs = computeObligations(small, frameworks, { now: fixedNow });
    const inc = obs.find((o) => o.obligation.code === "NITDA-INC-001");
    expect(inc).toBeUndefined();
  });

  test("telco gets NCC obligations", async () => {
    const frameworks = await loadFrameworks();
    const obs = computeObligations(telco, frameworks, { now: fixedNow });
    const codes = new Set(obs.map((o) => o.framework.code));
    expect(codes.has("NCC")).toBe(true);
    expect(codes.has("NITDA")).toBe(true);
    expect(codes.has("CBN")).toBe(false);
  });

  test("VASP gets SEC + CBN-payments obligations", async () => {
    const frameworks = await loadFrameworks();
    const obs = computeObligations(vasp, frameworks, { now: fixedNow });
    const codes = new Set(obs.map((o) => o.framework.code));
    expect(codes.has("SEC")).toBe(true);
    const kyc = obs.find((o) => o.obligation.code === "CBN-KYC-007");
    expect(kyc).toBeDefined();
  });

  test("completed obligations count as met in score", async () => {
    const frameworks = await loadFrameworks();
    const all = computeObligations(fintech, frameworks, { now: fixedNow });
    const completed = new Set(all.slice(0, 3).map((o) => o.obligation.code));
    const withCompleted = computeObligations(fintech, frameworks, {
      now: fixedNow,
      completedCodes: completed,
    });
    const score = complianceScore(withCompleted);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test("overdue sorts before upcoming", async () => {
    const frameworks = await loadFrameworks();
    const future = new Date("2100-01-01T00:00:00Z");
    const obs = computeObligations(fintech, frameworks, { now: future });
    const firstOverdueIdx = obs.findIndex((o) => o.status === "overdue");
    const firstUpcomingIdx = obs.findIndex((o) => o.status === "upcoming");
    if (firstOverdueIdx !== -1 && firstUpcomingIdx !== -1) {
      expect(firstOverdueIdx).toBeLessThan(firstUpcomingIdx);
    }
  });
});
