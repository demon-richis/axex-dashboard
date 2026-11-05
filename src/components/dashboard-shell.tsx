import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ShellUser = {
  userId: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
};
export type ShellGuild = {
  guildId: string;
  name: string;
  icon: string | null;
  memberCount: number;
  lastSeenAt: Date;
  role: "owner" | "admin" | "viewer";
};
export type ShellData = { user: ShellUser; guild: ShellGuild; servers: ShellGuild[] };
const GuildContext = createContext<ShellData | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export function useGuildShell() {
  const value = useContext(GuildContext);
  if (!value) throw new Error("GuildShell is missing");
  return value;
}

function Avatar({ guild, size = "md" }: { guild: ShellGuild; size?: "sm" | "md" }) {
  const dimension = size === "sm" ? 32 : 42;
  return guild.icon ? (
    <img
      width={dimension}
      height={dimension}
      className="server-avatar"
      src={`https://cdn.discordapp.com/icons/${guild.guildId}/${guild.icon}.png?size=96`}
      alt=""
    />
  ) : (
    <span className={`server-avatar server-avatar-fallback ${size}`} aria-hidden="true">
      {guild.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function DashboardShell({
  data,
  children,
  section,
}: {
  data: ShellData;
  children: React.ReactNode;
  section: "overview" | "admins" | "audit";
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [switchSearch, setSwitchSearch] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [command, setCommand] = useState("");
  const filtered = useMemo(
    () =>
      data.servers.filter((server) =>
        server.name.toLowerCase().includes(switchSearch.toLowerCase()),
      ),
    [data.servers, switchSearch],
  );
  const commands = useMemo(
    () =>
      [
        { label: "Overview", href: `/servers/${data.guild.guildId}` },
        { label: "Admins", href: `/servers/${data.guild.guildId}/admins` },
        { label: "Audit log", href: `/servers/${data.guild.guildId}/audit` },
        ...data.servers.map((server) => ({
          label: `Server: ${server.name}`,
          href: `/servers/${server.guildId}`,
        })),
      ].filter((item) => item.label.toLowerCase().includes(command.toLowerCase())),
    [command, data],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const currentSection =
    section === "overview" ? "Overview" : section === "admins" ? "Admins" : "Audit log";
  return (
    <GuildContext.Provider value={data}>
      <div className="app-shell">
        <header className="topbar">
          <a className="brand" href="/servers" aria-label="Axex Dashboard home">
            <span className="brand-mark">AX</span>
            <span className="wordmark">
              AXEX <span className="brand-divider">/</span> DASHBOARD
            </span>
          </a>
          <div className="topbar-tools">
            <div className="switcher-wrap">
              <details className="switcher">
                <summary aria-label={`Current server: ${data.guild.name}`}>
                  <Avatar guild={data.guild} size="sm" />
                  <span className="switcher-label">{data.guild.name}</span>
                  <span className="chevron" aria-hidden="true">
                    ⌄
                  </span>
                </summary>
                <div className="switcher-popover">
                  <label className="sr-only" htmlFor="server-search">
                    Search servers
                  </label>
                  <input
                    id="server-search"
                    value={switchSearch}
                    onChange={(event) => setSwitchSearch(event.target.value)}
                    placeholder="Search servers…"
                    autoComplete="off"
                  />
                  {filtered.map((server) => (
                    <a
                      key={server.guildId}
                      href={`/servers/${server.guildId}`}
                      onClick={() => remember(server.guildId)}
                    >
                      <Avatar guild={server} size="sm" />
                      <span>{server.name}</span>
                    </a>
                  ))}
                  {filtered.length === 0 && <p className="muted small">No matching servers.</p>}
                </div>
              </details>
            </div>
            <button
              className="palette-trigger"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette"
            >
              <span>Jump to</span>
              <kbd>Ctrl K</kbd>
            </button>
            <details className="user-menu">
              <summary aria-label="User menu">
                <span className="user-avatar">
                  {data.user.avatar ? (
                    <img
                      src={`https://cdn.discordapp.com/avatars/${data.user.userId}/${data.user.avatar}.png?size=64`}
                      alt=""
                    />
                  ) : (
                    (data.user.globalName ?? data.user.username).slice(0, 1).toUpperCase()
                  )}
                </span>
                <span className="user-name">{data.user.globalName ?? data.user.username}</span>
                <span aria-hidden="true">⌄</span>
              </summary>
              <div className="user-popover">
                <p className="small muted">Signed in as</p>
                <strong>{data.user.username}</strong>
                <button className="menu-action" onClick={() => void signOut()}>
                  Sign out
                </button>
              </div>
            </details>
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((open) => !open)}
            >
              ☰
            </button>
          </div>
        </header>
        <div className="page-heading page-wrap">
          <div className="breadcrumbs">
            <a href="/servers">Servers</a>
            <span aria-hidden="true">/</span>
            <span>{data.guild.name}</span>
            <span aria-hidden="true">/</span>
            <strong>{currentSection}</strong>
          </div>
          <span className={`role-badge role-${data.guild.role}`}>{data.guild.role}</span>
        </div>
        <div className="workspace page-wrap">
          <aside
            className={`sidebar ${drawerOpen ? "sidebar-open" : ""}`}
            aria-label="Server navigation"
          >
            <div className="sidebar-server">
              <Avatar guild={data.guild} />
              <div>
                <strong>{data.guild.name}</strong>
                <span>{data.guild.memberCount.toLocaleString()} members</span>
              </div>
            </div>
            <nav className="side-nav">
              <a
                className={section === "overview" ? "active" : ""}
                href={`/servers/${data.guild.guildId}`}
              >
                <span className="nav-icon">◈</span>Overview
              </a>
              <button disabled className="nav-disabled">
                <span className="nav-icon">✓</span>Verification
                <span className="coming-badge">Coming soon</span>
              </button>
              <button disabled className="nav-disabled">
                <span className="nav-icon">≋</span>Logs
                <span className="coming-badge">Coming soon</span>
              </button>
              <a
                className={section === "admins" ? "active" : ""}
                href={`/servers/${data.guild.guildId}/admins`}
              >
                <span className="nav-icon">♙</span>Admins
              </a>
              <a
                className={section === "audit" ? "active" : ""}
                href={`/servers/${data.guild.guildId}/audit`}
              >
                <span className="nav-icon">▤</span>Audit log
              </a>
            </nav>
            <a className="sidebar-bottom" href="/servers">
              ← All servers
            </a>
          </aside>
          {drawerOpen && (
            <button
              className="drawer-backdrop"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
            />
          )}
          <main className="main-content" id="main-content">
            {children}
          </main>
        </div>
        {paletteOpen && (
          <div
            className="modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPaletteOpen(false);
            }}
          >
            <section
              className="command-palette"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <div className="command-search">
                <span aria-hidden="true">⌕</span>
                <input
                  autoFocus
                  placeholder="Search servers and pages…"
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                />
                <kbd>ESC</kbd>
              </div>
              <div className="command-results" role="listbox">
                {commands.map((item) => (
                  <a
                    key={item.href}
                    role="option"
                    aria-selected="false"
                    href={item.href}
                    onClick={() => setPaletteOpen(false)}
                  >
                    {item.label}
                    <span>↗</span>
                  </a>
                ))}
                {commands.length === 0 && <p className="muted small">No results found.</p>}
              </div>
              <div className="palette-hint">
                Navigate anywhere in Axex <kbd>Ctrl K</kbd>
              </div>
            </section>
          </div>
        )}
      </div>
    </GuildContext.Provider>
  );
}
