import { and, eq, isNull, or } from "drizzle-orm";

import { getDb, type DashboardDb } from "./db/client.server.ts";
import { botGuilds, guildAdmins, userGuilds } from "./db/schema.ts";

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
      discordOwner: userGuilds.owner,
      adminRole: guildAdmins.role,
    })
    .from(botGuilds)
    .leftJoin(
      userGuilds,
      and(eq(userGuilds.guildId, guildId), eq(userGuilds.userId, userId)),
    )
    .leftJoin(
      guildAdmins,
      and(eq(guildAdmins.guildId, guildId), eq(guildAdmins.userId, userId)),
    )
    .where(
      and(
        eq(botGuilds.guildId, guildId),
        isNull(botGuilds.removedAt),
        or(
          eq(botGuilds.ownerId, userId),
          eq(userGuilds.userId, userId),
          eq(guildAdmins.userId, userId),
        ),
      ),
    )
    .limit(1);

  if (!guild) return null;
  if (guild.ownerId === userId || guild.discordOwner === 1) return { guildId, role: "owner" };
  if (guild.adminRole === "admin" || guild.adminRole === "viewer")
    return { guildId, role: guild.adminRole };
  if (guild.discordOwner === 0) return { guildId, role: "admin" };
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
