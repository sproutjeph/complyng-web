import Anthropic from "@anthropic-ai/sdk";
import { ANSWER_MODEL, requireEnv } from "./config";
import type { RetrievedChunk } from "./retriever";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  return client;
}

const SYSTEM_PROMPT = `You are ComplyNG, a regulatory compliance assistant for Nigerian digital and ICT businesses.

You answer questions about obligations under:
- NITDA Code of Practice for Interactive Computer Service Platforms
- NDPA 2023 and GAID 2025 (Nigeria Data Protection Commission)
- CBN Risk-Based Cybersecurity Framework and AML/CFT regulations
- NCC Consumer Code and Quality of Service regulations
- SEC Rules on Digital Assets 2022

RULES:
1. Answer ONLY using the provided CONTEXT passages. If the context does not contain the answer, say "The ingested regulations don't cover this — please consult counsel." Do NOT guess.
2. Every factual claim must cite the framework code and clause reference that supports it, inline, e.g. "(NDPA 2023 s.40)".
3. Be concise (<= 6 short paragraphs or a bulleted list).
4. Do NOT give legal advice. State that the user should verify with qualified Nigerian counsel.
5. If multiple frameworks address the same issue, contrast them briefly.`;

export interface Answer {
  text: string;
  usedChunkIndices: number[];
}

export async function answer(
  question: string,
  chunks: readonly RetrievedChunk[],
): Promise<Answer> {
  const context = chunks
    .map(
      (c, i) =>
        `[${i + 1}] FRAMEWORK=${c.frameworkCode} CLAUSE=${c.clauseRef}\n${c.text}`,
    )
    .join("\n\n---\n\n");

  const userMessage = `CONTEXT:\n${context}\n\nQUESTION: ${question}\n\nAnswer using only the context. Cite clauses inline.`;

  const resp = await getClient().messages.create({
    model: ANSWER_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");

  const usedChunkIndices = chunks
    .map((_, i) => (text.includes(chunks[i].clauseRef) ? i : -1))
    .filter((i) => i >= 0);

  return { text, usedChunkIndices };
}
