import { LoadingSkeleton } from "../components/loading-skeleton";
import { HeroDiorama } from "../components/hero-diorama";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import "../components/dashboard.css";
import "../components/landing.css";

const loadLanding = createServerFn({ method: "GET" }).handler(async () => {
  const [{ getRequest }, { getSession }] = await Promise.all([
    import("@tanstack/react-start/server"),
    import("../lib/session.server.ts"),
  ]);
  const request = getRequest();
  return {
    signedIn: Boolean(getSession(request)),
    error: new URL(request.url).searchParams.get("error"),
  };
});

export const Route = createFileRoute("/")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingSkeleton variant="landing" />,
  loader: () => loadLanding(),
  head: () => ({
    meta: [
      { title: "Axex Dashboard · Your servers, in one place" },
      {
        name: "description",
        content: "A clear, secure control room for your Axex Discord servers.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { signedIn, error } = Route.useLoaderData();
  return (
    <div className="landing-page">
      <header className="landing-header">
        <a className="brand" href="/" aria-label="Axex Dashboard home">
          <span className="brand-mark">AX</span>
          <span className="wordmark">
            AXEX <span className="brand-divider">/</span> DASHBOARD
          </span>
        </a>
        <div className="header-signature">
          <span className="header-index">CONTROL SURFACE&nbsp; / &nbsp;001</span>
          <span className="secure-label">
            <span className="secure-dot" />
            Private by design
          </span>
        </div>
      </header>
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="hero-copy">
            <p className="eyebrow hero-kicker">
              <span className="ember-line" /> OWNER-DEFINED SERVER CONTROL
            </p>
            <h1 id="landing-title">
              Your servers.
              <br />
              <span>One clear view.</span>
            </h1>
            <p className="hero-description">
              Keep Axex close to the signal. Check bot presence, manage trusted access, and review
              important changes without the noise.
            </p>
            {error && (
              <div className="inline-alert" role="status">
                {error === "state"
                  ? "Sign-in expired. Please try again."
                  : "Discord sign-in didn’t finish. Please try again."}
              </div>
            )}
            <a
              className="button button-primary login-button"
              href={signedIn ? "/servers" : "/api/auth/discord"}
            >
              <span>{signedIn ? "Open your control room" : "Continue with Discord"}</span>
              <span className="login-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <p className="privacy-note">
              <span className="privacy-lock" aria-hidden="true">
                ◆
              </span>
              Discord confirms identity only. No bot token is stored here.
            </p>
          </div>
          <HeroDiorama />
        </section>
        <section className="landing-principles" aria-label="Dashboard principles">
          <div className="principle">
            <span className="principle-index">01&nbsp; / &nbsp;IDENTITY</span>
            <strong>Discord identify only</strong>
            <span>Nothing more requested.</span>
          </div>
          <div className="principle">
            <span className="principle-index">02&nbsp; / &nbsp;ACCESS</span>
            <strong>Owner-defined roles</strong>
            <span>Permissions stay in your database.</span>
          </div>
          <div className="principle">
            <span className="principle-index">03&nbsp; / &nbsp;RECORD</span>
            <strong>Changes leave a trace</strong>
            <span>Admin actions appear in the audit log.</span>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>
          <b className="footer-mark">AX</b> AXEX DASHBOARD <i>·</i> D1
        </span>
        <span>Built for the people who keep communities safe.</span>
      </footer>
    </div>
  );
}
