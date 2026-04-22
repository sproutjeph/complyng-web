import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANSWER_MODEL, requireEnv, TOP_K } from "@/lib/llm/config";
import { embed } from "@/lib/llm/embedder";
import { getDb, vectorLiteral } from "@/lib/db/client";
import { loadFrameworks } from "@/lib/rules/load";
import {
  deleteGapFindingsForPolicy,
  insertGapFinding,
  retrievePolicyChunks,
} from "@/lib/db/policy";
import type { Obligation } from "@/lib/rules/types";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

const GAID_FRAMEWORK_CODE = "NDPC-GAID";

interface RegChunk {
  clauseRef: string;
  sourceUrl: string;
  text: string;
}

interface GapJudgement {
  meets: boolean;
  severity: "high" | "medium" | "low";
  description: string;
  policy_citation: string | null;
  regulation_citation: string | null;
}

const SYSTEM_PROMPT = `You are ComplyNG's compliance audit engine. You compare a Nigerian organisation's privacy policy against a specific article of NDPC's General Application and Implementation Directive (GAID 2025).

Return ONLY a JSON object matching this schema — no prose, no code fences:
{
  "meets": boolean,            // true if the policy demonstrably meets the obligation
  "severity": "high"|"medium"|"low",  // risk of the gap, ignored when meets=true; "high" reserved for filings/breach/DPO/registration failures
  "description": string,       // one paragraph, concrete and actionable, max 60 words
  "policy_citation": string|null,      // short verbatim quote from the policy showing the relevant section, null if nothing relevant
  "regulation_citation": string|null   // short verbatim quote from the GAID article provided
}

Rules:
- If the policy is silent on the obligation, meets=false.
- If the policy addresses it partially, meets=false and explain what is missing.
- Only set meets=true when the policy unambiguously covers the specific obligation.
- Citations must be verbatim from the provided excerpts. Do not invent text.`;

async function retrieveGaidChunksByVec(queryVec: number[], k = TOP_K): Promise<RegChunk[]> {
  const db = getDb();
  const vec = vectorLiteral(queryVec);
  const rows = await db`
    SELECT clause_ref, source_url, text
    FROM regulatory_chunks
    WHERE framework_code = ${GAID_FRAMEWORK_CODE}
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${k}
  `;
  return rows.map((r: Record<string, unknown>) => ({
    clauseRef: r.clause_ref as string,
    sourceUrl: r.source_url as string,
    text: r.text as string,
  }));
}

function extractJson(text: string): GapJudgement {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Claude did not return JSON: ${trimmed.slice(0, 200)}`);
  }
  const raw = trimmed.slice(start, end + 1);
  const parsed = JSON.parse(raw) as Partial<GapJudgement>;
  if (typeof parsed.meets !== "boolean") throw new Error("Missing meets");
  const severity = parsed.severity === "high" || parsed.severity === "medium" || parsed.severity === "low"
    ? parsed.severity
    : "medium";
  return {
    meets: parsed.meets,
    severity,
    description: String(parsed.description ?? "").slice(0, 1000),
    policy_citation: parsed.policy_citation ? String(parsed.policy_citation).slice(0, 500) : null,
    regulation_citation: parsed.regulation_citation ? String(parsed.regulation_citation).slice(0, 500) : null,
  };
}

async function judgeObligation(
  obligation: Obligation,
  policyExcerpts: Array<{ section: string; content: string }>,
  regExcerpts: RegChunk[],
): Promise<GapJudgement> {
  const policyBlock = policyExcerpts.length === 0
    ? "(no matching policy excerpts returned)"
    : policyExcerpts
        .map((c, i) => `[P${i + 1}] ${c.section}\n${c.content}`)
        .join("\n\n---\n\n");

  const regBlock = regExcerpts.length === 0
    ? `(summary) ${obligation.description}`
    : regExcerpts
        .map((c, i) => `[R${i + 1}] ${c.clauseRef}\n${c.text}`)
        .join("\n\n---\n\n");

  const user = `GAID OBLIGATION under audit:
code=${obligation.code}
title=${obligation.title}
clause=${obligation.clauseRef}
summary=${obligation.description}

REGULATION EXCERPTS (source of truth for regulation_citation):
${regBlock}

POLICY EXCERPTS (source of truth for policy_citation):
${policyBlock}

Return the JSON judgement.`;

  const resp = await getClient().messages.create({
    model: ANSWER_MODEL,
    max_tokens: 600,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: user }],
  });

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  return extractJson(text);
}

export async function analyseGaps(opts: {
  userId: string;
  policyId: number;
}): Promise<{ findings: number; considered: number }> {
  const { userId, policyId } = opts;
  const frameworks = await loadFrameworks();
  const gaid = frameworks.find((f) => f.code === GAID_FRAMEWORK_CODE);
  if (!gaid) throw new Error("GAID framework not loaded. Run bun scripts/migrate.ts && bun scripts/ingest.ts first.");

  await deleteGapFindingsForPolicy(policyId, userId);

  const results = await Promise.all(
    gaid.obligations.map(async (obligation) => {
      const queryVec = await embed(
        `${obligation.title}. ${obligation.description}`,
        "RETRIEVAL_QUERY",
      );
      const [policyChunks, regChunks] = await Promise.all([
        retrievePolicyChunks(policyId, queryVec, TOP_K),
        retrieveGaidChunksByVec(queryVec, TOP_K),
      ]);

      const judgement = await judgeObligation(obligation, policyChunks, regChunks);
      if (judgement.meets) return false;

      await insertGapFinding({
        policyId,
        userId,
        obligationCode: obligation.code,
        gaidArticle: obligation.clauseRef,
        severity: judgement.severity,
        description: judgement.description,
        policyCitation: judgement.policy_citation,
        regulationCitation: judgement.regulation_citation,
      });
      return true;
    }),
  );

  const findings = results.filter(Boolean).length;
  return { findings, considered: gaid.obligations.length };
}
