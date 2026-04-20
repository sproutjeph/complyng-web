import "server-only";
import { getDb } from "./client";
import type { BusinessProfile, EntityType } from "@/lib/rules/types";
import { entityTypes } from "@/lib/rules/types";

export const ONBOARDING_STEPS = ["basics", "type", "scale", "licenses"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export interface ProfileRow {
  userId: string;
  name: string;
  website: string | null;
  contactName: string | null;
  entityType: EntityType | null;
  nigerianUsers: number;
  processesPersonalData: boolean;
  handlesPayments: boolean;
  custodiesDigitalAssets: boolean;
  sendsTelcoTraffic: boolean;
  licensedByCbn: boolean;
  licensedByNcc: boolean;
  registeredWithSec: boolean;
  hasDpo: boolean;
  completedSteps: OnboardingStep[];
  completedAt: string | null;
}

export interface BasicsPatch {
  name: string;
  website?: string | null;
  contactName?: string | null;
}

export interface ScalePatch {
  nigerianUsers: number;
  processesPersonalData: boolean;
  handlesPayments: boolean;
  custodiesDigitalAssets: boolean;
  sendsTelcoTraffic: boolean;
}

export interface LicensesPatch {
  licensedByCbn: boolean;
  licensedByNcc: boolean;
  registeredWithSec: boolean;
  hasDpo: boolean;
}

function rowToProfile(r: Record<string, unknown>): ProfileRow {
  const et = r.entity_type as string | null;
  return {
    userId: r.user_id as string,
    name: (r.name as string) ?? "",
    website: (r.website as string | null) ?? null,
    contactName: (r.contact_name as string | null) ?? null,
    entityType: et && (entityTypes as readonly string[]).includes(et) ? (et as EntityType) : null,
    nigerianUsers: Number(r.nigerian_users ?? 0),
    processesPersonalData: Boolean(r.processes_personal_data),
    handlesPayments: Boolean(r.handles_payments),
    custodiesDigitalAssets: Boolean(r.custodies_digital_assets),
    sendsTelcoTraffic: Boolean(r.sends_telco_traffic),
    licensedByCbn: Boolean(r.licensed_by_cbn),
    licensedByNcc: Boolean(r.licensed_by_ncc),
    registeredWithSec: Boolean(r.registered_with_sec),
    hasDpo: Boolean(r.has_dpo),
    completedSteps: ((r.completed_steps as string[] | null) ?? []).filter(
      (s): s is OnboardingStep => (ONBOARDING_STEPS as readonly string[]).includes(s),
    ),
    completedAt: (r.completed_at as string | null) ?? null,
  };
}

export async function getProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const db = getDb();
  const rows = await db`SELECT * FROM business_profile WHERE user_id = ${userId} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToProfile(rows[0]);
}

export async function ensureProfileStub(userId: string, fallbackName = "My business"): Promise<ProfileRow> {
  const existing = await getProfileByUserId(userId);
  if (existing) return existing;
  const db = getDb();
  await db`
    INSERT INTO business_profile (user_id, name)
    VALUES (${userId}, ${fallbackName})
    ON CONFLICT (user_id) DO NOTHING
  `;
  const created = await getProfileByUserId(userId);
  if (!created) throw new Error("Failed to create profile stub");
  return created;
}

function mergeSteps(existing: OnboardingStep[], step: OnboardingStep): OnboardingStep[] {
  return existing.includes(step) ? existing : [...existing, step];
}

export async function saveBasicsStep(userId: string, patch: BasicsPatch): Promise<void> {
  await ensureProfileStub(userId, patch.name);
  const existing = await getProfileByUserId(userId);
  const steps = mergeSteps(existing?.completedSteps ?? [], "basics");
  const db = getDb();
  await db`
    UPDATE business_profile SET
      name = ${patch.name},
      website = ${patch.website ?? null},
      contact_name = ${patch.contactName ?? null},
      completed_steps = ${steps as unknown as string[]},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function saveTypeStep(userId: string, entityType: EntityType): Promise<void> {
  await ensureProfileStub(userId);
  const existing = await getProfileByUserId(userId);
  const steps = mergeSteps(existing?.completedSteps ?? [], "type");
  const db = getDb();
  await db`
    UPDATE business_profile SET
      entity_type = ${entityType},
      completed_steps = ${steps as unknown as string[]},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function saveScaleStep(userId: string, patch: ScalePatch): Promise<void> {
  await ensureProfileStub(userId);
  const existing = await getProfileByUserId(userId);
  const steps = mergeSteps(existing?.completedSteps ?? [], "scale");
  const db = getDb();
  await db`
    UPDATE business_profile SET
      nigerian_users = ${patch.nigerianUsers},
      processes_personal_data = ${patch.processesPersonalData},
      handles_payments = ${patch.handlesPayments},
      custodies_digital_assets = ${patch.custodiesDigitalAssets},
      sends_telco_traffic = ${patch.sendsTelcoTraffic},
      completed_steps = ${steps as unknown as string[]},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function saveLicensesStep(userId: string, patch: LicensesPatch): Promise<void> {
  await ensureProfileStub(userId);
  const existing = await getProfileByUserId(userId);
  const steps = mergeSteps(existing?.completedSteps ?? [], "licenses");
  const db = getDb();
  await db`
    UPDATE business_profile SET
      licensed_by_cbn = ${patch.licensedByCbn},
      licensed_by_ncc = ${patch.licensedByNcc},
      registered_with_sec = ${patch.registeredWithSec},
      has_dpo = ${patch.hasDpo},
      completed_steps = ${steps as unknown as string[]},
      completed_at = COALESCE(completed_at, NOW()),
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function saveFullProfile(
  userId: string,
  profile: BusinessProfile,
): Promise<void> {
  await ensureProfileStub(userId, profile.name);
  const db = getDb();
  await db`
    UPDATE business_profile SET
      name = ${profile.name},
      entity_type = ${profile.entityType},
      nigerian_users = ${profile.userCountNG},
      processes_personal_data = ${profile.processesPersonalData},
      handles_payments = ${profile.handlesPayments},
      custodies_digital_assets = ${profile.offersDigitalAssets},
      licensed_by_cbn = ${profile.isLicensedByCBN},
      licensed_by_ncc = ${profile.isLicensedByNCC},
      registered_with_sec = ${profile.isLicensedBySEC},
      updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export function nextIncompleteStep(row: ProfileRow | null): OnboardingStep | null {
  if (!row) return "basics";
  for (const s of ONBOARDING_STEPS) {
    if (!row.completedSteps.includes(s)) return s;
  }
  return null;
}

export function isOnboardingComplete(row: ProfileRow | null): boolean {
  if (!row) return false;
  if (row.completedAt) return true;
  return ONBOARDING_STEPS.every((s) => row.completedSteps.includes(s));
}

export function rowToBusinessProfile(row: ProfileRow): BusinessProfile {
  return {
    name: row.name || "My business",
    entityType: row.entityType ?? "fintech",
    processesPersonalData: row.processesPersonalData,
    userCountNG: row.nigerianUsers,
    handlesPayments: row.handlesPayments,
    offersDigitalAssets: row.custodiesDigitalAssets,
    isLicensedByCBN: row.licensedByCbn,
    isLicensedByNCC: row.licensedByNcc,
    isLicensedBySEC: row.registeredWithSec,
  };
}

export async function getCompletedObligationCodes(userId: string): Promise<Set<string>> {
  const db = getDb();
  const rows = await db`
    SELECT obligation_code FROM obligation_completion WHERE user_id = ${userId}
  `;
  return new Set(rows.map((r: Record<string, unknown>) => r.obligation_code as string));
}

export async function toggleObligationCompletion(
  userId: string,
  obligationCode: string,
  completed: boolean,
): Promise<void> {
  const db = getDb();
  if (completed) {
    await db`
      INSERT INTO obligation_completion (user_id, obligation_code)
      VALUES (${userId}, ${obligationCode})
      ON CONFLICT (user_id, obligation_code) DO NOTHING
    `;
  } else {
    await db`
      DELETE FROM obligation_completion WHERE user_id = ${userId} AND obligation_code = ${obligationCode}
    `;
  }
}
