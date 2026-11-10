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
          Dashboard sign-in requests Discord&apos;s <code>identify</code> scope only. The callback
          uses the short-lived OAuth token to fetch the user&apos;s identity and discards it; it is
          not stored. The dashboard does not ask Discord for a user&apos;s guild list.
        </p>
        <p>
          Connected server names, icons, owner IDs and member counts come from Axex&apos;s bot
          registration records. Access is granted only to the recorded server owner or a dashboard
          admin explicitly registered by that owner. Server permissions from Discord OAuth are not
          used as authorization.
        </p>
        <p className="info-callout">
          Older sign-ins may have left cached user-to-server permission snapshots in a legacy
          database table. The current application does not read those rows for server listing or
          authorization. They are not automatically deleted until an approved retention policy is
          set.
        </p>
        <ul>
          <li>Discord user ID, username, global name and avatar.</li>
          <li>Bot-registered server IDs, names, icons, owner IDs and member counts.</li>
          <li>Last-login timestamps.</li>
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
          The site forwards the named install, dashboard CTA, sample-case, FAQ and 50%/90% scroll
          events to Vercel Web Analytics when available. Only allowlisted event names and small
          interface properties are sent; Discord IDs, server IDs, tokens and case data are removed
          by the client-side event filter. Collection requires Web Analytics to be enabled for the
          Vercel project.
        </p>
      </InfoSection>
      <InfoSection title="Access and security">
        <p>
          Dashboard access is checked against the bot&apos;s registered server owner and dashboard
          admin assignments. A Discord server permission alone does not automatically grant
          dashboard access.
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
