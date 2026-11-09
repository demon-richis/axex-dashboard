import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "../components/info-page";

export const Route = createFileRoute("/permissions")({
  head: () => ({
    meta: [
      { title: "Bot permissions — Axex" },
      {
        name: "description",
        content: "See which Discord permissions Axex checks and what setup changes in your server.",
      },
    ],
    links: [{ rel: "canonical", href: "https://axex-dashboard.vercel.app/permissions" }],
  }),
  component: PermissionsPage,
});

function PermissionsPage() {
  return (
    <InfoPage
      eyebrow="Installation and access"
      title="Understand the permissions first."
      description="Axex needs role and channel management to configure verification. Setup also changes visibility rules for its managed roles."
    >
      <InfoSection title="Required for /vsetup">
        <div className="info-card-grid">
          <article className="info-card">
            <span className="info-card-tag">Discord permission</span>
            <h3>Manage Roles</h3>
            <p>
              Create and configure the Verified, Unverified and Quarantined roles, and assign or
              remove those roles during verification.
            </p>
          </article>
          <article className="info-card">
            <span className="info-card-tag">Discord permission</span>
            <h3>Manage Channels</h3>
            <p>
              Create or configure the verify, quarantine and log channels, including their
              permission overwrites.
            </p>
          </article>
        </div>
        <p>
          These are the two permissions the setup code explicitly checks before it proceeds. The bot
          must also be able to view and send messages in the channels it uses.
        </p>
      </InfoSection>
      <InfoSection title="Role hierarchy matters">
        <ul>
          <li>Keep the Axex bot role above the Verified, Unverified and Quarantined roles.</li>
          <li>Discord will not let the bot manage a role that is above its highest role.</li>
          <li>Do not place Axex above roles it does not need to manage.</li>
        </ul>
      </InfoSection>
      <InfoSection title="What setup changes">
        <p>
          Axex creates or reuses its three roles and three channels. It sets the verification
          channel to be used by Unverified members and manages access to the quarantine and log
          channels.
        </p>
        <p>
          Setup also adds explicit <code>View Channel</code> denies for Unverified and Quarantined
          roles on existing server channels, except the Axex-managed channels. This can change which
          channels those roles can see. Review your existing channel rules before running
          <code> /vsetup</code>.
        </p>
        <p>
          The default setup flow reuses existing roles and channels where possible. A delete-and-
          recreate strategy is a separate explicit setup choice; it is not the default.
        </p>
      </InfoSection>
      <InfoSection title="Permission review checklist">
        <ul>
          <li>Check the permission prompt Discord shows when inviting the bot.</li>
          <li>Confirm the Axex role is above only the roles it must manage.</li>
          <li>Review channel visibility for Unverified and Quarantined members.</li>
          <li>Keep trusted staff roles and unrelated custom overwrites intact.</li>
          <li>Test verification before opening the server to new members.</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
