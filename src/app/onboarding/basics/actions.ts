"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveBasicsStep } from "@/lib/db/profile";

export type BasicsState = { error: string | null };

const BasicsSchema = z.object({
  name: z.string().min(1, "Business name is required").max(200),
  website: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  contactName: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export async function submitBasics(
  _prev: BasicsState,
  formData: FormData,
): Promise<BasicsState> {
  const userId = await requireUserId();
  const parsed = BasicsSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    website: String(formData.get("website") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  try {
    await saveBasicsStep(userId, parsed.data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save. Try again." };
  }
  redirect("/onboarding/type");
}
