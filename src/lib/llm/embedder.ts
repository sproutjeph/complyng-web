import { EMBEDDING_DIM, EMBEDDING_MODEL, requireEnv } from "./config";

interface GeminiEmbedResponse {
  embedding?: { values: number[] };
  embeddings?: { values: number[] }[];
  error?: { message: string };
}

export async function embed(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {
  const key = requireEnv("GOOGLE_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBEDDING_DIM,
    }),
  });
  const data: GeminiEmbedResponse = await res.json();
  if (!res.ok) {
    throw new Error(
      `Gemini embed failed: ${res.status} ${data.error?.message ?? JSON.stringify(data)}`,
    );
  }
  const values = data.embedding?.values ?? data.embeddings?.[0]?.values;
  if (!values || values.length !== EMBEDDING_DIM) {
    throw new Error(
      `Unexpected embedding shape: got ${values?.length}, expected ${EMBEDDING_DIM}`,
    );
  }
  return values;
}

export async function embedBatch(texts: readonly string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) {
    out.push(await embed(t, "RETRIEVAL_DOCUMENT"));
  }
  return out;
}
