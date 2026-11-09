import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "../components/info-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Service terms — Axex" },
      {
        name: "description",
        content:
          "Basic terms for installing and using the Axex Discord security bot and dashboard.",
      },
    ],
    links: [{ rel: "canonical", href: "https://axex-dashboard.vercel.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPage
      eyebrow="Service terms"
      title="Use Axex responsibly."
      description="These terms summarise expected use of the Axex bot, verification portal and dashboard. They are a product-use notice, not legal advice."
      reviewed="Reviewed 9 November 2026"
    >
      <InfoSection title="1. Server authority">
        <p>
          You must be authorised to add bots and configure roles or channel permissions in each
          Discord server where you install Axex. You are responsible for reviewing the bot&apos;s
          permission prompt and the changes made by <code>/vsetup</code>.
        </p>
      </InfoSection>
      <InfoSection title="2. Moderation decisions">
        <p>
          Verification signals can be incomplete or incorrect. You remain responsible for moderation
          decisions, reviewing flagged cases and handling member disputes. Do not treat an
          account-age or network signal as proof of misconduct by itself.
        </p>
      </InfoSection>
      <InfoSection title="3. Acceptable use">
        <p>
          Do not use Axex to harass members, collect information unrelated to server security,
          bypass Discord rules, or share another person&apos;s private data. Do not submit tokens,
          credentials or raw case information to public issue trackers.
        </p>
      </InfoSection>
      <InfoSection title="4. Availability and changes">
        <p>
          Axex depends on Discord, the verification portal, database infrastructure and hosting
          services. No uptime SLA, latency guarantee or uninterrupted availability commitment is
          published. Features and configuration may change as the service is maintained.
        </p>
      </InfoSection>
      <InfoSection title="5. Data handling">
        <p>
          Review the <a href="/privacy">Privacy & data page</a> before installing Axex. It explains
          dashboard identity/server records, verification data, network signals and documented
          retention defaults.
        </p>
      </InfoSection>
      <InfoSection title="6. Removal">
        <p>
          You can remove the bot from a Discord server using Discord&apos;s server controls.
          Removing the bot does not, by itself, prove that every historical dashboard, portal or
          bot-side database record has been deleted.
        </p>
      </InfoSection>
      <InfoSection title="7. Contact">
        <p>
          For service questions, use the{" "}
          <a
            href="https://github.com/demon-richis/axex-dashboard/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            project issue tracker
          </a>
          . Do not include member personal data, IP addresses, credentials or private case details.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
