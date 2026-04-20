"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveLicensesStep } from "@/lib/db/profile";

const LicensesSchema = z.object({
  licensedByCbn: z.boolean(),
  licensedByNcc: z.boolean(),
  registeredWithSec: z.boolean(),
  hasDpo: z.boolean(),
});

export async function submitLicenses(formData: FormData) {
  const userId = await requireUserId();
  const parsed = LicensesSchema.safeParse({
    licensedByCbn: formData.get("licensedByCbn") === "on",
    licensedByNcc: formData.get("licensedByNcc") === "on",
    registeredWithSec: formData.get("registeredWithSec") === "on",
    hasDpo: formData.get("hasDpo") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  await saveLicensesStep(userId, parsed.data);
  redirect("/dashboard");
}
