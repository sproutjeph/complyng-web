"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import { saveTypeStep } from "@/lib/db/profile";
import { entityTypes } from "@/lib/rules/types";

export type TypeState = { error: string | null };

const TypeSchema = z.object({ entityType: z.enum(entityTypes) });

export async function submitType(
  _prev: TypeState,
  formData: FormData,
): Promise<TypeState> {
  const userId = await requireUserId();
  const parsed = TypeSchema.safeParse({
    entityType: String(formData.get("entityType") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please choose an entity type." };
  }
  try {
    await saveTypeStep(userId, parsed.data.entityType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't save. Try again." };
  }
  redirect("/onboarding/scale");
}
