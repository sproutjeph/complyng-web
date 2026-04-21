import { describe, expect, test } from "vitest";
import {
  ONBOARDING_STEPS,
  isOnboardingComplete,
  nextIncompleteStep,
  rowToBusinessProfile,
  type ProfileRow,
} from "@/lib/db/profile";

function makeRow(patch: Partial<ProfileRow> = {}): ProfileRow {
  return {
    userId: "user_test",
    name: "DeepPay",
    website: null,
    contactName: null,
    entityType: null,
    nigerianUsers: 0,
    processesPersonalData: false,
    handlesPayments: false,
    custodiesDigitalAssets: false,
    sendsTelcoTraffic: false,
    licensedByCbn: false,
    licensedByNcc: false,
    registeredWithSec: false,
    hasDpo: false,
    completedSteps: [],
    completedAt: null,
    ...patch,
  };
}

describe("nextIncompleteStep", () => {
  test("null row routes to basics", () => {
    expect(nextIncompleteStep(null)).toBe("basics");
  });

  test("stub row with no steps routes to basics", () => {
    expect(nextIncompleteStep(makeRow())).toBe("basics");
  });

  test("resumes mid-wizard after basics + type", () => {
    const row = makeRow({ completedSteps: ["basics", "type"] });
    expect(nextIncompleteStep(row)).toBe("scale");
  });

  test("all steps done returns null", () => {
    const row = makeRow({ completedSteps: [...ONBOARDING_STEPS] });
    expect(nextIncompleteStep(row)).toBeNull();
  });

  test("out-of-order completed steps still advances to first missing", () => {
    const row = makeRow({ completedSteps: ["basics", "scale"] });
    expect(nextIncompleteStep(row)).toBe("type");
  });
});

describe("isOnboardingComplete", () => {
  test("null is not complete", () => {
    expect(isOnboardingComplete(null)).toBe(false);
  });

  test("completedAt marks complete even if steps array missing entries", () => {
    const row = makeRow({
      completedSteps: ["basics"],
      completedAt: "2026-04-20T00:00:00Z",
    });
    expect(isOnboardingComplete(row)).toBe(true);
  });

  test("all four steps without completedAt is complete", () => {
    const row = makeRow({ completedSteps: [...ONBOARDING_STEPS] });
    expect(isOnboardingComplete(row)).toBe(true);
  });

  test("partial steps without completedAt is incomplete", () => {
    const row = makeRow({ completedSteps: ["basics", "type"] });
    expect(isOnboardingComplete(row)).toBe(false);
  });
});

describe("rowToBusinessProfile", () => {
  test("maps custodies_digital_assets → offersDigitalAssets", () => {
    const row = makeRow({
      entityType: "vasp",
      custodiesDigitalAssets: true,
      handlesPayments: true,
      registeredWithSec: true,
    });
    const p = rowToBusinessProfile(row);
    expect(p.offersDigitalAssets).toBe(true);
    expect(p.isLicensedBySEC).toBe(true);
    expect(p.handlesPayments).toBe(true);
    expect(p.entityType).toBe("vasp");
  });

  test("falls back to fintech when entityType is null", () => {
    const row = makeRow({ entityType: null });
    const p = rowToBusinessProfile(row);
    expect(p.entityType).toBe("fintech");
  });

  test("uses 'My business' fallback when name is empty", () => {
    const row = makeRow({ name: "" });
    expect(rowToBusinessProfile(row).name).toBe("My business");
  });
});
