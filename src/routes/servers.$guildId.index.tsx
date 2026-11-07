import { LoadingSkeleton } from "../components/loading-skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Overview } from "../components/overview";

const guildParams = z.object({ guildId: z.string().regex(/^\d{17,20}$/) });
const loadOverview = createServerFn({ method: "GET" })
  .validator(guildParams)
  .handler(async ({ data }) => {
    const [
      { getRequest },
      { requireUser },
      { requireGuildAccess },
      { getGuildDetails, getVerificationStats, getVerificationTrend },
      { listAudit },
    ] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("../lib/current-user.server.ts"),
      import("../lib/access.server.ts"),
      import("../lib/guilds.server.ts"),
      import("../lib/audit.server.ts"),
    ]);
    const user = await requireUser(getRequest());
    const access = await requireGuildAccess(user.userId, data.guildId);
    const guild = await getGuildDetails(data.guildId);
    if (!guild) throw new Response("Not found", { status: 404 });
    const [stats, trend, activityRows] = await Promise.all([
      getVerificationStats(data.guildId),
      getVerificationTrend(data.guildId),
      listAudit({ guildId: data.guildId, page: 1, pageSize: 5 }),
    ]);
    return {
      guild: {
        guildId: guild.guildId,
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
        lastSeenAt: guild.lastSeenAt,
        role: access.role,
      },
      stats,
      trend,
      activity: activityRows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        actorName: row.actorGlobalName ?? row.actorUsername,
        actorAvatar: row.actorAvatar,
        action: row.action,
        targetId: row.targetId,
        details: JSON.stringify(row.details ?? {}),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  });

export const Route = createFileRoute("/servers/$guildId/")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingSkeleton variant="guild" />,
  loader: ({ params }) => loadOverview({ data: params }),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.guild.name ?? "Overview"} · Axex Dashboard` }],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { guild, stats, trend, activity } = Route.useLoaderData();
  return <Overview guild={guild} stats={stats} trend={trend} activity={activity} />;
}
