import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema.ts";

let schemaReady: Promise<void> | null = null;

export async function ensureDashboardSchema(): Promise<void> {
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("DATABASE_URL is required to initialize dashboard data");

    const query = neon(url);
    await query`CREATE SCHEMA IF NOT EXISTS dashboard`;
    await query`CREATE SCHEMA IF NOT EXISTS dashboard_meta`;
    await query`CREATE TABLE IF NOT EXISTS dashboard.users (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      global_name TEXT,
      avatar TEXT,
      last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await query`CREATE TABLE IF NOT EXISTS dashboard.user_guilds (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      owner INTEGER NOT NULL DEFAULT 0,
      permissions TEXT NOT NULL DEFAULT '0',
      refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, guild_id)
    )`;
    await query`CREATE INDEX IF NOT EXISTS user_guilds_user_refreshed_idx
      ON dashboard.user_guilds (user_id, refreshed_at DESC)`;
    await query`CREATE TABLE IF NOT EXISTS dashboard.guild_admins (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
      added_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (guild_id, user_id)
    )`;
    await query`CREATE TABLE IF NOT EXISTS dashboard.audit_log (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      guild_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_id TEXT,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await query`CREATE INDEX IF NOT EXISTS dashboard_audit_log_guild_created_idx
      ON dashboard.audit_log (guild_id, created_at DESC)`;
    await query`CREATE TABLE IF NOT EXISTS dashboard.bot_guilds (
      guild_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      owner_id TEXT NOT NULL,
      member_count INTEGER NOT NULL DEFAULT 0,
      installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      removed_at TIMESTAMPTZ
    )`;
    await query`CREATE TABLE IF NOT EXISTS dashboard.rate_limit_buckets (
      bucket_hash TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      expires_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (bucket_hash, window_start)
    )`;
    await query`CREATE INDEX IF NOT EXISTS dashboard_rate_limit_buckets_expires_idx
      ON dashboard.rate_limit_buckets (expires_at)`;
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}

export function getDb() {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required to access dashboard data");
  return drizzle(neon(url), { schema });
}

export type DashboardDb = ReturnType<typeof getDb>;
