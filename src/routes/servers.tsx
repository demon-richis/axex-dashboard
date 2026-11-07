import { useMemo, useState } from "react";
import { LoadingSkeleton } from "../components/loading-skeleton";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { isGuildOnline, relativeAge } from "../lib/dashboard-view.ts";
import "../components/dashboard.css";
import "../components/pages.css";
import "../components/picker.css";
import "../components/dashboard-ux.css";

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
  const [query, setQuery] = useState("");
  const filteredServers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return servers;
    return servers.filter((server) => server.name.toLocaleLowerCase().includes(normalized));
  }, [query, servers]);
  const onlineCount = servers.filter((server) => isGuildOnline(server.lastSeenAt)).length;

  function remember(guildId: string) {
    document.cookie = `axex_last_server=${guildId}; Max-Age=2592000; Path=/; Secure; SameSite=Lax`;
  }

  async function signOut() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
      credentials: "same-origin",
    });
    window.location.assign("/");
  }

  return (
    <main className="picker-page">
      <header className="picker-header">
        <a className="brand" href="/servers" aria-label="Axex Dashboard home">
          <span className="brand-mark">AX</span>
          <span className="wordmark">
            AXEX <span className="brand-divider">/</span> DASHBOARD
          </span>
        </a>
        <div className="picker-account">
          <span className="picker-user">{user.globalName ?? user.username}</span>
          <button className="picker-signout" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <div className="picker-content">
        <div className="picker-intro">
          <div>
            <p className="eyebrow">
              SERVER ACCESS <span className="title-divider">/</span> AXEX
            </p>
            <h1>Your servers</h1>
            <p className="muted">Choose a community to open its dashboard.</p>
          </div>
          {servers.length > 0 && (
            <div
              className="picker-live-summary"
              aria-label={`${servers.length} accessible servers, ${onlineCount} connected`}
            >
              <span className="picker-summary-value">{servers.length}</span>
              <span>accessible</span>
              <span className="picker-summary-divider" aria-hidden="true" />
              <span className="status-dot" aria-hidden="true" />
              <span>{onlineCount} connected</span>
            </div>
          )}
        </div>

        {lastServer && servers.length > 1 && (
          <a
            className="continue-server card"
            href={`/servers/${lastServer.guildId}`}
            onClick={() => remember(lastServer.guildId)}
          >
            <ServerIcon server={lastServer} />
            <span className="continue-copy">
              <span className="eyebrow">CONTINUE WHERE YOU LEFT OFF</span>
              <strong>{lastServer.name}</strong>
            </span>
            <span className="continue-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        )}

        {servers.length === 0 ? (
          <section className="card empty-state picker-empty">
            <span className="brand-mark" aria-hidden="true">
              AX
            </span>
            <h2>No servers to show yet</h2>
            <p>
              We list servers you own or where an owner has added your Discord User ID to the Axex
              dashboard. Add Axex to a server, or ask its owner to grant your User ID access, then
              refresh this page.
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
                Refresh server list
              </button>
            </div>
          </section>
        ) : (
          <>
            <div className="picker-controls">
              <label className="picker-search">
                <span className="picker-search-icon" aria-hidden="true">
                  <SearchIcon />
                </span>
                <span className="sr-only">Search accessible servers</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your servers"
                  autoComplete="off"
                />
                {query && (
                  <button className="picker-clear" type="button" onClick={() => setQuery("")}>
                    Clear
                  </button>
                )}
              </label>
              <span className="picker-results" aria-live="polite">
                {filteredServers.length} of {servers.length} servers
              </span>
            </div>
            {filteredServers.length > 0 ? (
              <div className="server-grid">
                {filteredServers.map((server) => {
                  const online = isGuildOnline(server.lastSeenAt);
                  return (
                    <a
                      key={server.guildId}
                      className="card server-card server-card-enhanced"
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
                        <i aria-hidden="true" />
                        <span>{online ? "Connected" : "Offline"}</span>
                        <span className="server-last-seen">· {relativeAge(server.lastSeenAt)}</span>
                      </span>
                      <span className="server-open" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  );
                })}
              </div>
            ) : (
              <section className="card empty-state picker-no-match" role="status">
                <span className="picker-no-match-icon" aria-hidden="true">
                  <SearchIcon />
                </span>
                <h2>No servers match “{query.trim()}”</h2>
                <p>Try another name or clear the search to see all accessible servers.</p>
                <button className="button button-secondary" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </section>
            )}
          </>
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}
