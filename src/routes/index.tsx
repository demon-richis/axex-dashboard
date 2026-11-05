import { LoadingSkeleton } from "../components/loading-skeleton";
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
    <main className="landing-page">
      <header className="landing-header">
        <a className="brand" href="/">
          <span className="brand-mark">AX</span>
          <span className="wordmark">
            AXEX <span className="brand-divider">/</span> DASHBOARD
          </span>
        </a>
        <span className="secure-label">
          <span className="secure-dot" />
          Private by design
        </span>
      </header>
      <section className="landing-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="ember-line" /> AXEX SERVER CONTROL
          </p>
          <h1>
            Your servers,
            <br />
            <span>in one place.</span>
          </h1>
          <p className="hero-description">
            A calm, secure view of your Axex communities. Check bot health, manage trusted admins,
            and keep an eye on important changes.
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
            {signedIn ? (
              "Open dashboard"
            ) : (
              <>
                <span className="discord-icon" aria-hidden="true">
                  ◉
                </span>{" "}
                Login with Discord <span aria-hidden="true">→</span>
              </>
            )}
          </a>
          <p className="privacy-note">
            <span aria-hidden="true">⌑</span> We only ask Discord to confirm your identity.
          </p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-glow" />
          <div className="hero-core">
            <span className="brand-mark hero-mark">AX</span>
            <strong>AXEX</strong>
            <span>SERVER CONTROL</span>
          </div>
          <div className="float-card float-status">
            <span className="status-dot" />
            <div>
              <small>BOT STATUS</small>
              <strong>Connected</strong>
            </div>
            <b>●</b>
          </div>
          <div className="float-card float-servers">
            <small>YOUR SERVERS</small>
            <div className="mini-server">N</div>
            <div className="mini-server mini-two">A</div>
            <div className="mini-server mini-three">+</div>
            <span>All in one view</span>
          </div>
          <div className="spark spark-one" />
          <div className="spark spark-two" />
        </div>
      </section>
      <footer className="landing-footer">
        <span>AXEX DASHBOARD · D1</span>
        <span>Built for the people who keep communities safe.</span>
      </footer>
    </main>
  );
}
