import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { BusinessProfile } from "./rules/types";
import {
  getCompletedObligationCodes,
  getProfileByUserId,
  isOnboardingComplete,
  nextIncompleteStep,
  rowToBusinessProfile,
} from "./db/profile";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return userId;
}

export async function getProfile(): Promise<BusinessProfile> {
  const userId = await requireUserId();
  const row = await getProfileByUserId(userId);
  if (!isOnboardingComplete(row)) {
    const step = nextIncompleteStep(row) ?? "basics";
    redirect(`/onboarding/${step}`);
  }
  return rowToBusinessProfile(row!);
}

export async function getCompletedCodes(): Promise<Set<string>> {
  const userId = await requireUserId();
  return getCompletedObligationCodes(userId);
}
