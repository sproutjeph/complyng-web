#!/usr/bin/env bun
import postgres from "postgres";
import { EMBEDDING_DIM } from "../src/lib/llm/config";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local.");
  process.exit(1);
}

const db = postgres(url);

async function main() {
  console.log("Enabling pgvector extension\u2026");
  await db`CREATE EXTENSION IF NOT EXISTS vector`;

  console.log("Creating regulatory_chunks table\u2026");
  await db.unsafe(
    `CREATE TABLE IF NOT EXISTS regulatory_chunks (
      id             BIGSERIAL PRIMARY KEY,
      framework_code TEXT        NOT NULL,
      clause_ref     TEXT        NOT NULL,
      source_url     TEXT        NOT NULL,
      text           TEXT        NOT NULL,
      embedding      vector(${EMBEDDING_DIM}) NOT NULL,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );

  console.log("Creating HNSW index\u2026");
  await db`
    CREATE INDEX IF NOT EXISTS regulatory_chunks_embedding_idx
    ON regulatory_chunks
    USING hnsw (embedding vector_cosine_ops)
  `;

  console.log("Creating framework_code lookup index\u2026");
  await db`
    CREATE INDEX IF NOT EXISTS regulatory_chunks_framework_idx
    ON regulatory_chunks (framework_code)
  `;

  console.log("Creating business_profile table…");
  await db`
    CREATE TABLE IF NOT EXISTS business_profile (
      user_id                  TEXT PRIMARY KEY,
      name                     TEXT NOT NULL,
      website                  TEXT,
      contact_name             TEXT,
      entity_type              TEXT,
      nigerian_users           INTEGER DEFAULT 0,
      processes_personal_data  BOOLEAN NOT NULL DEFAULT FALSE,
      handles_payments         BOOLEAN NOT NULL DEFAULT FALSE,
      custodies_digital_assets BOOLEAN NOT NULL DEFAULT FALSE,
      sends_telco_traffic      BOOLEAN NOT NULL DEFAULT FALSE,
      licensed_by_cbn          BOOLEAN NOT NULL DEFAULT FALSE,
      licensed_by_ncc          BOOLEAN NOT NULL DEFAULT FALSE,
      registered_with_sec      BOOLEAN NOT NULL DEFAULT FALSE,
      has_dpo                  BOOLEAN NOT NULL DEFAULT FALSE,
      completed_steps          TEXT[] NOT NULL DEFAULT '{}',
      completed_at             TIMESTAMPTZ,
      created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("Creating obligation_completion table…");
  await db`
    CREATE TABLE IF NOT EXISTS obligation_completion (
      user_id         TEXT NOT NULL,
      obligation_code TEXT NOT NULL,
      completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, obligation_code)
    )
  `;

  console.log("Creating policy_document table…");
  await db`
    CREATE TABLE IF NOT EXISTS policy_document (
      id           BIGSERIAL PRIMARY KEY,
      user_id      TEXT        NOT NULL,
      filename     TEXT        NOT NULL,
      mime         TEXT,
      sha256       TEXT        NOT NULL,
      text_bytes   INTEGER     NOT NULL,
      chunk_count  INTEGER     NOT NULL DEFAULT 0,
      uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    CREATE INDEX IF NOT EXISTS policy_document_user_idx
    ON policy_document (user_id, uploaded_at DESC)
  `;

  console.log("Creating policy_chunk table…");
  await db.unsafe(
    `CREATE TABLE IF NOT EXISTS policy_chunk (
      id          BIGSERIAL PRIMARY KEY,
      policy_id   BIGINT      NOT NULL REFERENCES policy_document(id) ON DELETE CASCADE,
      section     TEXT,
      content     TEXT        NOT NULL,
      embedding   vector(${EMBEDDING_DIM}) NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  );
  await db`
    CREATE INDEX IF NOT EXISTS policy_chunk_embedding_idx
    ON policy_chunk
    USING hnsw (embedding vector_cosine_ops)
  `;
  await db`
    CREATE INDEX IF NOT EXISTS policy_chunk_policy_idx
    ON policy_chunk (policy_id)
  `;

  console.log("Creating gap_finding table…");
  await db`
    CREATE TABLE IF NOT EXISTS gap_finding (
      id                   BIGSERIAL PRIMARY KEY,
      policy_id            BIGINT      NOT NULL REFERENCES policy_document(id) ON DELETE CASCADE,
      user_id              TEXT        NOT NULL,
      obligation_code      TEXT        NOT NULL,
      gaid_article         TEXT        NOT NULL,
      severity             TEXT        NOT NULL,
      description          TEXT        NOT NULL,
      policy_citation      TEXT,
      regulation_citation  TEXT,
      resolved_at          TIMESTAMPTZ,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    CREATE INDEX IF NOT EXISTS gap_finding_user_idx
    ON gap_finding (user_id, created_at DESC)
  `;
  await db`
    CREATE INDEX IF NOT EXISTS gap_finding_obligation_idx
    ON gap_finding (obligation_code)
  `;

  console.log("Creating evidence table…");
  await db`
    CREATE TABLE IF NOT EXISTS evidence (
      id               BIGSERIAL PRIMARY KEY,
      user_id          TEXT        NOT NULL,
      obligation_code  TEXT        NOT NULL,
      kind             TEXT        NOT NULL,
      filename         TEXT,
      storage_path     TEXT,
      mime             TEXT,
      sha256           TEXT,
      url              TEXT,
      note             TEXT,
      uploaded_by      TEXT        NOT NULL,
      uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await db`
    CREATE INDEX IF NOT EXISTS evidence_obligation_idx
    ON evidence (user_id, obligation_code, uploaded_at DESC)
  `;

  console.log("Creating trust_center table…");
  await db`
    CREATE TABLE IF NOT EXISTS trust_center (
      user_id           TEXT        PRIMARY KEY,
      slug              TEXT        UNIQUE NOT NULL,
      is_public         BOOLEAN     NOT NULL DEFAULT FALSE,
      published_at      TIMESTAMPTZ,
      attestation_hash  TEXT,
      attestation_json  JSONB,
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const [{ count }] = await db`SELECT COUNT(*)::int AS count FROM regulatory_chunks`;
  const [{ profiles }] = await db`SELECT COUNT(*)::int AS profiles FROM business_profile`;
  const [{ policies }] = await db`SELECT COUNT(*)::int AS policies FROM policy_document`;
  const [{ gaps }] = await db`SELECT COUNT(*)::int AS gaps FROM gap_finding`;
  const [{ ev }] = await db`SELECT COUNT(*)::int AS ev FROM evidence`;
  console.log(
    `Ready. regulatory_chunks=${count}, business_profile=${profiles}, policy_document=${policies}, gap_finding=${gaps}, evidence=${ev}.`,
  );
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exitCode = 1;
  })
  .finally(() => db.end());
