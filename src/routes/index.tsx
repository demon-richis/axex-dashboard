import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { LoadingSkeleton } from "../components/loading-skeleton";
import { HeroDiorama } from "../components/hero-diorama";
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
      { title: "Axex — Clear control for your Discord servers" },
      {
        name: "description",
        content:
          "See when Axex last checked in, set owner-defined dashboard access, and review administrative changes in one secure place.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { signedIn, error } = Route.useLoaderData();
  const signInHref = signedIn ? "/servers" : "/api/auth/discord";
  const signInLabel = signedIn ? "Open your dashboard" : "Login with Discord";

  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="landing-header" id="top">
        <a className="brand" href="/" aria-label="Axex Dashboard home">
          <span className="brand-mark" aria-hidden="true">
            AX
          </span>
          <span className="wordmark">
            AXEX <span className="brand-divider">/</span> CONTROL
          </span>
        </a>

        <nav className="landing-nav" aria-label="Main navigation">
          <a href="#capabilities">What you can see</a>
          <a href="#how-it-works">How access works</a>
          <a href="#security">Security</a>
        </nav>

        <details className="landing-mobile-menu">
          <summary aria-label="Open site navigation">
            <span>Menu</span>
            <span className="menu-glyph" aria-hidden="true">
              +
            </span>
          </summary>
          <nav className="mobile-menu-panel" aria-label="Mobile navigation">
            <a
              href="#capabilities"
              onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            >
              What you can see
            </a>
            <a
              href="#how-it-works"
              onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            >
              How access works
            </a>
            <a
              href="#security"
              onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
            >
              Security
            </a>
          </nav>
        </details>

        <a className="header-cta" href={signInHref}>
          <span>{signedIn ? "Dashboard" : "Sign in"}</span>
          <ArrowIcon />
        </a>
      </header>

      <main id="main-content">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span className="eyebrow-mark" />
              <span>AXEX SERVER CONTROL</span>
              <span className="hero-kicker-note">01 — OWNER OPERATED</span>
            </div>
            <h1 id="landing-title">
              Safer servers.
              <br />
              <em>Clearer control.</em>
            </h1>
            <p className="hero-description">
              Know when Axex last checked in. Decide who can use your dashboard. See the changes
              that matter—without the noise.
            </p>
            {error && (
              <div className="inline-alert" role="status" aria-live="polite">
                {error === "state"
                  ? "Sign-in expired. Please try again."
                  : "Discord sign-in didn’t finish. Please try again."}
              </div>
            )}
            <div className="hero-actions">
              <a className="login-button" href={signInHref}>
                <span>{signInLabel}</span>
                <ArrowIcon />
              </a>
              <a className="text-link" href="#capabilities">
                See what’s inside <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="hero-assurance">
              <span className="assurance-mark" aria-hidden="true">
                <ShieldIcon />
              </span>
              <span>
                Discord confirms your identity only.
                <br />
                The dashboard never stores a bot token.
              </span>
            </div>
          </div>

          <div className="hero-visual-wrap">
            <HeroDiorama />
            <p className="visual-caption">
              <span>THE ACCESS MODEL</span>
              <span>IDENTITY → OWNER RULES → SERVER</span>
            </p>
          </div>

          <div className="hero-bottomline" aria-label="Product principles">
            <span>
              <b>01</b> Identity, kept minimal
            </span>
            <span>
              <b>02</b> Roles, set by the owner
            </span>
            <span>
              <b>03</b> Changes, recorded
            </span>
          </div>
        </section>

        <section
          className="capabilities-section"
          id="capabilities"
          aria-labelledby="capabilities-title"
        >
          <div className="section-shell">
            <div className="landing-section-heading capabilities-heading">
              <p className="section-eyebrow">
                <span>THE CONTROL ROOM</span>
                <span>01 / 03</span>
              </p>
              <h2 id="capabilities-title">
                The useful signals.
                <br />
                <em>Nothing extra.</em>
              </h2>
              <p>
                Axex brings the server details owners need into one calm, readable place—not another
                maze of bot settings.
              </p>
            </div>

            <div className="capability-list">
              <article className="capability-item">
                <div className="capability-topline">
                  <span>01</span>
                  <CapabilityIcon name="signal" />
                </div>
                <h3>Know Axex is there</h3>
                <p>
                  See connected or offline status from the bot’s last heartbeat, with a clear “last
                  seen” time when it is stale.
                </p>
                <span className="capability-foot">BOT PRESENCE / HEARTBEAT</span>
              </article>
              <article className="capability-item">
                <div className="capability-topline">
                  <span>02</span>
                  <CapabilityIcon name="access" />
                </div>
                <h3>Choose who can manage</h3>
                <p>
                  The server owner can register dashboard admins and viewers by Discord User ID.
                  Access follows the dashboard’s owner list—not Discord role permissions.
                </p>
                <span className="capability-foot">OWNER / ADMIN / VIEWER</span>
              </article>
              <article className="capability-item">
                <div className="capability-topline">
                  <span>03</span>
                  <CapabilityIcon name="audit" />
                </div>
                <h3>Keep a useful record</h3>
                <p>
                  Admin additions, removals, and role changes appear in a filterable audit log with
                  actor, target, and time.
                </p>
                <span className="capability-foot">ACCESS CHANGES / AUDIT LOG</span>
              </article>
            </div>
          </div>
        </section>

        <section className="workflow-section" id="how-it-works" aria-labelledby="workflow-title">
          <div className="section-shell">
            <div className="workflow-intro">
              <div>
                <p className="section-eyebrow">
                  <span>BUILT AROUND OWNERSHIP</span>
                  <span>02 / 03</span>
                </p>
                <h2 id="workflow-title">
                  Access has a<br />
                  <em>clear path.</em>
                </h2>
              </div>
              <p className="workflow-summary">
                No Discord permission guesswork. The dashboard checks its own server-owner and
                registered-admin records every time someone opens a server view.
              </p>
            </div>

            <ol className="workflow-steps">
              <li>
                <span className="step-number">01</span>
                <h3>Confirm identity</h3>
                <p>
                  Sign in with Discord’s <code>identify</code> scope. Axex receives no guild-list
                  permission.
                </p>
              </li>
              <li>
                <span className="step-number">02</span>
                <h3>Set the roster</h3>
                <p>
                  The owner adds trusted people by User ID and chooses admin or read-only viewer.
                </p>
              </li>
              <li>
                <span className="step-number">03</span>
                <h3>Review the record</h3>
                <p>
                  Check the bot heartbeat and see administrative access changes in the audit log.
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section className="security-section" id="security" aria-labelledby="security-title">
          <div className="section-shell security-shell">
            <div className="security-copy">
              <p className="section-eyebrow">
                <span>SECURITY, BY DESIGN</span>
                <span>03 / 03</span>
              </p>
              <h2 id="security-title">
                Your bot stays
                <br />
                <em>yours.</em>
              </h2>
              <p>
                Axex Dashboard is an identity and administration surface. It is not a place for bot
                credentials, broad Discord permissions, or hidden access rules.
              </p>
              <a className="security-link" href={signInHref}>
                {signInLabel}
                <ArrowIcon />
              </a>
            </div>
            <ul className="security-points">
              <li>
                <span className="security-check">
                  <CheckIcon />
                </span>
                <span>
                  <strong>Identity only</strong>
                  <small>Discord OAuth requests the `identify` scope.</small>
                </span>
              </li>
              <li>
                <span className="security-check">
                  <CheckIcon />
                </span>
                <span>
                  <strong>No dashboard bot token</strong>
                  <small>The dashboard never asks for or stores your bot token.</small>
                </span>
              </li>
              <li>
                <span className="security-check">
                  <CheckIcon />
                </span>
                <span>
                  <strong>Owner-defined access</strong>
                  <small>Owner, admin, and viewer rules are checked from the database.</small>
                </span>
              </li>
              <li>
                <span className="security-check">
                  <CheckIcon />
                </span>
                <span>
                  <strong>Traceable changes</strong>
                  <small>Dashboard access changes are written to the audit log.</small>
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <div className="closing-mark" aria-hidden="true">
            AX
          </div>
          <div>
            <p className="section-eyebrow">A CLEARER VIEW STARTS HERE</p>
            <h2 id="closing-title">
              Keep control
              <br className="mobile-break" /> close.
            </h2>
          </div>
          <a className="closing-cta" href={signInHref}>
            {signInLabel}
            <ArrowIcon />
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="footer-brand" href="/" aria-label="Axex Dashboard home">
          <span className="footer-mark">AX</span>
          <span>
            AXEX <i>/</i> SERVER CONTROL
          </span>
        </a>
        <span className="footer-note">Built for the people who keep communities safe.</span>
        <a className="footer-top" href="#top">
          Back to top ↑
        </a>
      </footer>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="arrow-icon" fill="none">
      <path
        d="M4 10h11M10 4l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m8.5 12 2.2 2.2 4.7-4.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="m4 10 4 4 8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CapabilityIcon({ name }: { name: "signal" | "access" | "audit" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="capability-icon">
      {name === "signal" && (
        <path
          d="M2.5 12h4l3-6.5 5 13 3.5-8 3.5 1.5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {name === "access" && (
        <>
          <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M3.5 20v-1.2c0-2.6 2.1-4.6 4.6-4.6h1.8c2.5 0 4.6 2 4.6 4.6V20M17 8h4M19 6v4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
      {name === "audit" && (
        <>
          <path
            d="M5 3.5h9l5 5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M14 4v5h5M8 13h8M8 16.5h8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
