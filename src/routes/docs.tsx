import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "../components/info-page";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Setup guide — Axex" },
      {
        name: "description",
        content: "Install Axex, run setup, configure verification and review member cases.",
      },
    ],
    links: [{ rel: "canonical", href: "https://axex-dashboard.vercel.app/docs" }],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <InfoPage
      eyebrow="Documentation"
      title="Set up Axex in your Discord server."
      description="A practical install guide for server owners and moderation teams. Review the permission requirements before running setup."
    >
      <InfoSection title="1. Add the bot">
        <p>
          Use <a href="/">Add Axex to Discord</a> and choose the server you manage. Discord will
          show the permissions requested by the configured bot invite. Review that prompt before
          authorising it.
        </p>
      </InfoSection>
      <InfoSection title="2. Run the guided setup">
        <p>
          In your server, run <code>/vsetup</code> as an administrator with Manage Server access.
          The setup checks Axex&apos;s Manage Roles and Manage Channels permissions, then creates or
          reuses the verification roles and channels.
        </p>
        <ul>
          <li>
            <code>Verified</code>, <code>Unverified</code> and <code>Quarantined</code> roles.
          </li>
          <li>
            <code>#verify</code>, <code>#quarantine</code> and <code>#axex-logs</code> channels.
          </li>
          <li>
            A verification panel in <code>#verify</code>.
          </li>
        </ul>
        <p>
          Setup also writes channel visibility overwrites for Unverified and Quarantined roles.
          Review the <a href="/permissions">permissions guide</a> before continuing.
        </p>
      </InfoSection>
      <InfoSection title="3. Test the member flow">
        <p>
          Open the panel in <code>#verify</code> with a test account. A member completes the
          verification challenge; the bot updates their role and records the outcome.
        </p>
        <p>
          If a case needs attention, use <code>/verification-log</code> with its eight-digit Case
          ID. The Case ID is a lookup label, not a password or verification token.
        </p>
      </InfoSection>
      <InfoSection title="4. Review a quarantine case">
        <ul>
          <li>
            <code>/quarantine list</code> lists active quarantine cases.
          </li>
          <li>
            <code>/quarantine inspect user</code> shows a member&apos;s case details.
          </li>
          <li>
            <code>/quarantine release user</code> removes the Quarantined role and returns the
            member to Unverified.
          </li>
        </ul>
        <p>
          A moderator should review the case before releasing a member. Axex does not provide an
          automated appeal decision.
        </p>
      </InfoSection>
      <InfoSection title="When something fails">
        <p>
          Check the bot&apos;s role position, channel access and <code>#axex-logs</code>. If Discord
          denies a role change, move Axex above the roles it must manage and run the repair command
          or setup again after reviewing the changes.
        </p>
        <p>
          For dashboard access, use the server owner&apos;s registered dashboard permissions. A
          Discord role by itself does not grant dashboard access.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
