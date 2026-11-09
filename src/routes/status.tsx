import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "../components/info-page";

export const Route = createFileRoute("/status")({
  head: () => ({
    meta: [
      { title: "Service status — Axex" },
      {
        name: "description",
        content: "Current status-page coverage and service dependencies for Axex.",
      },
    ],
    links: [{ rel: "canonical", href: "https://axex-dashboard.vercel.app/status" }],
  }),
  component: StatusPage,
});

function StatusPage() {
  return (
    <InfoPage
      eyebrow="Service status"
      title="Status visibility."
      description="The public status feed is not connected yet. This page does not claim live uptime or component health."
    >
      <InfoSection title="Current reporting">
        <div className="info-status-banner">
          <span className="info-status-dot" />
          <div>
            <strong>Live monitoring is not connected</strong>
            <p>No automated uptime, incident or latency feed is published on this page.</p>
          </div>
        </div>
      </InfoSection>
      <InfoSection title="Service dependencies">
        <div className="info-card-grid">
          <article className="info-card">
            <span className="info-card-tag">Platform dependency</span>
            <h3>Discord API</h3>
            <p>Bot interactions, role changes, member data and OAuth sign-in depend on Discord.</p>
          </article>
          <article className="info-card">
            <span className="info-card-tag">Application dependency</span>
            <h3>Verification portal</h3>
            <p>Member challenges and verification callbacks depend on the portal service.</p>
          </article>
          <article className="info-card">
            <span className="info-card-tag">Hosting and storage</span>
            <h3>Dashboard and database</h3>
            <p>
              Server management views and stored dashboard records depend on hosting and database
              availability.
            </p>
          </article>
        </div>
      </InfoSection>
      <InfoSection title="How to report an issue">
        <p>
          Check the bot&apos;s <code>#axex-logs</code> channel and note the relevant Case ID. For a
          dashboard bug, use the public issue tracker without including passwords, tokens, raw IP
          addresses or private member records.
        </p>
        <p>
          The project change history is available in the{" "}
          <a
            href="https://github.com/demon-richis/axex-dashboard/commits/main"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub commit history
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
