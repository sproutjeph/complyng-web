"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/profile";
import { getPolicyById } from "@/lib/db/policy";
import { analyseGaps } from "@/lib/policy/gap-analysis";

export async function runGapAnalysis(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const policyId = Number(formData.get("policyId"));
  if (!Number.isFinite(policyId)) throw new Error("Missing policyId");

  const policy = await getPolicyById(policyId, userId);
  if (!policy) throw new Error("Policy not found");

  await analyseGaps({ userId, policyId });
  revalidatePath(`/dashboard/policies/${policyId}`);
}
