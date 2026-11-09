import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "../components/info-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy and data handling — Axex" },
      {
        name: "description",
        content:
          "Understand what Axex stores across the dashboard, Discord bot and verification portal.",
      },
    ],
    links: [{ rel: "canonical", href: "https://axex-dashboard.vercel.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy and data handling"
      title="What Axex stores."
      description="The dashboard, bot and verification portal use separate records. This summary follows the current application schemas and cleanup code; production settings may override documented defaults."
      reviewed="Implementation review: 9 November 2026"
    >
      <InfoSection title="Dashboard sign-in and server access">
        <p>
          Dashboard sign-in requests Discord OAuth scopes <code>identify</code> and{" "}
          <code>guilds</code>. The dashboard uses the server list to determine which connected
          servers you can access.
        </p>
        <p className="info-callout">
          <strong>Configuration mismatch to resolve:</strong> AGENTS.md and README.md specify
          identify-only OAuth, while the current auth code and tests request identify plus guilds
          and sync guild metadata. The owner must confirm the intended policy before this becomes a
          final privacy statement. The callback discards its temporary OAuth token after use; it is
          not stored as a persistent dashboard record.
        </p>
        <ul>
          <li>Discord user ID, username, global name and avatar.</li>
          <li>Server IDs, names, icons, owner flag and Discord permission bitfield.</li>
          <li>Last-login and server-list refresh timestamps.</li>
          <li>
            Dashboard admin/viewer assignments and dashboard audit events, including actor, action,
            target, details and timestamp.
          </li>
        </ul>
        <p>
          The signed dashboard session cookie lasts 12 hours. The temporary OAuth state cookie lasts
          10 minutes. Cookies are configured as Secure, HttpOnly and SameSite=Lax.
        </p>
      </InfoSection>
      <InfoSection title="Verification portal records">
        <p>The portal schema includes verification and anti-abuse fields such as:</p>
        <ul>
          <li>Discord user and server IDs, server name and member count.</li>
          <li>Verification token status, expiry, Case ID, reference ID and challenge metadata.</li>
          <li>
            Attempt count, cooldown, lock state, failure reason, response time and completion time.
          </li>
          <li>Discord username/tag/avatar, account-age data, VPN/proxy result and flag reason.</li>
          <li>
            Network information: raw IP-address fields appear in verification tokens, audit logs and
            suspicious-attempt records. A separate IP-check cache stores a hash of an IP address.
          </li>
        </ul>
        <p>
          Raw IP addresses may therefore be stored by the portal for verification and abuse
          prevention. The bot&apos;s Discord case embeds redact IP-address strings from the
          displayed log text; that display behaviour is not the same as database deletion.
        </p>
      </InfoSection>
      <InfoSection title="Bot-side case records">
        <p>
          The bot database records Case IDs, Discord user and server IDs, usernames, reference IDs,
          verification status, account age, attempts, response timing, result/reason, and security
          flags such as VPN, flagged network, honeypot and bot signals. Quarantine records can also
          include the moderator ID and moderator note.
        </p>
        <p>
          These records are separate from the portal&apos;s token and audit-log cleanup. The portal
          retention timers below should not be read as a deletion promise for bot-side case tables.
        </p>
      </InfoSection>
      <InfoSection title="Documented portal retention defaults">
        <div className="info-table-wrap">
          <table className="info-table">
            <thead>
              <tr>
                <th>Record type</th>
                <th>Default cleanup</th>
                <th>Important detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Verification tokens</td>
                <td>30 days</td>
                <td>
                  Older token rows are deleted unless they are still referenced by a
                  pending/processing callback.
                </td>
              </tr>
              <tr>
                <td>Audit logs</td>
                <td>365 days</td>
                <td>Portal audit records older than the configured cutoff are deleted.</td>
              </tr>
              <tr>
                <td>Delivered callback outbox</td>
                <td>30 days</td>
                <td>Only delivered callback payloads older than the cutoff are deleted.</td>
              </tr>
              <tr>
                <td>Rate-limit buckets and IP-check cache</td>
                <td>Expiry-based</td>
                <td>Transient rows are deleted after their own expiry timestamps.</td>
              </tr>
              <tr>
                <td>Verification state / locks</td>
                <td>Retained until release</td>
                <td>
                  The portal README says attempt/cooldown/lock state is retained until a release.
                </td>
              </tr>
              <tr>
                <td>Suspicious-attempt and bot-side case records</td>
                <td>No shared timer stated</td>
                <td>
                  These records are not included in the portal retention function described above.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          The portal cleanup defaults are configurable with <code>TOKEN_RETENTION_DAYS</code>,
          <code>AUDIT_LOG_RETENTION_DAYS</code> and <code>OUTBOX_RETENTION_DAYS</code>. The portal
          repository schedules its authenticated cleanup worker daily. The deployed environment
          values have not been independently verified from this page, so actual settings may differ.
        </p>
      </InfoSection>
      <InfoSection title="Website analytics">
        <p>
          The dashboard includes Vercel Web Analytics and named product events for install-button
          clicks, dashboard-button clicks, sample-case views, FAQ expansion and 50%/90% scroll
          depth. These events send the event name and small non-identifying properties such as
          button placement or selected sample tab; they do not include Discord tokens, Case IDs,
          usernames or server IDs.
        </p>
        <p>
          The analytics integration is present in the application. Event collection also depends on
          Web Analytics being enabled for the Vercel project.
        </p>
      </InfoSection>
      <InfoSection title="Access and security">
        <p>
          Dashboard access is checked against the server owner, Discord server ownership and
          dashboard admin assignments. A Discord server permission alone does not automatically
          grant dashboard access.
        </p>
        <p>
          Do not post access tokens, raw IP addresses, private case data or member-identifying
          information in public support issues. For a data-access or deletion request, open a
          private support channel through the project owner; the public issue tracker is not a
          suitable place for private records.
        </p>
      </InfoSection>
      <InfoSection title="What this page does not promise">
        <p>
          This page is a technical field and configuration summary, not a guarantee that every
          deployment uses the repository defaults. It does not claim that all bot-side records,
          suspicious-attempt records or every copy in backups are automatically erased on the
          portal&apos;s token or audit-log schedule.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
