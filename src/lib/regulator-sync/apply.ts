import "server-only";
import { getDb } from "@/lib/db/client";
import { ingestFramework } from "@/lib/ingest/ingest-framework";
import { analyseGaps } from "@/lib/policy/gap-analysis";

const GAID = "NDPC-GAID";

interface AffectedPolicy {
  policyId: number;
  userId: string;
}

async function findAffectedPolicies(frameworkCode: string): Promise<AffectedPolicy[]> {
  if (frameworkCode !== GAID) return [];
  const db = getDb();
  const rows = await db`
    SELECT DISTINCT policy_id, user_id
    FROM gap_finding
    ORDER BY policy_id
  `;
  return rows.map((r: Record<string, unknown>) => ({
    policyId: Number(r.policy_id),
    userId: r.user_id as string,
  }));
}

export interface ApplyResult {
  reingestChunkCount: number;
  affectedPolicyCount: number;
  reanalysisErrors: Array<{ policyId: number; userId: string; error: string }>;
}

export async function applyRegulatorChange(
  frameworkCode: string,
): Promise<ApplyResult> {
  const ingestResult = await ingestFramework(frameworkCode);

  const affected = await findAffectedPolicies(frameworkCode);
  const errors: ApplyResult["reanalysisErrors"] = [];
  for (const policy of affected) {
    try {
      await analyseGaps({ userId: policy.userId, policyId: policy.policyId });
    } catch (e) {
      errors.push({
        policyId: policy.policyId,
        userId: policy.userId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    reingestChunkCount: ingestResult.chunkCount,
    affectedPolicyCount: affected.length - errors.length,
    reanalysisErrors: errors,
  };
}
