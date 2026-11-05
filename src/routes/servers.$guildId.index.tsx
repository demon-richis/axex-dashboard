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
      { getGuildDetails, getVerificationStats },
    ] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("../lib/current-user.server.ts"),
      import("../lib/access.server.ts"),
      import("../lib/guilds.server.ts"),
    ]);
    const user = await requireUser(getRequest());
    await requireGuildAccess(user.userId, data.guildId);
    const guild = await getGuildDetails(data.guildId);
    if (!guild) throw new Response("Not found", { status: 404 });
    const stats = await getVerificationStats(data.guildId);
    return {
      guild: {
        guildId: guild.guildId,
        name: guild.name,
        icon: guild.icon,
        memberCount: guild.memberCount,
        lastSeenAt: guild.lastSeenAt,
      },
      stats,
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
  const { guild, stats } = Route.useLoaderData();
  return <Overview guild={guild} stats={stats} />;
}
