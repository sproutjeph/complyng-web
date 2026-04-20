import "server-only";
import type postgres from "postgres";
import { getDb } from "./client";

export interface TrustCenterRow {
  userId: string;
  slug: string;
  isPublic: boolean;
  publishedAt: string | null;
  attestationHash: string | null;
  attestation: Record<string, unknown> | null;
  updatedAt: string;
}

function rowToTrust(r: Record<string, unknown>): TrustCenterRow {
  return {
    userId: r.user_id as string,
    slug: r.slug as string,
    isPublic: Boolean(r.is_public),
    publishedAt: r.published_at ? (r.published_at as Date).toISOString() : null,
    attestationHash: (r.attestation_hash as string | null) ?? null,
    attestation: (r.attestation_json as Record<string, unknown> | null) ?? null,
    updatedAt: (r.updated_at as Date).toISOString(),
  };
}

export async function getTrustCenterByUser(
  userId: string,
): Promise<TrustCenterRow | null> {
  const db = getDb();
  const rows = await db`SELECT * FROM trust_center WHERE user_id = ${userId} LIMIT 1`;
  if (rows.length === 0) return null;
  return rowToTrust(rows[0]);
}

export async function getTrustCenterBySlug(
  slug: string,
): Promise<TrustCenterRow | null> {
  const db = getDb();
  const rows = await db`
    SELECT * FROM trust_center WHERE slug = ${slug} AND is_public = TRUE LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToTrust(rows[0]);
}

export async function isSlugAvailable(
  slug: string,
  excludeUserId: string,
): Promise<boolean> {
  const db = getDb();
  const rows = await db`
    SELECT user_id FROM trust_center WHERE slug = ${slug} AND user_id <> ${excludeUserId}
  `;
  return rows.length === 0;
}

export async function upsertTrustCenter(input: {
  userId: string;
  slug: string;
  isPublic: boolean;
  attestationHash: string | null;
  attestation: Record<string, unknown> | null;
}): Promise<TrustCenterRow> {
  const db = getDb();
  const published = input.isPublic ? new Date() : null;
  const rows = await db`
    INSERT INTO trust_center (user_id, slug, is_public, published_at, attestation_hash, attestation_json, updated_at)
    VALUES (${input.userId}, ${input.slug}, ${input.isPublic}, ${published},
            ${input.attestationHash}, ${db.json(input.attestation as postgres.JSONValue)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      slug              = EXCLUDED.slug,
      is_public         = EXCLUDED.is_public,
      published_at      = CASE WHEN EXCLUDED.is_public THEN COALESCE(trust_center.published_at, NOW()) ELSE trust_center.published_at END,
      attestation_hash  = EXCLUDED.attestation_hash,
      attestation_json  = EXCLUDED.attestation_json,
      updated_at        = NOW()
    RETURNING *
  `;
  return rowToTrust(rows[0]);
}

export async function setTrustCenterPublic(
  userId: string,
  isPublic: boolean,
): Promise<TrustCenterRow | null> {
  const db = getDb();
  const published = isPublic ? new Date() : null;
  const rows = await db`
    UPDATE trust_center
    SET is_public    = ${isPublic},
        published_at = CASE WHEN ${isPublic} THEN COALESCE(published_at, ${published}) ELSE published_at END,
        updated_at   = NOW()
    WHERE user_id = ${userId}
    RETURNING *
  `;
  if (rows.length === 0) return null;
  return rowToTrust(rows[0]);
}
