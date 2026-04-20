"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveBasicsStep } from "@/lib/db/profile";

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

export async function submitBasics(formData: FormData) {
  const userId = await requireUserId();
  const parsed = BasicsSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    website: String(formData.get("website") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(", "));
  }
  await saveBasicsStep(userId, parsed.data);
  redirect("/onboarding/type");
}
