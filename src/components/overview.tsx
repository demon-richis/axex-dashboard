import type { ShellGuild } from "./dashboard-shell.tsx";

const labels = ["success", "failed", "quarantined", "expired", "in_progress"] as const;
const names: Record<(typeof labels)[number], string> = {
  success: "Success",
  failed: "Failed",
  quarantined: "Quarantined",
  expired: "Expired",
  in_progress: "In progress",
};

export function Overview({
  guild,
  stats,
}: {
  guild: Pick<ShellGuild, "guildId" | "name" | "memberCount" | "lastSeenAt">;
  stats: Record<string, number> | null;
}) {
  const lastSeen = new Date(guild.lastSeenAt);
  const age = Math.max(0, Date.now() - lastSeen.getTime());
  const connected = age <= 10 * 60_000;
  const ago =
    age < 60_000
      ? "just now"
      : age < 60 * 60_000
        ? `${Math.floor(age / 60_000)} min ago`
        : age < 24 * 60 * 60_000
          ? `${Math.floor(age / 3_600_000)} hr ago`
          : `${Math.floor(age / 86_400_000)} days ago`;
  return (
    <div className="overview-page">
      <div className="overview-title">
        <div>
          <p className="eyebrow">SERVER OVERVIEW</p>
          <h1>{guild.name}</h1>
          <p className="muted">Your Axex control room.</p>
        </div>
        <div className={`bot-status ${connected ? "is-online" : "is-offline"}`}>
          <span className="status-dot" />
          <div>
            <strong>{connected ? "Connected" : "Offline"}</strong>
            <span>{connected ? "Heartbeat received" : `Last seen ${ago}`}</span>
          </div>
        </div>
      </div>
      {stats && (
        <section className="stats-section" aria-labelledby="stats-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LAST 7 DAYS</p>
              <h2 id="stats-title">Verification activity</h2>
            </div>
            <span className="muted small">Updated from Axex</span>
          </div>
          <div className="stats-grid">
            {labels.map((key) => (
              <article key={key} className="card stat-card">
                <span className={`stat-indicator stat-${key}`} />
                <span className="stat-label">{names[key]}</span>
                <strong>{(stats[key] ?? 0).toLocaleString()}</strong>
                <span className="muted small">cases</span>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="next-steps" aria-labelledby="next-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KEEP MOVING</p>
            <h2 id="next-title">Next steps</h2>
          </div>
        </div>
        <div className="next-grid">
          <a className="card next-card" href={`/servers/${guild.guildId}/admins`}>
            <span className="next-icon ember-icon">♙</span>
            <div>
              <h3>Manage admins</h3>
              <p>Add trusted people or adjust what they can see.</p>
            </div>
            <span className="next-arrow">↗</span>
          </a>
          <article className="card next-card disabled-card">
            <span className="next-icon gold-icon">✓</span>
            <div>
              <h3>Verification settings</h3>
              <p>Fine-tune checks for your community.</p>
            </div>
            <span className="coming-badge">Coming soon</span>
          </article>
          <article className="card next-card disabled-card">
            <span className="next-icon green-icon">≋</span>
            <div>
              <h3>Review logs</h3>
              <p>Follow activity and investigation details.</p>
            </div>
            <span className="coming-badge">Coming soon</span>
          </article>
        </div>
      </section>
    </div>
  );
}
