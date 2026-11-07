import { motion } from "framer-motion";
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
      { title: "Axex — Discord security, under control." },
      {
        name: "description",
        content:
          "Axex is a security-first Discord bot and dashboard for moderation, verification, anti-nuke protection and server control.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  ["01", "Anti-nuke", "Protect roles, channels, webhooks and critical server settings from destructive changes."],
  ["02", "Verification", "Gate new members with a clean verification flow and actionable security logs."],
  ["03", "Raid protection", "Detect abnormal joins and coordinated activity before it becomes a problem."],
  ["04", "Moderation", "Give your staff the controls they need without turning the dashboard into a settings maze."],
  ["05", "Audit trail", "Know what changed, who changed it and when. Keep important actions traceable."],
  ["06", "Live dashboard", "See connected servers, health and configuration from one focused control surface."],
] as const;

export const featureIcons = {
  shield: "◈",
  pulse: "⌁",
  lock: "□",
  arrow: "↗",
};

function LandingPage() {
  const { signedIn, error } = Route.useLoaderData();
  const signInHref = signedIn ? "/servers" : "/api/auth/discord";
  const signInLabel = signedIn ? "Open dashboard" : "Login with Discord";

  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Axex home">
          <span className="landing-brand-mark">AX</span>
          <span>AXEX</span>
        </a>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <a href="#security">Security</a>
        </nav>

        <a className="landing-header-cta" href={signInHref}>
          {signInLabel}
          <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main id="main-content">
        <section className="landing-hero">
          <div className="hero-copy">
            <motion.p
              className="hero-eyebrow"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <span className="live-dot" /> DISCORD SECURITY PLATFORM
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              Security that
              <br />
              <span>stays ahead.</span>
            </motion.h1>

            <motion.p
              className="hero-lead"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
            >
              Axex protects your Discord server without making your staff fight a complicated
              dashboard. Fast controls. Clear signals. Serious protection.
            </motion.p>

            {error && (
              <div className="landing-alert" role="status">
                {error === "state"
                  ? "Your Discord sign-in expired. Start again."
                  : "Discord sign-in did not finish. Please try again."}
              </div>
            )}

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
            >
              <a className="primary-cta" href={signInHref}>
                {signInLabel}
                <span>↗</span>
              </a>
              <a className="secondary-cta" href="#features">
                Explore Axex
                <span>↓</span>
              </a>
            </motion.div>

            <div className="hero-proof">
              <span><b>24/7</b> protection</span>
              <span><b>Server</b> scoped</span>
              <span><b>No</b> bot token in dashboard</span>
            </div>
          </div>

          <motion.div
            className="hero-product"
            initial={{ opacity: 0, scale: 0.98, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            <div className="product-window">
              <div className="product-bar">
                <div className="window-dots"><i /><i /><i /></div>
                <span>AXEX / DASHBOARD</span>
                <span className="window-secure">SECURE</span>
              </div>

              <div className="product-body">
                <aside className="product-sidebar">
                  <div className="mini-brand"><span>AX</span> AXEX</div>
                  <div className="mini-nav active">Overview</div>
                  <div className="mini-nav">Protection</div>
                  <div className="mini-nav">Verification</div>
                  <div className="mini-nav">Audit log</div>
                  <div className="mini-nav">Admins</div>
                  <div className="mini-spacer" />
                  <div className="mini-status"><span /> Bot connected</div>
                </aside>

                <div className="product-main">
                  <div className="mock-heading">
                    <div>
                      <small>SERVER OVERVIEW</small>
                      <strong>DEMON&apos;S SERVER</strong>
                    </div>
                    <span className="mock-online"><i /> Online</span>
                  </div>

                  <div className="mock-stats">
                    <div><small>MEMBERS</small><b>12,480</b><span>+4.8% this week</span></div>
                    <div><small>PROTECTION</small><b>Active</b><span>All systems normal</span></div>
                    <div><small>INCIDENTS</small><b>03</b><span>Last 30 days</span></div>
                  </div>

                  <div className="mock-panel">
                    <div className="mock-panel-head"><span>Protection status</span><small>LIVE</small></div>
                    <div className="mock-row"><span><i className="mock-check">✓</i> Anti-nuke</span><b>ACTIVE</b></div>
                    <div className="mock-row"><span><i className="mock-check">✓</i> Raid protection</span><b>ACTIVE</b></div>
                    <div className="mock-row"><span><i className="mock-check">✓</i> Verification</span><b>ACTIVE</b></div>
                  </div>

                  <div className="mock-log">
                    <div><span className="log-dot orange" /><span>Channel permission change</span><small>2m ago</small></div>
                    <div><span className="log-dot" /><span>Verification case resolved</span><small>18m ago</small></div>
                    <div><span className="log-dot" /><span>Protection heartbeat</span><small>31m ago</small></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="trust-strip" aria-label="Axex platform highlights">
          <span>BUILT FOR DISCORD</span>
          <span>MODERATION</span>
          <span>VERIFICATION</span>
          <span>ANTI-NUKE</span>
          <span>RAID PROTECTION</span>
          <span>AUDITABILITY</span>
        </section>

        <section className="features-section" id="features">
          <div className="section-head">
            <div>
              <p className="section-kicker">THE TOOLKIT</p>
              <h2>Everything your<br /><span>server needs.</span></h2>
            </div>
            <p>
              Axex is built around the things that actually matter when a Discord server gets
              busy: protection, visibility and control.
            </p>
          </div>

          <div className="feature-grid">
            {features.map(([number, title, description]) => (
              <motion.article
                key={number}
                className="feature-card"
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <div className="feature-top"><span>{number}</span><b>AX</b></div>
                <h3>{title}</h3>
                <p>{description}</p>
                <span className="feature-arrow">↗</span>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="workflow-section" id="workflow">
          <div className="section-head workflow-head">
            <div>
              <p className="section-kicker">SIMPLE BY DESIGN</p>
              <h2>From install to<br /><span>protected.</span></h2>
            </div>
            <p>Discord does the identity. Axex handles the server. You stay in control.</p>
          </div>

          <div className="workflow-grid">
            <article><span>01</span><h3>Add Axex</h3><p>Invite Axex to the server you want protected and give it the permissions your selected modules need.</p></article>
            <article><span>02</span><h3>Login with Discord</h3><p>Authorize your identity and server-management access. Axex only uses the data needed for the dashboard.</p></article>
            <article><span>03</span><h3>Run the server</h3><p>Open your server, configure protection and keep an eye on the events that matter.</p></article>
          </div>
        </section>

        <section className="security-section" id="security">
          <div className="security-card">
            <div>
              <p className="section-kicker">SECURITY IS THE PRODUCT</p>
              <h2>Built for people who<br /><span>cannot afford surprises.</span></h2>
              <p className="security-lead">
                Server access is explicit, sensitive credentials stay out of the dashboard, and
                important administrative actions can be traced back to an actor and a time.
              </p>
              <a className="security-cta" href={signInHref}>{signInLabel} <span>↗</span></a>
            </div>
            <div className="security-list">
              <div><span>01</span><strong>Server-scoped access</strong><p>Only servers you can manage are presented for control.</p></div>
              <div><span>02</span><strong>Credential separation</strong><p>The dashboard does not ask you for a bot token.</p></div>
              <div><span>03</span><strong>Traceable changes</strong><p>Administrative changes have an audit trail.</p></div>
              <div><span>04</span><strong>Clear system state</strong><p>Connection and protection status are surfaced directly.</p></div>
            </div>
          </div>
        </section>

        <section className="final-cta">
          <p>AXEX / DISCORD SECURITY</p>
          <h2>Take control of<br /><span>your server.</span></h2>
          <a className="primary-cta" href={signInHref}>{signInLabel} <span>↗</span></a>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="/" className="footer-brand"><span>AX</span> AXEX</a>
        <span>Discord security, moderation and control.</span>
        <a href="#main-content">Back to top ↑</a>
      </footer>
    </div>
  );
}
