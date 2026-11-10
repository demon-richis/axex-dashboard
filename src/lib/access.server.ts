import { notFound } from "@tanstack/react-router";
import { and, eq, isNull, or } from "drizzle-orm";

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
    .select({
      ownerId: botGuilds.ownerId,
      adminRole: guildAdmins.role,
    })
    .from(botGuilds)
    .leftJoin(guildAdmins, and(eq(guildAdmins.guildId, guildId), eq(guildAdmins.userId, userId)))
    .where(
      and(
        eq(botGuilds.guildId, guildId),
        isNull(botGuilds.removedAt),
        or(eq(botGuilds.ownerId, userId), eq(guildAdmins.userId, userId)),
      ),
    )
    .limit(1);

  if (!guild) return null;
  if (guild.ownerId === userId) {
    return { guildId, role: "owner" };
  }
  if (guild.adminRole === "admin" || guild.adminRole === "viewer") {
    return { guildId, role: guild.adminRole };
  }
  return null;
}

export async function requireGuildAccess(
  userId: string,
  guildId: string,
  db?: DashboardDb,
): Promise<GuildAccess> {
  const access = await getGuildAccess(userId, guildId, db);
  if (!access) throw notFound();
  return access;
}

export function requireOwner(access: GuildAccess): void {
  if (access.role !== "owner") throw new Response("Not found", { status: 404 });
}
