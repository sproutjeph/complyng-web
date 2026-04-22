import { EMBEDDING_DIM, EMBEDDING_MODEL, requireEnv } from "./config";

interface GeminiEmbedResponse {
  embedding?: { values: number[] };
  embeddings?: { values: number[] }[];
  error?: { message: string };
}

const MAX_EMBED_ATTEMPTS = 6;

export async function embed(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {
  const key = requireEnv("GOOGLE_API_KEY");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${key}`;
  const body = JSON.stringify({
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: EMBEDDING_DIM,
  });

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_EMBED_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data: GeminiEmbedResponse = await res.json();
    if (res.ok) {
      const values = data.embedding?.values ?? data.embeddings?.[0]?.values;
      if (!values || values.length !== EMBEDDING_DIM) {
        throw new Error(
          `Unexpected embedding shape: got ${values?.length}, expected ${EMBEDDING_DIM}`,
        );
      }
      return values;
    }
    lastError = new Error(
      `Gemini embed failed: ${res.status} ${data.error?.message ?? JSON.stringify(data)}`,
    );
    const retryable = res.status === 429 || res.status === 503 || res.status === 500;
    if (!retryable || attempt === MAX_EMBED_ATTEMPTS) throw lastError;
    const backoffMs = Math.min(30_000, 1000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 500);
    console.warn(
      `[embed] ${res.status} on attempt ${attempt}/${MAX_EMBED_ATTEMPTS}; retrying in ${backoffMs}ms`,
    );
    await new Promise((r) => setTimeout(r, backoffMs));
  }
  throw lastError ?? new Error("Gemini embed: retries exhausted");
}

export async function embedBatch(texts: readonly string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) {
    out.push(await embed(t, "RETRIEVAL_DOCUMENT"));
  }
  return out;
}
