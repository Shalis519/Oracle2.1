import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

/**
 * Creates small runtime support tables that are not part of the deployment shell
 * workflow. Every statement is idempotent and safe to run on every API start.
 */
export async function ensureRuntimeSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chat_read_state (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      last_read_message_id INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS chat_read_state_user_id_idx
    ON chat_read_state (user_id)
  `);
  await db.execute(sql`
    ALTER TABLE ontology_entity_profiles
      ADD COLUMN IF NOT EXISTS plants JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS crystals JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS jewelry JSONB NOT NULL DEFAULT '[]'::jsonb
  `);
}
