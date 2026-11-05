import { and, eq, isNull } from "drizzle-orm";

import { getDb, type DashboardDb } from "./db/client.server.ts";
import { botGuilds, guildAdmins } from "./db/schema.ts";

export type GuildRole = "owner" | "admin" | "viewer";
export type GuildAccess = { guildId: string; role: GuildRole };

export async function getGuildAccess(
  userId: string,
  guildId: string,
  db: DashboardDb = getDb(),
): Promise<GuildAccess | null> {
  const [guild] = await db
    .select({ ownerId: botGuilds.ownerId })
    .from(botGuilds)
    .where(and(eq(botGuilds.guildId, guildId), isNull(botGuilds.removedAt)))
    .limit(1);
  if (!guild) return null;
  if (guild.ownerId === userId) return { guildId, role: "owner" };
  const [admin] = await db
    .select({ role: guildAdmins.role })
    .from(guildAdmins)
    .where(and(eq(guildAdmins.guildId, guildId), eq(guildAdmins.userId, userId)))
    .limit(1);
  if (admin?.role === "admin" || admin?.role === "viewer") return { guildId, role: admin.role };
  return null;
}

export async function requireGuildAccess(
  userId: string,
  guildId: string,
  db?: DashboardDb,
): Promise<GuildAccess> {
  const access = await getGuildAccess(userId, guildId, db);
  if (!access) throw new Response("Not found", { status: 404 });
  return access;
}

export function requireOwner(access: GuildAccess): void {
  if (access.role !== "owner") throw new Response("Not found", { status: 404 });
}
