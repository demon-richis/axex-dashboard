import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { LoadingSkeleton } from "../components/loading-skeleton";
import "../components/dashboard.css";
import "../components/landing.css";

const loadLanding = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getRequest }, { getSession }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("../lib/session.server.ts"),
  ]);
  const request = getRequest();
  const search = new URL(request.url).searchParams;

  return {
    signedIn: Boolean(getSession(request)),
    connected: search.get("connected") === "1",
    error: search.get("error"),
  };
});

export const Route = createFileRoute("/")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingSkeleton variant="landing" />,
  loader: () => loadLanding(),
  head: () => ({
    meta: [
      { title: "Axex — Discord Security" },
      {
        name: "description",
        content:
          "Protect your Discord community with Axex security, verification and moderation tools.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    number: "01",
    title: "Server protection",
    description: "Anti-nuke controls and raid protection for critical server activity.",
  },
  {
    number: "02",
    title: "Member verification",
    description: "A secure, guided verification flow for new community members.",
  },
  {
    number: "03",
    title: "Clear oversight",
    description: "Review server status, access and important administrative activity.",
  },
];

function LandingPage() {
  const { signedIn, connected, error } = Route.useLoaderData();
  const authHref = signedIn ? "/api/auth/discord?consent=1" : "/api/auth/discord";
  const signInLabel = signedIn ? "Reconnect Discord" : "Continue with Discord";

  let notice = "";
  if (connected) {
    notice = "Discord access updated. Your server list is ready.";
  } else if (error === "permissions") {
    notice = "Server access was not approved. Reconnect Discord and approve the requested access.";
  } else if (error === "state") {
    notice = "Your sign-in session expired. Please try again.";
  } else if (error) {
    notice = "Discord sign-in did not finish. Please try again.";
  }

  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Axex home">
          <span className="landing-brand-mark">AX</span>
          <span className="landing-brand-name">AXEX</span>
        </a>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#security">Security</a>
        </nav>

        <div className="landing-header-actions">
          {signedIn && (
            <a className="landing-dashboard-link" href="/servers">
              Dashboard
            </a>
          )}
          <a className="landing-header-cta" href={authHref}>
            {signInLabel}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <main id="main-content">
        <section className="landing-hero">
          <p className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            DISCORD SECURITY
          </p>

          <h1>
            Keep your server
            <br />
            <span>under control.</span>
          </h1>

          <p className="hero-description">
            Practical protection for Discord communities. Secure verification, server safeguards and
            clear controls in one place.
          </p>

          {notice && (
            <p className={connected ? "landing-notice success" : "landing-notice"} role="status">
              {notice}
            </p>
          )}

          <div className="landing-actions">
            <a className="landing-primary-button" href={signedIn ? "/servers" : authHref}>
              {signedIn ? "Open dashboard" : "Continue with Discord"}
              <span aria-hidden="true">↗</span>
            </a>
            <a className="landing-secondary-link" href={signedIn ? authHref : "#features"}>
              {signedIn ? "Reconnect Discord" : "Explore features"}
              <span aria-hidden="true">{signedIn ? "↗" : "↓"}</span>
            </a>
          </div>

          <div className="landing-availability">
            <span>
              <i /> Server-focused security
            </span>
            <span>No bot token in dashboard</span>
          </div>
        </section>

        <section className="landing-features" id="features" aria-labelledby="features-title">
          <div className="landing-section-heading">
            <p>WHAT AXEX DOES</p>
            <h2 id="features-title">The essentials.</h2>
          </div>

          <div className="landing-feature-grid">
            {features.map((feature) => (
              <article className="landing-feature" key={feature.number}>
                <span className="landing-feature-number">{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-security" id="security">
          <div>
            <p className="landing-section-label">ACCESS & SECURITY</p>
            <h2>
              Built to protect.
              <br />
              <span>Designed to stay clear.</span>
            </h2>
          </div>
          <p>
            Sign in with Discord to view servers you can manage. Axex requests the access needed for
            the dashboard and keeps bot credentials separate from your account.
          </p>
          <a href={signedIn ? "/servers" : authHref}>
            {signedIn ? "Go to dashboard" : "Sign in with Discord"}
            <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="/" className="landing-footer-brand">
          <span>AX</span> AXEX
        </a>
        <span>Discord security and server control.</span>
        <span className="landing-footer-copy">© {new Date().getFullYear()} Axex</span>
      </footer>
    </div>
  );
}
