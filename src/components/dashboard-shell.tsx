import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

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

type IconName = "overview" | "verification" | "logs" | "admins" | "audit" | "search" | "servers";
function NavIcon({ name }: { name: IconName }) {
  const shapes: Record<IconName, React.ReactNode> = {
    overview: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
      </>
    ),
    verification: (
      <>
        <path d="M12 3.2 19 6v5.2c0 4.4-2.7 7.7-7 9.6-4.3-1.9-7-5.2-7-9.6V6z" />
        <path d="m8.5 11.7 2.2 2.2 4.8-4.8" />
      </>
    ),
    logs: (
      <>
        <path d="M8 5h12M8 12h12M8 19h12" />
        <circle cx="4" cy="5" r=".6" />
        <circle cx="4" cy="12" r=".6" />
        <circle cx="4" cy="19" r=".6" />
      </>
    ),
    admins: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20v-1.5a5.5 5.5 0 0 1 11 0V20zM16 5.5a3 3 0 0 1 0 5.8M17 14a4.7 4.7 0 0 1 3.5 4.5V20h-3" />
      </>
    ),
    audit: (
      <>
        <path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z" />
        <path d="M15 3.5v4h4M9 12h7M9 16h7" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    servers: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="1.5" />
        <rect x="3" y="14" width="18" height="6" rx="1.5" />
        <path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {shapes[name]}
    </svg>
  );
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
  const [activeResult, setActiveResult] = useState(0);
  const paletteRef = useRef<HTMLElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(
    () =>
      data.servers.filter((server) =>
        server.name.toLocaleLowerCase().includes(switchSearch.toLocaleLowerCase()),
      ),
    [data.servers, switchSearch],
  );
  const commands = useMemo(
    () =>
      [
        {
          label: "Overview",
          hint: "Server health and activity",
          href: `/servers/${data.guild.guildId}`,
          icon: "overview" as const,
        },
        {
          label: "Admins",
          hint: "People and access",
          href: `/servers/${data.guild.guildId}/admins`,
          icon: "admins" as const,
        },
        {
          label: "Audit log",
          hint: "Recent access changes",
          href: `/servers/${data.guild.guildId}/audit`,
          icon: "audit" as const,
        },
        ...data.servers.map((server) => ({
          label: `Server: ${server.name}`,
          hint: `${server.memberCount.toLocaleString()} members · ${server.role}`,
          href: `/servers/${server.guildId}`,
          icon: "servers" as const,
        })),
      ].filter((item) =>
        `${item.label} ${item.hint}`.toLocaleLowerCase().includes(command.toLocaleLowerCase()),
      ),
    [command, data],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        setCommand("");
        setActiveResult(0);
      }
      if (event.key === "Escape") {
        setPaletteOpen(false);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!paletteOpen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = window.requestAnimationFrame(() => commandInputRef.current?.focus());
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !paletteRef.current) return;
      const focusables = Array.from(
        paletteRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), button:not([disabled]), a[href]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapTab);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", trapTab);
      previousFocus?.focus();
    };
  }, [paletteOpen]);

  function remember(guildId: string) {
    document.cookie = `axex_last_server=${guildId}; Max-Age=2592000; Path=/; Secure; SameSite=Lax`;
  }

  function openPalette() {
    setCommand("");
    setActiveResult(0);
    setDrawerOpen(false);
    setPaletteOpen(true);
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
                      className={server.guildId === data.guild.guildId ? "switcher-current" : ""}
                      href={`/servers/${server.guildId}`}
                      aria-current={server.guildId === data.guild.guildId ? "page" : undefined}
                      onClick={() => remember(server.guildId)}
                    >
                      <Avatar guild={server} size="sm" />
                      <span>{server.name}</span>
                      {server.guildId === data.guild.guildId && (
                        <span className="switcher-current-tag">Current</span>
                      )}
                    </a>
                  ))}
                  {filtered.length === 0 && (
                    <p className="muted small" role="status">
                      No matching servers.
                    </p>
                  )}
                </div>
              </details>
            </div>
            <button
              className="palette-trigger"
              onClick={openPalette}
              aria-label="Open command palette"
            >
              <span className="palette-trigger-icon">
                <NavIcon name="search" />
              </span>
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
              aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={drawerOpen}
              aria-controls="server-navigation"
              onClick={() => setDrawerOpen((open) => !open)}
            >
              <span aria-hidden="true">{drawerOpen ? "×" : "☰"}</span>
            </button>
          </div>
        </header>
        <div className="page-heading page-wrap">
          <div className="breadcrumbs" aria-label="Breadcrumb">
            <a href="/servers">Servers</a>
            <span aria-hidden="true">/</span>
            <span>{data.guild.name}</span>
            <span aria-hidden="true">/</span>
            <strong aria-current="page">{currentSection}</strong>
          </div>
          <span className={`role-badge role-${data.guild.role}`}>{data.guild.role}</span>
        </div>
        <div className="workspace page-wrap">
          <aside
            id="server-navigation"
            className={`sidebar ${drawerOpen ? "sidebar-open" : ""}`}
            aria-label="Server navigation"
          >
            <div className="sidebar-server">
              <Avatar guild={data.guild} />
              <div>
                <strong>{data.guild.name}</strong>
                <span>{data.guild.memberCount.toLocaleString()} members</span>
                <span className={`role-badge role-${data.guild.role}`}>
                  {data.guild.role} access
                </span>
              </div>
            </div>
            <button className="nav-search" type="button" onClick={openPalette}>
              <span className="nav-search-icon">
                <NavIcon name="search" />
              </span>
              <span>Search pages</span>
              <kbd>Ctrl K</kbd>
            </button>
            <nav className="side-nav" aria-label="Dashboard sections">
              <div className="nav-group">
                <p className="nav-group-label">Workspace</p>
                <a
                  className={section === "overview" ? "active" : ""}
                  href={`/servers/${data.guild.guildId}`}
                  aria-current={section === "overview" ? "page" : undefined}
                >
                  <span className="nav-icon">
                    <NavIcon name="overview" />
                  </span>
                  Overview
                </a>
                <button disabled className="nav-disabled">
                  <span className="nav-icon">
                    <NavIcon name="verification" />
                  </span>
                  Verification
                  <span className="coming-badge">Coming soon</span>
                </button>
                <button disabled className="nav-disabled">
                  <span className="nav-icon">
                    <NavIcon name="logs" />
                  </span>
                  Logs
                  <span className="coming-badge">Coming soon</span>
                </button>
              </div>
              <div className="nav-group">
                <p className="nav-group-label">People &amp; history</p>
                <a
                  className={section === "admins" ? "active" : ""}
                  href={`/servers/${data.guild.guildId}/admins`}
                  aria-current={section === "admins" ? "page" : undefined}
                >
                  <span className="nav-icon">
                    <NavIcon name="admins" />
                  </span>
                  Admins
                </a>
                <a
                  className={section === "audit" ? "active" : ""}
                  href={`/servers/${data.guild.guildId}/audit`}
                  aria-current={section === "audit" ? "page" : undefined}
                >
                  <span className="nav-icon">
                    <NavIcon name="audit" />
                  </span>
                  Audit log
                </a>
              </div>
            </nav>
            <a className="sidebar-bottom" href="/servers">
              <span className="nav-icon">
                <NavIcon name="servers" />
              </span>
              All servers
            </a>
          </aside>
          {drawerOpen && (
            <button
              className="drawer-backdrop"
              aria-label="Close navigation"
              onClick={() => setDrawerOpen(false)}
            />
          )}
          <main className="main-content" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
        {paletteOpen && (
          <div
            className="modal-backdrop command-dialog"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setPaletteOpen(false);
            }}
          >
            <section
              ref={paletteRef}
              className="command-palette"
              role="dialog"
              aria-modal="true"
              aria-labelledby="command-title"
            >
              <h2 id="command-title" className="sr-only">
                Jump to a page or server
              </h2>
              <div className="command-search">
                <span aria-hidden="true">
                  <NavIcon name="search" />
                </span>
                <input
                  ref={commandInputRef}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded="true"
                  aria-controls="command-results"
                  aria-activedescendant={
                    commands[activeResult] ? `command-option-${activeResult}` : undefined
                  }
                  placeholder="Search servers and pages…"
                  value={command}
                  onChange={(event) => {
                    setCommand(event.target.value);
                    setActiveResult(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveResult((index) => Math.min(index + 1, commands.length - 1));
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveResult((index) => Math.max(0, index - 1));
                    } else if (event.key === "Enter" && commands[activeResult]) {
                      event.preventDefault();
                      window.location.assign(commands[activeResult]!.href);
                    }
                  }}
                />
                <kbd>ESC</kbd>
                <button
                  className="command-close"
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  aria-label="Close command palette"
                >
                  ×
                </button>
              </div>
              <div
                className="command-results"
                id="command-results"
                role="listbox"
                aria-label="Pages and servers"
              >
                {commands.map((item, index) => (
                  <a
                    id={`command-option-${index}`}
                    key={item.href}
                    className={activeResult === index ? "command-result-active" : ""}
                    role="option"
                    aria-selected={activeResult === index}
                    href={item.href}
                    onMouseEnter={() => setActiveResult(index)}
                    onClick={() => setPaletteOpen(false)}
                  >
                    <span className="command-option-icon">
                      <NavIcon name={item.icon} />
                    </span>
                    <span className="command-option-copy">
                      <strong>{item.label}</strong>
                      <small>{item.hint}</small>
                    </span>
                    <span className="command-option-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ))}
                {commands.length === 0 && (
                  <p className="muted small" role="status">
                    No pages or servers match that search.
                  </p>
                )}
              </div>
              <div className="palette-hint">
                <span>Search the current workspace</span>
                <span>
                  <kbd>↑</kbd> <kbd>↓</kbd> Navigate <kbd>↵</kbd> Open
                </span>
              </div>
            </section>
          </div>
        )}
      </div>
    </GuildContext.Provider>
  );
}
