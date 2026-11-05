import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const dashboard = pgSchema("dashboard");

export const users = dashboard.table("users", {
  userId: text("user_id").primaryKey(),
  username: text("username").notNull(),
  globalName: text("global_name"),
  avatar: text("avatar"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guildAdmins = dashboard.table(
  "guild_admins",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    addedBy: text("added_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.userId] }),
    check("guild_admins_role_check", sql`${table.role} IN ('admin', 'viewer')`),
  ],
);

export const auditLog = dashboard.table("audit_log", {
  id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
  guildId: text("guild_id").notNull(),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id"),
  details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const botGuilds = dashboard.table("bot_guilds", {
  guildId: text("guild_id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  ownerId: text("owner_id").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  installedAt: timestamp("installed_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  removedAt: timestamp("removed_at", { withTimezone: true }),
});

export const rateLimitBuckets = dashboard.table(
  "rate_limit_buckets",
  {
    bucketHash: text("bucket_hash").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.bucketHash, table.windowStart] }),
    index("rate_limit_buckets_expires_idx").on(table.expiresAt),
  ],
);

export const dashboardUsers = users;
export const dashboardGuildAdmins = guildAdmins;
export const dashboardAuditLog = auditLog;
