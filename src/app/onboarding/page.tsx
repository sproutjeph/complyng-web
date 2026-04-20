import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/profile";
import {
  ensureProfileStub,
  isOnboardingComplete,
  nextIncompleteStep,
} from "@/lib/db/profile";

export const dynamic = "force-dynamic";

export default async function OnboardingIndex() {
  const userId = await requireUserId();
  const row = await ensureProfileStub(userId);
  if (isOnboardingComplete(row)) redirect("/dashboard");
  redirect(`/onboarding/${nextIncompleteStep(row) ?? "basics"}`);
}
