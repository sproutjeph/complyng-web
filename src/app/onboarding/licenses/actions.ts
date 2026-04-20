"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveLicensesStep } from "@/lib/db/profile";

export type LicensesState = { error: string | null };

const LicensesSchema = z.object({
  licensedByCbn: z.boolean(),
  licensedByNcc: z.boolean(),
  registeredWithSec: z.boolean(),
  hasDpo: z.boolean(),
});

export async function submitLicenses(
  _prev: LicensesState,
  formData: FormData,
): Promise<LicensesState> {
  const userId = await requireUserId();
  const parsed = LicensesSchema.safeParse({
    licensedByCbn: formData.get("licensedByCbn") === "on",
    licensedByNcc: formData.get("licensedByNcc") === "on",
    registeredWithSec: formData.get("registeredWithSec") === "on",
    hasDpo: formData.get("hasDpo") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  try {
    await saveLicensesStep(userId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save. Try again." };
  }
  redirect("/dashboard");
}
