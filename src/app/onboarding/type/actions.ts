"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveTypeStep } from "@/lib/db/profile";
import { entityTypes } from "@/lib/rules/types";

const TypeSchema = z.object({ entityType: z.enum(entityTypes) });

export async function submitType(formData: FormData) {
  const userId = await requireUserId();
  const parsed = TypeSchema.safeParse({
    entityType: String(formData.get("entityType") ?? ""),
  });
  if (!parsed.success) throw new Error("Please choose an entity type.");
  await saveTypeStep(userId, parsed.data.entityType);
  redirect("/onboarding/scale");
}
