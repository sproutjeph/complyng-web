import { Webhook } from "svix";
import { headers } from "next/headers";
import { ensureProfileStub } from "@/lib/db/profile";

export const dynamic = "force-dynamic";

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email_addresses?: { email_address: string }[];
  };
}

type ClerkEvent =
  | ClerkUserCreatedEvent
  | { type: string; data: Record<string, unknown> };

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("CLERK_WEBHOOK_SECRET not set", { status: 500 });
  }

  const hdr = await headers();
  const svixId = hdr.get("svix-id");
  const svixTimestamp = hdr.get("svix-timestamp");
  const svixSignature = hdr.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing Svix headers", { status: 400 });
  }

  const payload = await req.text();
  let event: ClerkEvent;
  try {
    event = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch (err) {
    console.error("Clerk webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, first_name, last_name } =
      (event as ClerkUserCreatedEvent).data;
    const fallbackName =
      [first_name, last_name].filter(Boolean).join(" ").trim() || "My business";
    await ensureProfileStub(id, fallbackName);
  }

  return new Response(null, { status: 204 });
}
