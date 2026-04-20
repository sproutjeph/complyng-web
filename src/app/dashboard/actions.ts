"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/profile";
import { toggleObligationCompletion } from "@/lib/db/profile";

export async function markObligation(formData: FormData) {
  const userId = await requireUserId();
  const code = String(formData.get("code") ?? "").trim();
  const completed = formData.get("completed") === "true";
  if (!code) throw new Error("Missing obligation code");
  await toggleObligationCompletion(userId, code, completed);
  revalidatePath("/dashboard");
}
