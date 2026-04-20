import { NextResponse } from "next/server";
import { loadFrameworks } from "@/lib/rules/load";
import { computeObligations, complianceScore } from "@/lib/rules/engine";
import { getCompletedCodes, getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const [profile, frameworks, completed] = await Promise.all([
    getProfile(),
    loadFrameworks(),
    getCompletedCodes(),
  ]);
  const obligations = computeObligations(profile, frameworks, {
    completedCodes: completed,
  });
  return NextResponse.json({
    profile,
    score: complianceScore(obligations),
    total: obligations.length,
    obligations,
  });
}
