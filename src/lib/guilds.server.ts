import { and, desc, eq, isNull, or } from "drizzle-orm";

import { getDb, type DashboardDb } from "./db/client.server.ts";
import { botGuilds, guildAdmins, users } from "./db/schema.ts";

export async function listAccessibleGuilds(userId: string, db: DashboardDb = getDb()) {
  const guilds = await db
    .select({
      guildId: botGuilds.guildId,
      name: botGuilds.name,
      icon: botGuilds.icon,
      ownerId: botGuilds.ownerId,
      memberCount: botGuilds.memberCount,
      lastSeenAt: botGuilds.lastSeenAt,
      role: guildAdmins.role,
    })
    .from(botGuilds)
    .leftJoin(
      guildAdmins,
      and(eq(guildAdmins.guildId, botGuilds.guildId), eq(guildAdmins.userId, userId)),
    )
    .where(
      and(
        isNull(botGuilds.removedAt),
        or(eq(botGuilds.ownerId, userId), eq(guildAdmins.userId, userId)),
      ),
    )
    .orderBy(desc(botGuilds.lastSeenAt));

  return guilds.map(({ ownerId, role, ...guild }) => ({
    ...guild,
    role:
      ownerId === userId
        ? ("owner" as const)
        : ((role as "admin" | "viewer" | null) ?? ("admin" as const)),
  }));
}

export async function getGuildDetails(guildId: string, db: DashboardDb = getDb()) {
  const [guild] = await db
    .select()
    .from(botGuilds)
    .where(and(eq(botGuilds.guildId, guildId), isNull(botGuilds.removedAt)))
    .limit(1);
  return guild ?? null;
}

export async function listGuildAdmins(guildId: string, db: DashboardDb = getDb()) {
  return db
    .select({
      userId: guildAdmins.userId,
      role: guildAdmins.role,
      addedBy: guildAdmins.addedBy,
      createdAt: guildAdmins.createdAt,
      username: users.username,
      globalName: users.globalName,
      avatar: users.avatar,
    })
    .from(guildAdmins)
    .leftJoin(users, eq(users.userId, guildAdmins.userId))
    .where(eq(guildAdmins.guildId, guildId))
    .orderBy(guildAdmins.createdAt);
}

export async function getVerificationStats(
  guildId: string,
): Promise<Record<string, number> | null> {
  const url = process.env["DATABASE_URL"];
  if (!url) return null;

  try {
    const { neon } = await import("@neondatabase/serverless");
    const query = neon(url);
    const rows = await query`
      SELECT status, COUNT(*)::int AS count
      FROM public.verification_cases
      WHERE guild_id = ${guildId} AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY status
    `;
    const stats: Record<string, number> = {
      success: 0,
      failed: 0,
      quarantined: 0,
      expired: 0,
      in_progress: 0,
    };

    for (const row of rows) {
      const status = String(row["status"]);
      const normalized = status === "verified" || status === "success" ? "success" : status;
      if (normalized in stats) stats[normalized] = Number(row["count"]);
    }

    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/verification_cases|relation.*does not exist/i.test(message)) {
      console.error(
        "[dashboard] Verification stats unavailable:",
        error instanceof Error ? error.name : "unknown",
      );
    }
    return null;
  }
}

export type VerificationTrendPoint = {
  day: string;
  label: string;
  success: number;
  failed: number;
  quarantined: number;
  expired: number;
  in_progress: number;
};

export async function getVerificationTrend(
  guildId: string,
): Promise<VerificationTrendPoint[] | null> {
  const url = process.env["DATABASE_URL"];
  if (!url) return null;

  try {
    const { neon } = await import("@neondatabase/serverless");
    const query = neon(url);
    const rows = await query`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
        status,
        COUNT(*)::int AS count
      FROM public.verification_cases
      WHERE guild_id = ${guildId}
        AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY day, status
      ORDER BY day
    `;

    const points: VerificationTrendPoint[] = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (6 - index));
      return {
        day: date.toISOString().slice(0, 10),
        label: new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(date),
        success: 0,
        failed: 0,
        quarantined: 0,
        expired: 0,
        in_progress: 0,
      };
    });
    const byDay = new Map(points.map((point) => [point.day, point]));

    for (const row of rows) {
      const dayValue = row["day"];
      const day = dayValue instanceof Date ? dayValue.toISOString().slice(0, 10) : String(dayValue);
      const point = byDay.get(day);
      if (!point) continue;
      const status = String(row["status"]);
      const normalized = status === "verified" || status === "success" ? "success" : status;
      if (normalized in point) {
        point[normalized as keyof Omit<VerificationTrendPoint, "day" | "label">] = Number(
          row["count"],
        );
      }
    }

    return points;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/verification_cases|relation.*does not exist/i.test(message)) {
      console.error(
        "[dashboard] Verification trend unavailable:",
        error instanceof Error ? error.name : "unknown",
      );
    }
    return null;
  }
}
