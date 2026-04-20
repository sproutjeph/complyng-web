export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIM = 768;
export const ANSWER_MODEL = "claude-sonnet-4-5-20250929";
export const TOP_K = 6;
export const CHUNK_SIZE = 1800;
export const CHUNK_OVERLAP = 200;

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}
