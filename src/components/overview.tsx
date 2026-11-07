import { useRouter } from "@tanstack/react-router";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { History, RefreshCw, UsersRound } from "lucide-react";
import { VerificationChart, type VerificationTrendPoint } from "./verification-chart";
import type { ShellGuild } from "./dashboard-shell.tsx";
import { describeAuditAction, isGuildOnline, relativeAge } from "../lib/dashboard-view.ts";

type OverviewActivity = {
  id: number;
  actorId: string;
  actorName: string | null;
  actorAvatar: string | null;
  action: string;
  targetId: string | null;
  details: string;
  createdAt: string;
};

const labels = ["success", "failed", "quarantined", "expired", "in_progress"] as const;
const names: Record<(typeof labels)[number], string> = {
  success: "Successful",
  failed: "Failed",
  quarantined: "Quarantined",
  expired: "Expired",
  in_progress: "In progress",
};

export function Overview({
  guild,
  stats,
  activity,
  trend,
}: {
  guild: ShellGuild;
  stats: Record<string, number> | null;
  activity: OverviewActivity[];
  trend: VerificationTrendPoint[] | null;
}) {
  const router = useRouter();
  const [statsRef] = useAutoAnimate<HTMLDivElement>({ duration: 170, easing: "ease-in-out" });
  const [activityRef] = useAutoAnimate<HTMLOListElement>({ duration: 170, easing: "ease-in-out" });
  const connected = isGuildOnline(guild.lastSeenAt);
  const totalCases = stats ? labels.reduce((sum, key) => sum + (stats[key] ?? 0), 0) : 0;

  return (
    <section className="overview-page">
      <header className="overview-title overview-hero">
        <div className="overview-identity">
          <span className="overview-server-avatar" aria-hidden="true">
            {guild.icon ? (
              <img
                src={`https://cdn.discordapp.com/icons/${guild.guildId}/${guild.icon}.png?size=128`}
                alt=""
              />
            ) : (
              guild.name.slice(0, 1).toUpperCase()
            )}
          </span>
          <div className="overview-title-copy">
            <p className="eyebrow">
              SERVER CONTROL <span className="title-divider">/</span> OVERVIEW
            </p>
            <h1>{guild.name}</h1>
            <p className="muted">
              {guild.memberCount.toLocaleString()} members
              <span className="dot-separator" aria-hidden="true">
                ·
              </span>
              {guild.role === "owner" ? "You own this server" : `${capitalize(guild.role)} access`}
            </p>
          </div>
        </div>
        <div className={`overview-health ${connected ? "is-online" : "is-offline"}`}>
          <div className="health-signal" aria-hidden="true">
            <span />
          </div>
          <div className="health-copy">
            <span className="eyebrow">AXEX CONNECTION</span>
            <strong>{connected ? "Connected" : "Offline"}</strong>
            <span className="muted">
              Last heartbeat{" "}
              <time dateTime={new Date(guild.lastSeenAt).toISOString()}>
                {relativeAge(guild.lastSeenAt)}
              </time>
            </span>
          </div>
          <button
            className="icon-button overview-refresh"
            type="button"
            aria-label="Refresh server overview"
            title="Refresh server overview"
            onClick={() => void router.invalidate()}
          >
            <RefreshCw size={17} strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>
      </header>

      {stats && (
        <section className="overview-section" aria-labelledby="verification-title">
          <div className="section-heading overview-section-heading">
            <div>
              <p className="eyebrow">
                LAST 7 DAYS <span className="title-divider">/</span> VERIFICATION
              </p>
              <h2 id="verification-title">Activity snapshot</h2>
            </div>
            <span className="overview-total">
              <strong>{totalCases.toLocaleString()}</strong> cases
            </span>
          </div>
          <div ref={statsRef} className="overview-stat-grid">
            {labels.map((key, index) => (
              <article className={`card overview-stat overview-stat-${key}`} key={key}>
                <span className="overview-stat-index">0{index + 1}</span>
                <span className="stat-indicator" aria-hidden="true" />
                <span className="stat-label">{names[key]}</span>
                <strong>{(stats[key] ?? 0).toLocaleString()}</strong>
              </article>
            ))}
          </div>
          {trend && <VerificationChart data={trend} />}
        </section>
      )}

      <div className="overview-lower-grid">
        <section className="card activity-panel" aria-labelledby="activity-title">
          <header className="panel-heading">
            <div>
              <p className="eyebrow">ACCESS HISTORY</p>
              <h2 id="activity-title">Recent changes</h2>
            </div>
            <a className="text-link" href={`/servers/${guild.guildId}/audit`}>
              View audit log <span aria-hidden="true">↗</span>
            </a>
          </header>
          {activity.length > 0 ? (
            <ol ref={activityRef} className="activity-list">
              {activity.map((entry) => (
                <li className="activity-item" key={entry.id}>
                  <span className="activity-avatar" aria-hidden="true">
                    {entry.actorAvatar ? (
                      <img
                        src={`https://cdn.discordapp.com/avatars/${entry.actorId}/${entry.actorAvatar}.png?size=64`}
                        alt=""
                      />
                    ) : (
                      (entry.actorName ?? "D").slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <div className="activity-copy">
                    <strong>{entry.actorName ?? "Discord user"}</strong>
                    <span>{describeAuditAction(entry.action, entry.details)}</span>
                    <code>{entry.actorId}</code>
                    {entry.targetId && (
                      <span className="activity-target">
                        Target <code>{entry.targetId}</code>
                      </span>
                    )}
                  </div>
                  <time
                    className="activity-time"
                    dateTime={entry.createdAt}
                    title={new Date(entry.createdAt).toLocaleString()}
                  >
                    {relativeAge(entry.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <div className="activity-empty">
              <span className="activity-empty-mark" aria-hidden="true">
                —
              </span>
              <strong>No changes recorded yet</strong>
              <p>Admin access changes will appear here when they happen.</p>
              <a href={`/servers/${guild.guildId}/admins`}>
                Review dashboard access <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}
        </section>

        <aside className="overview-tools" aria-label="Server tools">
          <p className="eyebrow">YOUR WORKSPACE</p>
          <a className="card workspace-link" href={`/servers/${guild.guildId}/admins`}>
            <span className="workspace-link-icon access-icon" aria-hidden="true">
              <UsersRound size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="workspace-link-copy">
              <strong>Dashboard access</strong>
              <span>Review trusted people and roles.</span>
            </span>
            <span className="workspace-link-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <a className="card workspace-link" href={`/servers/${guild.guildId}/audit`}>
            <span className="workspace-link-icon history-icon" aria-hidden="true">
              <History size={18} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <span className="workspace-link-copy">
              <strong>Audit history</strong>
              <span>See who changed dashboard access.</span>
            </span>
            <span className="workspace-link-arrow" aria-hidden="true">
              ↗
            </span>
          </a>
          <div className="workspace-note">
            <span className="note-signal" aria-hidden="true" />
            <p>Access is defined by the server owner in Axex—not by Discord server permissions.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
