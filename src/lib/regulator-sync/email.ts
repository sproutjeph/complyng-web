import "server-only";
import { clerkClient } from "@clerk/nextjs/server";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_FROM = "ComplyNG Alerts <alerts@complyng.dev>";

interface SendAlertInput {
  userId: string;
  frameworkCode: string;
  summaryMarkdown: string;
  dashboardUrl: string;
}

async function resolveEmail(userId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    const primary = user.emailAddresses.find((e) => e.id === primaryId)
      ?? user.emailAddresses[0];
    return primary?.emailAddress ?? null;
  } catch (e) {
    console.warn(`[regulator-sync] could not resolve email for ${userId}:`, e);
    return null;
  }
}

function renderHtml(args: SendAlertInput, escapedSummary: string): string {
  return `<!doctype html>
<html><body style="font-family:ui-sans-serif,system-ui;max-width:560px;margin:0 auto;padding:24px;color:#0a0a0a">
  <h1 style="font-size:18px;margin:0 0 12px">Regulation update detected</h1>
  <p style="margin:0 0 8px;color:#52525b;font-size:14px">
    ComplyNG detected a change in <strong>${args.frameworkCode}</strong> and has re-run gap analysis against your uploaded policies.
  </p>
  <div style="margin:16px 0;padding:12px 16px;border-left:3px solid #f59e0b;background:#fffbeb;color:#78350f;font-size:14px;white-space:pre-wrap;line-height:1.5">${escapedSummary}</div>
  <p style="margin:16px 0 0">
    <a href="${args.dashboardUrl}" style="display:inline-block;padding:10px 16px;background:#0a0a0a;color:#fafafa;text-decoration:none;border-radius:6px;font-size:14px">
      Review changes on dashboard
    </a>
  </p>
  <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px">
    You received this because your policies have been analysed on ComplyNG. This is an automated alert — not legal advice.
  </p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendChangeAlert(input: SendAlertInput): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY;
  const email = await resolveEmail(input.userId);
  if (!email) {
    console.log(`[regulator-sync] no email for user ${input.userId}; skipping alert`);
    return "skipped";
  }
  if (!apiKey) {
    console.log(
      `[regulator-sync] RESEND_API_KEY unset; would have emailed ${email} about ${input.frameworkCode}`,
    );
    return "skipped";
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
        to: [email],
        subject: `${input.frameworkCode} updated — action required`,
        html: renderHtml(input, escapeHtml(input.summaryMarkdown)),
        text: `${input.frameworkCode} updated.\n\n${input.summaryMarkdown}\n\nReview: ${input.dashboardUrl}`,
      }),
    });
    if (!res.ok) {
      console.warn(
        `[regulator-sync] Resend returned ${res.status} for ${email}: ${await res.text()}`,
      );
      return "failed";
    }
    return "sent";
  } catch (e) {
    console.warn(`[regulator-sync] Resend fetch threw for ${email}:`, e);
    return "failed";
  }
}
