import { LoadingSkeleton } from "../components/loading-skeleton";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import "../components/dashboard.css";
import "../components/pages.css";
import "../components/picker.css";

const loadServers = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getRequest }, { requireUser }, { listAccessibleGuilds }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("../lib/current-user.server.ts"),
    import("../lib/guilds.server.ts"),
  ]);
  const request = getRequest();
  const user = await requireUser(request);
  const servers = await listAccessibleGuilds(user.userId);
  const lastCookie = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)axex_last_server=(\d{17,20})/)?.[1];
  const lastServer = servers.find((server) => server.guildId === lastCookie) ?? null;
  return {
    user,
    servers,
    lastServer,
    inviteUrl: process.env["BOT_INVITE_URL"] ?? "https://discord.com/oauth2/authorize",
  };
});

export const Route = createFileRoute("/servers")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingSkeleton variant="picker" />,
  loader: async () => {
    const data = await loadServers();
    if (data.servers.length === 1) throw redirect({ href: `/servers/${data.servers[0]!.guildId}` });
    return data;
  },
  head: () => ({ meta: [{ title: "Your servers · Axex Dashboard" }] }),
  component: ServerPicker,
});

function ServerPicker() {
  const { user, servers, lastServer, inviteUrl } = Route.useLoaderData();
  function remember(guildId: string) {
    document.cookie = `axex_last_server=${guildId}; Max-Age=2592000; Path=/; Secure; SameSite=Lax`;
  }
  return (
    <main className="picker-page">
      <header className="picker-header">
        <a className="brand" href="/servers">
          <span className="brand-mark">AX</span>
          <span className="wordmark">
            AXEX <span className="brand-divider">/</span> DASHBOARD
          </span>
        </a>
        <span className="picker-user">{user.globalName ?? user.username}</span>
      </header>
      <div className="picker-content">
        <p className="eyebrow">SERVER ACCESS</p>
        <h1>Your servers</h1>
        <p className="muted">Choose a community to open its dashboard.</p>
        {lastServer && servers.length > 1 && (
          <a
            className="continue-server card"
            href={`/servers/${lastServer.guildId}`}
            onClick={() => remember(lastServer.guildId)}
          >
            Continue to <strong>{lastServer.name}</strong>
            <span>↗</span>
          </a>
        )}
        {servers.length === 0 ? (
          <section className="card empty-state picker-empty">
            <span className="brand-mark" aria-hidden="true">
              AX
            </span>
            <h2>Axex isn’t in a server yet</h2>
            <p>
              Once Axex is added to a Discord server, it will show up here. Ask a server owner to
              add Axex, then refresh this page.
            </p>
            <div className="action-row">
              <a
                className="button button-primary"
                href={inviteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Add Axex to your server <span aria-hidden="true">↗</span>
              </a>
              <button className="button button-secondary" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          </section>
        ) : (
          <div className="server-grid">
            {servers.map((server) => {
              const online = Date.now() - new Date(server.lastSeenAt).getTime() <= 10 * 60_000;
              return (
                <a
                  key={server.guildId}
                  className="card server-card"
                  href={`/servers/${server.guildId}`}
                  onClick={() => remember(server.guildId)}
                >
                  <ServerIcon server={server} />
                  <div className="server-card-info">
                    <strong>{server.name}</strong>
                    <span>{server.memberCount.toLocaleString()} members</span>
                  </div>
                  <span className={`role-badge role-${server.role}`}>{server.role}</span>
                  <span className={`server-health ${online ? "online" : "offline"}`}>
                    <i /> {online ? "Connected" : "Offline"}
                  </span>
                  <span className="server-open" aria-hidden="true">
                    ↗
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function ServerIcon({
  server,
}: {
  server: { guildId: string; icon: string | null; name: string };
}) {
  return server.icon ? (
    <img
      className="server-avatar server-picker-avatar"
      src={`https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=128`}
      alt=""
    />
  ) : (
    <span className="server-avatar server-picker-avatar server-avatar-fallback" aria-hidden="true">
      {server.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
