import { useMemo, useState } from "react";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { LoadingSkeleton } from "../components/loading-skeleton";
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
  loader: () => loadServers(),
  head: () => ({ meta: [{ title: "Your servers · Axex Dashboard" }] }),
  errorComponent: ServerPickerError,
  component: ServersRouteView,
});

function ServersRouteView() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const normalizedPath = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return normalizedPath === "/servers" ? <ServerPicker /> : <Outlet />;
}

function ServerPicker() {
  const { user, servers, lastServer, inviteUrl } = Route.useLoaderData();
  const [query, setQuery] = useState("");

  const filteredServers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return servers;
    return servers.filter((server) => server.name.toLocaleLowerCase().includes(normalized));
  }, [query, servers]);

  const onlineCount = servers.filter((server) => isGuildOnline(server.lastSeenAt)).length;

  function remember(guildId: string): void {
    document.cookie = `axex_last_server=${guildId}; Max-Age=2592000; Path=/; Secure; SameSite=Lax`;
  }

  async function signOut(): Promise<void> {
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
          <a className="picker-reconnect" href="/api/auth/discord?consent=1">
            Reconnect Discord
          </a>
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
            <p className="muted">
              Choose a server to manage, or add Axex where it is not installed yet.
            </p>
          </div>

          {servers.length > 0 && (
            <div
              className="picker-live-summary"
              aria-label={`${servers.length} connected servers, ${onlineCount} online`}
            >
              <span className="picker-summary-value">{servers.length}</span>
              <span>connected</span>
              <span className="picker-summary-divider" aria-hidden="true" />
              <span className="status-dot" aria-hidden="true" />
              <span>{onlineCount} online</span>
            </div>
          )}
        </div>

        {servers.length > 0 && (
          <div className="picker-controls">
            <label className="picker-search">
              <span className="picker-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <span className="sr-only">Search servers</span>
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
            <span className="picker-results">{filteredServers.length} servers</span>
          </div>
        )}

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

        {filteredServers.length > 0 && (
          <section className="picker-group">
            <div className="picker-group-head">
              <div>
                <span className="eyebrow">CONNECTED</span>
                <h2>Manage your servers</h2>
              </div>
              <span>{filteredServers.length}</span>
            </div>

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
          </section>
        )}

        {servers.length === 0 && (
          <section className="card empty-state picker-empty">
            <span className="brand-mark" aria-hidden="true">
              AX
            </span>
            <h2>No connected servers available</h2>
            <p>
              The dashboard only lists servers where Axex is installed and you are the server owner
              or an owner-registered dashboard admin. Discord server permissions are not requested
              for sign-in. Install Axex in a server you own, or ask its owner to add your dashboard
              account as an admin.
            </p>
            <div className="action-row">
              <a
                className="button button-primary"
                href={inviteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Add Axex to a server ↗
              </a>
              <button className="button button-secondary" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ServerPickerError() {
  return (
    <main className="picker-page">
      <section className="card empty-state picker-empty">
        <span className="brand-mark" aria-hidden="true">
          AX
        </span>
        <h1>We could not load your servers</h1>
        <p>
          The dashboard could not read your server list. Reconnect Discord to refresh access, or
          retry the request.
        </p>
        <div className="action-row">
          <a className="button button-primary" href="/api/auth/discord?consent=1">
            Reconnect Discord ↗
          </a>
          <button className="button button-secondary" onClick={() => window.location.reload()}>
            Try again
          </button>
          <a className="button button-secondary" href="/">
            Go home
          </a>
        </div>
      </section>
    </main>
  );
}

function ServerIcon({
  server,
}: {
  server: { guildId: string; icon: string | null; name: string };
}) {
  if (server.icon) {
    return (
      <img
        className="server-avatar server-picker-avatar"
        src={`https://cdn.discordapp.com/icons/${server.guildId}/${server.icon}.png?size=128`}
        alt=""
      />
    );
  }

  return (
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
