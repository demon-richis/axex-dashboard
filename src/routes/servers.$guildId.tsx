import { LoadingSkeleton } from "../components/loading-skeleton";
import { createFileRoute, notFound, Outlet, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DashboardShell, type ShellGuild } from "../components/dashboard-shell";
import "../components/pages.css";
import "../components/dashboard-ux.css";

const guildParams = z.object({ guildId: z.string().regex(/^\d{17,20}$/) });
const loadGuildShell = createServerFn({ method: "GET" })
  .validator(guildParams)
  .handler(async ({ data }) => {
    const [
      { getRequest },
      { requireUser },
      { requireGuildAccess },
      { getGuildDetails, listAccessibleGuilds },
    ] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("../lib/current-user.server.ts"),
      import("../lib/access.server.ts"),
      import("../lib/guilds.server.ts"),
    ]);
    const request = getRequest();
    const user = await requireUser(request);
    const access = await requireGuildAccess(user.userId, data.guildId);
    const guild = await getGuildDetails(data.guildId);
    if (!guild) throw notFound();
    const servers = await listAccessibleGuilds(user.userId);
    const shellGuild: ShellGuild = {
      guildId: guild.guildId,
      name: guild.name,
      icon: guild.icon,
      memberCount: guild.memberCount,
      lastSeenAt: guild.lastSeenAt,
      role: access.role,
    };
    return { user, guild: shellGuild, servers };
  });

export const Route = createFileRoute("/servers/$guildId")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingSkeleton variant="guild" />,
  loader: ({ params }) => loadGuildShell({ data: params }),
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.guild.name ?? "Server"} · Axex Dashboard` }],
  }),
  component: GuildLayout,
});

function GuildLayout() {
  const data = Route.useLoaderData();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const section = pathname.endsWith("/admins")
    ? "admins"
    : pathname.endsWith("/audit")
      ? "audit"
      : "overview";
  return (
    <DashboardShell data={data} section={section}>
      <Outlet />
    </DashboardShell>
  );
}
