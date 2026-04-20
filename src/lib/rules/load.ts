import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { FrameworkSchema, type Framework } from "./types";

const FRAMEWORKS_DIR = path.join(process.cwd(), "content", "frameworks");

export async function loadFrameworks(): Promise<Framework[]> {
  const entries = await readdir(FRAMEWORKS_DIR);
  const files = entries.filter((f) => f.endsWith(".json"));
  const parsed = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(FRAMEWORKS_DIR, file), "utf8");
      const json = JSON.parse(raw);
      const result = FrameworkSchema.safeParse(json);
      if (!result.success) {
        throw new Error(
          `Invalid framework ${file}: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
      return result.data;
    }),
  );
  return parsed.sort((a, b) => a.code.localeCompare(b.code));
}
