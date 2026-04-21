import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_FROM = "ComplyNG Alerts <alerts@complyng.dev>";
const SUPPORT_INBOX = "team@complyng.ng";

const BodySchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  workEmail: z.string().trim().email().max(320),
  companyName: z.string().trim().min(1).max(200),
  message: z.string().trim().max(2000).optional(),
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderHtml(input: {
  fullName: string;
  workEmail: string;
  companyName: string;
  message?: string;
  userId: string;
  clerkEmail: string | null;
}): string {
  const message = input.message
    ? `<div style="margin:16px 0;padding:12px 16px;border-left:3px solid #0a0a0a;background:#fafafa;color:#0a0a0a;font-size:14px;white-space:pre-wrap;line-height:1.5">${escapeHtml(input.message)}</div>`
    : `<p style="margin:16px 0 0;color:#a1a1aa;font-size:13px;font-style:italic">No additional message.</p>`;
  return `<!doctype html>
<html><body style="font-family:ui-sans-serif,system-ui;max-width:560px;margin:0 auto;padding:24px;color:#0a0a0a">
  <h1 style="font-size:18px;margin:0 0 12px">New Comply Agent setup request</h1>
  <p style="margin:0 0 8px;color:#52525b;font-size:14px">A dashboard user asked to be contacted about Comply Agent onboarding.</p>
  <table style="border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr><td style="padding:4px 12px 4px 0;color:#71717a">Name</td><td style="padding:4px 0">${escapeHtml(input.fullName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#71717a">Work email</td><td style="padding:4px 0">${escapeHtml(input.workEmail)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#71717a">Company</td><td style="padding:4px 0">${escapeHtml(input.companyName)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#71717a">Clerk user</td><td style="padding:4px 0;font-family:ui-monospace,monospace;font-size:12px">${escapeHtml(input.userId)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#71717a">Clerk email</td><td style="padding:4px 0">${escapeHtml(input.clerkEmail ?? "unknown")}</td></tr>
  </table>
  ${message}
</body></html>`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let clerkEmail: string | null = null;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?? user.emailAddresses[0];
    clerkEmail = primary?.emailAddress ?? null;
  } catch (e) {
    console.warn(`[comply-agent] could not resolve clerk email for ${userId}:`, e);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[comply-agent] RESEND_API_KEY unset; would have emailed ${SUPPORT_INBOX} about request from ${parsed.data.workEmail} (${parsed.data.companyName})`,
    );
    return NextResponse.json({ status: "queued" });
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? DEFAULT_FROM,
        to: [SUPPORT_INBOX],
        reply_to: parsed.data.workEmail,
        subject: `Comply Agent setup request — ${parsed.data.companyName}`,
        html: renderHtml({ ...parsed.data, userId, clerkEmail }),
      }),
    });
    if (!res.ok) {
      console.warn(`[comply-agent] Resend returned ${res.status}: ${await res.text()}`);
      return NextResponse.json({ error: "Could not deliver request" }, { status: 502 });
    }
    return NextResponse.json({ status: "queued" });
  } catch (e) {
    console.warn("[comply-agent] Resend fetch threw:", e);
    return NextResponse.json({ error: "Could not deliver request" }, { status: 502 });
  }
}
