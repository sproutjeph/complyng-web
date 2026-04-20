import postgres, { type Sql } from "postgres";
import { requireEnv } from "@/lib/llm/config";

let cached: Sql | null = null;

export function getDb(): Sql {
  if (!cached) {
    const url = requireEnv("DATABASE_URL");
    cached = postgres(url, {
      max: process.env.NODE_ENV === "production" ? 10 : 4,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return cached;
}

export function vectorLiteral(v: readonly number[]): string {
  return "[" + v.map((n) => n.toFixed(6)).join(",") + "]";
}
