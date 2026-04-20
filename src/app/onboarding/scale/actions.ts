"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveScaleStep } from "@/lib/db/profile";

const ScaleSchema = z.object({
  nigerianUsers: z.coerce.number().int().nonnegative().default(0),
  processesPersonalData: z.boolean(),
  handlesPayments: z.boolean(),
  custodiesDigitalAssets: z.boolean(),
  sendsTelcoTraffic: z.boolean(),
});

export async function submitScale(formData: FormData) {
  const userId = await requireUserId();
  const parsed = ScaleSchema.safeParse({
    nigerianUsers: formData.get("nigerianUsers") ?? 0,
    processesPersonalData: formData.get("processesPersonalData") === "on",
    handlesPayments: formData.get("handlesPayments") === "on",
    custodiesDigitalAssets: formData.get("custodiesDigitalAssets") === "on",
    sendsTelcoTraffic: formData.get("sendsTelcoTraffic") === "on",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  await saveScaleStep(userId, parsed.data);
  redirect("/onboarding/licenses");
}
