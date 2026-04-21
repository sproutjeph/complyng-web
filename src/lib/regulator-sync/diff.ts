import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ANSWER_MODEL, requireEnv } from "@/lib/llm/config";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

const EXCERPT_CHARS = 6_000;

function excerpt(text: string): string {
  if (text.length <= EXCERPT_CHARS) return text;
  const head = text.slice(0, EXCERPT_CHARS * 0.7);
  const tail = text.slice(-EXCERPT_CHARS * 0.3);
  return `${head}\n\n…[truncated]…\n\n${tail}`;
}

const SYSTEM_PROMPT = `You are ComplyNG's regulatory change analyst. You compare two versions of the same Nigerian regulatory document and produce a short changelog for a compliance officer.

Return plain markdown — no preamble, no code fences. Use:
- A one-line headline (bold) stating the nature of the change (e.g. **New breach-notification deadline added**).
- Up to 5 bullet points, each starting with the clause reference if identifiable, followed by a one-sentence summary of what changed and why it matters for policy compliance.
- If the substantive content is unchanged (e.g. only whitespace/formatting differs), state that plainly in one sentence and stop.

Never invent clauses. If you cannot identify a specific change, say so.`;

export async function summarizeDiff(params: {
  frameworkCode: string;
  previous: string | null;
  current: string;
}): Promise<string> {
  const { frameworkCode, previous, current } = params;

  if (!previous) {
    return `**Baseline captured for ${frameworkCode}.** First snapshot recorded; future runs will diff against this version.`;
  }

  const user = `Framework: ${frameworkCode}

PREVIOUS VERSION:
${excerpt(previous)}

CURRENT VERSION:
${excerpt(current)}

Summarize what changed between PREVIOUS and CURRENT.`;

  const resp = await getClient().messages.create({
    model: ANSWER_MODEL,
    max_tokens: 700,
    system: [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: user }],
  });

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();

  if (!text) {
    return `**${frameworkCode} updated.** Content hash changed; no structured summary available.`;
  }
  return text;
}
