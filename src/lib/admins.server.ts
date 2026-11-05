import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, type DashboardDb } from "./db/client.server.ts";
import { botGuilds } from "./db/schema.ts";
import type { GuildAccess } from "./access.server.ts";
import { requireOwner } from "./access.server.ts";
import { consumeRateLimit } from "./rate-limit.server.ts";

const snowflake = z.string().regex(/^\d{17,20}$/, "Enter a valid Discord User ID (17–20 digits).");
const roleSchema = z.enum(["admin", "viewer"]);
const addSchema = z.object({ guildId: snowflake, userId: snowflake, role: roleSchema });
const roleChangeSchema = z.object({ guildId: snowflake, userId: snowflake, role: roleSchema });
const removeSchema = z.object({
  guildId: snowflake,
  userId: snowflake,
  confirmation: z.string().min(1),
});

type AdminDependencies = { rateLimit?: typeof consumeRateLimit };
type MutationStatus = { owner_ok: boolean; changed: boolean };

async function requireActiveOwner(
  actorId: string,
  guildId: string,
  access: GuildAccess,
  db: DashboardDb,
) {
  requireOwner(access);
  const [guild] = await db
    .select({ ownerId: botGuilds.ownerId })
    .from(botGuilds)
    .where(sql`${botGuilds.guildId} = ${guildId} AND ${botGuilds.removedAt} IS NULL`)
    .limit(1);
  if (!guild || guild.ownerId !== actorId) throw new Response("Not found", { status: 404 });
  return guild;
}

async function mutationLimit(
  actorId: string,
  guildId: string,
  dependencies: AdminDependencies,
): Promise<void> {
  const result = await (dependencies.rateLimit ?? consumeRateLimit)(
    `admin-mutation:${guildId}:${actorId}`,
    30,
    60_000,
  );
  if (!result.allowed) {
    throw new Response("Too many changes. Try again shortly.", {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds), "Cache-Control": "no-store" },
    });
  }
}

function assertMutationResult(status: MutationStatus | undefined, duplicateMessage: string): void {
  if (!status?.owner_ok) throw new Response("Not found", { status: 404 });
  if (!status.changed) throw new Response(duplicateMessage, { status: 409 });
}

export async function addAdmin(
  input: unknown,
  actorId: string,
  access: GuildAccess,
  db: DashboardDb = getDb(),
  dependencies: AdminDependencies = {},
) {
  const value = addSchema.parse(input);
  const owner = await requireActiveOwner(actorId, value.guildId, access, db);
  if (value.userId === owner.ownerId)
    throw new Response("The server owner is already an owner.", { status: 409 });
  await mutationLimit(actorId, value.guildId, dependencies);
  const result = await db.execute(sql`
    WITH owner_check AS (
      SELECT owner_id FROM dashboard.bot_guilds
      WHERE guild_id = ${value.guildId} AND owner_id = ${actorId} AND removed_at IS NULL
      FOR UPDATE
    ), added AS (
      INSERT INTO dashboard.guild_admins (guild_id, user_id, role, added_by)
      SELECT ${value.guildId}, ${value.userId}, ${value.role}, ${actorId} FROM owner_check
      ON CONFLICT (guild_id, user_id) DO NOTHING
      RETURNING user_id
    ), logged AS (
      INSERT INTO dashboard.audit_log (guild_id, actor_id, action, target_id, details)
      SELECT ${value.guildId}, ${actorId}, 'add_admin', user_id, ${JSON.stringify({ role: value.role })}::jsonb
      FROM added RETURNING id
    )
    SELECT EXISTS (SELECT 1 FROM owner_check) AS owner_ok,
           EXISTS (SELECT 1 FROM added) AS changed
  `);
  assertMutationResult(
    result.rows[0] as MutationStatus | undefined,
    "This person is already on the admin list.",
  );
  return { ok: true };
}

export async function changeAdminRole(
  input: unknown,
  actorId: string,
  access: GuildAccess,
  db: DashboardDb = getDb(),
  dependencies: AdminDependencies = {},
) {
  const value = roleChangeSchema.parse(input);
  const owner = await requireActiveOwner(actorId, value.guildId, access, db);
  if (owner.ownerId === value.userId)
    throw new Response("The server owner is locked.", { status: 409 });
  await mutationLimit(actorId, value.guildId, dependencies);
  const result = await db.execute(sql`
    WITH owner_check AS (
      SELECT owner_id FROM dashboard.bot_guilds
      WHERE guild_id = ${value.guildId} AND owner_id = ${actorId} AND removed_at IS NULL
      FOR UPDATE
    ), changed_role AS (
      UPDATE dashboard.guild_admins AS entry SET role = ${value.role}
      FROM owner_check
      WHERE entry.guild_id = ${value.guildId} AND entry.user_id = ${value.userId}
      RETURNING entry.user_id
    ), logged AS (
      INSERT INTO dashboard.audit_log (guild_id, actor_id, action, target_id, details)
      SELECT ${value.guildId}, ${actorId}, 'change_role', user_id, ${JSON.stringify({ role: value.role })}::jsonb
      FROM changed_role RETURNING id
    )
    SELECT EXISTS (SELECT 1 FROM owner_check) AS owner_ok,
           EXISTS (SELECT 1 FROM changed_role) AS changed
  `);
  assertMutationResult(result.rows[0] as MutationStatus | undefined, "Admin not found.");
  return { ok: true };
}

export async function removeAdmin(
  input: unknown,
  actorId: string,
  access: GuildAccess,
  db: DashboardDb = getDb(),
  dependencies: AdminDependencies = {},
) {
  const value = removeSchema.parse(input);
  const owner = await requireActiveOwner(actorId, value.guildId, access, db);
  if (owner.ownerId === value.userId)
    throw new Response("The server owner cannot be removed.", { status: 409 });
  if (value.confirmation !== value.userId)
    throw new Response("Type the exact User ID to confirm removal.", { status: 400 });
  await mutationLimit(actorId, value.guildId, dependencies);
  const result = await db.execute(sql`
    WITH owner_check AS (
      SELECT owner_id FROM dashboard.bot_guilds
      WHERE guild_id = ${value.guildId} AND owner_id = ${actorId} AND removed_at IS NULL
      FOR UPDATE
    ), removed AS (
      DELETE FROM dashboard.guild_admins AS entry
      USING owner_check
      WHERE entry.guild_id = ${value.guildId} AND entry.user_id = ${value.userId}
      RETURNING entry.user_id
    ), logged AS (
      INSERT INTO dashboard.audit_log (guild_id, actor_id, action, target_id, details)
      SELECT ${value.guildId}, ${actorId}, 'remove_admin', user_id, '{}'::jsonb
      FROM removed RETURNING id
    )
    SELECT EXISTS (SELECT 1 FROM owner_check) AS owner_ok,
           EXISTS (SELECT 1 FROM removed) AS changed
  `);
  assertMutationResult(result.rows[0] as MutationStatus | undefined, "Admin not found.");
  return { ok: true };
}
