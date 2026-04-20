"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  BusinessProfileSchema,
  type BusinessProfile,
  type EntityType,
} from "@/lib/rules/types";
import { requireUserId } from "@/lib/profile";
import { saveFullProfile } from "@/lib/db/profile";

export async function saveProfile(formData: FormData) {
  const userId = await requireUserId();

  const raw: BusinessProfile = {
    name: String(formData.get("name") ?? "").trim() || "My business",
    entityType: String(formData.get("entityType") ?? "fintech") as EntityType,
    processesPersonalData: formData.get("processesPersonalData") === "on",
    userCountNG: Number(formData.get("userCountNG") ?? 0) || 0,
    handlesPayments: formData.get("handlesPayments") === "on",
    offersDigitalAssets: formData.get("offersDigitalAssets") === "on",
    isLicensedByCBN: formData.get("isLicensedByCBN") === "on",
    isLicensedByNCC: formData.get("isLicensedByNCC") === "on",
    isLicensedBySEC: formData.get("isLicensedBySEC") === "on",
  };

  const parsed = BusinessProfileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  await saveFullProfile(userId, parsed.data);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
