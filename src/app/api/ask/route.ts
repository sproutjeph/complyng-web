import { NextResponse } from "next/server";
import { z } from "zod";
import { ask } from "@/lib/llm/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  question: z.string().min(3).max(2000),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const result = await ask(parsed.data.question);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ask failed";
    const publicMsg = msg.startsWith("Missing required environment variable")
      ? `Server not configured: ${msg}. See DEMO.md.`
      : "Something went wrong. Check server logs.";
    console.error("[ask]", e);
    return NextResponse.json({ error: publicMsg }, { status: 500 });
  }
}
