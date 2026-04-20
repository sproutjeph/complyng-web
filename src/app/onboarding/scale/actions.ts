"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveScaleStep } from "@/lib/db/profile";

export type ScaleState = { error: string | null };

const ScaleSchema = z.object({
  nigerianUsers: z.coerce.number().int().nonnegative().default(0),
  processesPersonalData: z.boolean(),
  handlesPayments: z.boolean(),
  custodiesDigitalAssets: z.boolean(),
  sendsTelcoTraffic: z.boolean(),
});

export async function submitScale(
  _prev: ScaleState,
  formData: FormData,
): Promise<ScaleState> {
  const userId = await requireUserId();
  const parsed = ScaleSchema.safeParse({
    nigerianUsers: formData.get("nigerianUsers") ?? 0,
    processesPersonalData: formData.get("processesPersonalData") === "on",
    handlesPayments: formData.get("handlesPayments") === "on",
    custodiesDigitalAssets: formData.get("custodiesDigitalAssets") === "on",
    sendsTelcoTraffic: formData.get("sendsTelcoTraffic") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  try {
    await saveScaleStep(userId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save. Try again." };
  }
  redirect("/onboarding/licenses");
}
