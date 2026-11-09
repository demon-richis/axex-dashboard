import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, ChevronDown, Menu, ShieldCheck, X } from "lucide-react";
import { siteConfig } from "../lib/site-config";
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
    ...siteConfig,
  };
});

export const Route = createFileRoute("/")({
  loader: () => loadLanding(),
  head: () => ({
    meta: [
      { title: "Axex — Human checks for Discord communities" },
      {
        name: "description",
        content:
          "Stop fake accounts before they join your server. Axex gives new members a human check and records each decision under a Case ID.",
      },
      { name: "theme-color", content: "#0c0606" },
      { property: "og:title", content: "Axex — Human checks for Discord communities" },
      {
        property: "og:description",
        content: "A human check for every new member, with decisions you can look up by Case ID.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-axex.svg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-axex.svg" },
    ],
    links: [
      { rel: "canonical", href: siteConfig.canonicalUrl },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  component: LandingPage,
});

const logOptions = [
  "Account Intelligence",
  "User Information",
  "Verification Details",
  "Verification Timeline",
  "Network Flags",
];
const details: Record<string, string> = {
  "Account Intelligence": "Account age: 2 days · New account flag: yes",
  "User Information": "Discord user: SampleMember · Server: Axex QA lab",
  "Verification Details": "Turnstile: passed · Attempts: 1 of 3 · Case: 74633148",
  "Verification Timeline": "Joined 14:02 · Checked 14:03 · Decision saved 14:03",
  "Network Flags": "VPN/proxy: not detected · IP checked privately",
};

function AxIcon({ name, label }: { name: string; label: string }) {
  const paths: Record<string, string> = {
    shield: "M12 2 20 5v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3Zm-4 10 2.5 2.5L16 9",
    user: "M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    check: "m5 12 4 4L19 6",
    timer: "M12 8v5l3 2m5-3a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM9 2h6",
    scan: "M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3M7 12h10",
    id: "M4 5h16v14H4zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-2 5a3 3 0 0 1 5 0m2-5h4m-4 4h4",
    warning: "M12 3 2.8 19h18.4L12 3Zm0 6v4m0 3h.01",
    captcha: "M4 4h16v16H4zM8 9h.01M12 9h.01M16 9h.01M8 14h8m-7 3h6",
  };
  return (
    <span className="ax-icon" role="img" aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={paths[name] ?? paths["shield"]} />
      </svg>
    </span>
  );
}

function LandingPage() {
  const {
    signedIn,
    connected,
    error,
    botInviteUrl,
    supportServerUrl,
    dashboardUrl,
    dashboardLive,
    siteName,
  } = Route.useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const authHref = signedIn ? "/api/auth/discord?consent=1" : "/api/auth/discord";
  const notice = connected
    ? "Discord connected."
    : error
      ? error === "permissions"
        ? "Server access denied. Try reconnecting."
        : "Discord sign-in failed. Try again."
      : "";
  const link = (id: string, label: string) => (
    <a href={`#${id}`} onClick={() => setMenuOpen(false)}>
      {label}
    </a>
  );
  return (
    <div className="landing-page" id="home">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="landing-header">
        <a className="brand" href="/" aria-label="Axex home">
          <span className="brand-mark">AX</span>
          <strong>{siteName}</strong>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {link("how-it-works", "How it works")}
          {link("protection", "Protection")}
          {link("roadmap", "Roadmap")}
          {link("faq", "FAQ")}
        </nav>
        <div className="header-actions">
          <a
            className="button button-primary header-cta"
            href={botInviteUrl}
            target="_blank"
            rel="noreferrer"
          >
            Add Axex to Discord <ArrowRight size={16} />
          </a>
          <button
            className="menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {link("how-it-works", "How it works")}
            {link("protection", "Protection")}
            {link("roadmap", "Roadmap")}
            {link("faq", "FAQ")}
          </nav>
        )}
      </header>
      <main id="main-content">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <p className="eyebrow">HUMAN VERIFICATION FOR DISCORD</p>
            <h1>Stop fake accounts before they join your server.</h1>
            <p className="hero-sub">
              Axex gives every new member a human check, puts risky accounts in quarantine, and
              records each decision under a Case ID you can look up.
            </p>
            {notice && (
              <p role="status" className="notice">
                {notice}
              </p>
            )}
            <div className="hero-actions">
              <a
                className="button button-primary"
                href={botInviteUrl}
                target="_blank"
                rel="noreferrer"
              >
                Add Axex to Discord <ArrowRight size={17} />
              </a>
              <a className="button button-secondary" href="#how-it-works">
                See how it works
              </a>
            </div>
            {dashboardLive ? (
              <a className="dashboard-link" href={dashboardUrl}>
                {signedIn ? "Open dashboard" : "Sign in with Discord"}
              </a>
            ) : (
              <span className="dashboard-muted">Dashboard: coming soon</span>
            )}
            <div className="facts">
              <span>Cloudflare Turnstile</span>
              <span>Quarantine, not kick</span>
              <span>Case ID on every decision</span>
            </div>
          </div>
          <div className="product-proof">
            <p className="sample-caption">Sample data · Discord message recreations</p>
            <article className="discord-card verify-card">
              <div className="discord-author">
                <AxIcon name="captcha" label="Verification icon" />
                <span>
                  <b>Axex</b>
                  <small>APP</small>
                </span>
              </div>
              <h2>Verification Required</h2>
              <p>Complete a quick human check to continue into the server.</p>
              <div className="discord-buttons">
                <button type="button" className="verify-btn">
                  Verify
                </button>
                <button type="button" className="how-btn">
                  How it works
                </button>
              </div>
            </article>
            <article className="discord-card log-card">
              <div className="discord-author">
                <AxIcon name="scan" label="Verification log icon" />
                <span>
                  <b>Axex</b>
                  <small>APP · #axex-logs</small>
                </span>
              </div>
              <h2>Verification Success</h2>
              <div className="log-fields">
                <div>
                  <small>User</small>
                  <strong>SampleMember</strong>
                </div>
                <div>
                  <small>Case ID</small>
                  <strong>74633148</strong>
                </div>
                <div>
                  <small>Risk</small>
                  <strong className="risk-clean">CLEAN · 1/100</strong>
                </div>
                <div>
                  <small>Response</small>
                  <strong>2.8 s</strong>
                </div>
              </div>
              <p className="hint">
                Use the menu to inspect this sample record. Look up any case with{" "}
                <code>/verification-log</code>.
              </p>
              <label className="sr-only" htmlFor="log-detail">
                View log details
              </label>
              <div className="select-wrap">
                <select
                  id="log-detail"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">View logs...</option>
                  {logOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" />
              </div>
              {selected && (
                <div className="detail-card" aria-live="polite">
                  <strong>{selected}</strong>
                  <span>{details[selected]}</span>
                </div>
              )}
            </article>
            <article className="discord-card dm-card">
              <div className="discord-author">
                <AxIcon name="check" label="Success icon" />
                <span>
                  <b>Axex</b>
                  <small>DIRECT MESSAGE</small>
                </span>
              </div>
              <h2>Verification Complete</h2>
              <p>You can now return to the server.</p>
              <button type="button" disabled className="disabled-discord">
                — Axex QA lab
              </button>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="content-section section-wrap">
          <div className="section-heading">
            <p className="eyebrow">A short setup</p>
            <h2>From invite to decision.</h2>
            <p>Three steps. Each member check ends with a recorded outcome.</p>
          </div>
          <ol className="steps">
            <li>
              <span>01</span>
              <div>
                <h3>Invite Axex</h3>
                <p>Add the bot to your Discord server.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Run /setup</h3>
                <p>Choose the verification and quarantine channels.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Members verify</h3>
                <p>New members complete a human check in the secure portal.</p>
              </div>
            </li>
          </ol>
          <aside className="scenario">
            <AxIcon name="user" label="Sample member" />
            <div>
              <strong>Sample scenario</strong>
              <p>
                A 2-day-old account joins. Axex flags it, runs the human check, and if it fails
                three times it lands in #quarantine, with the reason saved under Case 74633148.
              </p>
            </div>
          </aside>
        </section>
        <section id="protection" className="content-section protection-section">
          <div className="section-wrap">
            <div className="section-heading">
              <p className="eyebrow">What Axex checks today</p>
              <h2>Signals with a clear response.</h2>
            </div>
            <div className="protection-list">
              <article>
                <span>01</span>
                <div>
                  <h3>Fake and alternate accounts</h3>
                  <p>Every joining member is asked to complete a human check before access.</p>
                </div>
                <b>Human check</b>
              </article>
              <article>
                <span>02</span>
                <div>
                  <h3>Scripts and bots</h3>
                  <p>
                    Turnstile and server-side timing help identify automated verification attempts.
                  </p>
                </div>
                <b>Check and record</b>
              </article>
              <article>
                <span>03</span>
                <div>
                  <h3>VPN or proxy use</h3>
                  <p>
                    Network signals are checked privately; IP addresses are never shown in Discord.
                  </p>
                </div>
                <b>Flag for review</b>
              </article>
              <article>
                <span>04</span>
                <div>
                  <h3>Brand-new accounts</h3>
                  <p>Accounts younger than 7 days are flagged, not kicked.</p>
                </div>
                <b>Flag, not kick</b>
              </article>
              <article>
                <span>05</span>
                <div>
                  <h3>Honeypot and abandoned links</h3>
                  <p>
                    Honeypot activity is recorded. Abandoned links expire automatically and the
                    member receives a DM naming the server.
                  </p>
                </div>
                <b>Record and expire</b>
              </article>
            </div>
          </div>
        </section>
        <section className="content-section section-wrap under-hood">
          <div className="section-heading">
            <p className="eyebrow">Under the hood</p>
            <h2>A human check, then a logged decision.</h2>
          </div>
          <div
            className="flow"
            aria-label="Discord to secure verification portal to decision to role or quarantine to log"
          >
            <span>Discord</span>
            <i>→</i>
            <span>
              Secure portal
              <br />
              <small>login + human check</small>
            </span>
            <i>→</i>
            <span>Decision</span>
            <i>→</i>
            <span>Role or quarantine</span>
            <i>→</i>
            <span>Case log</span>
          </div>
          <p className="cooldown">
            <AxIcon name="timer" label="Cooldown" />
            Members get 3 attempts. After that, a 3-minute cooldown applies, then a 3-hour cooldown.
            A third failure locks verification and sends the member to quarantine, not a kick.
            Limits survive restarts and new links.
          </p>
        </section>
        <section className="content-section privacy-section">
          <div className="section-wrap privacy-content">
            <div>
              <p className="eyebrow">Privacy and trust</p>
              <h2>Private checks. Clear records.</h2>
              <p>
                IPs are checked privately and never shown in Discord. Data is not sold or shared.
                Request data deletion through the support server.
              </p>
            </div>
            <div className="privacy-links">
              <a href="/privacy">
                Privacy policy <ArrowRight size={16} />
              </a>
              <a href="/terms">
                Terms <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
        <section id="roadmap" className="content-section section-wrap roadmap-section">
          <div className="section-heading">
            <p className="eyebrow">Roadmap</p>
            <h2>What is not live yet.</h2>
          </div>
          <div className="roadmap">
            <article>
              <span>Coming soon</span>
              <h3>Web dashboard</h3>
              <p>Setup wizard, settings, logs, and an admin list managed by Discord User ID.</p>
            </article>
            <article>
              <span>Coming soon</span>
              <h3>Anti-nuke protection</h3>
              <p>Mass-ban and channel-delete detection with a server lockdown response.</p>
            </article>
          </div>
        </section>
        <section id="faq" className="content-section section-wrap faq-section">
          <div className="section-heading">
            <p className="eyebrow">FAQ</p>
            <h2>Good to know.</h2>
          </div>
          <div className="faq-list">
            {[
              [
                "Does Axex kick users?",
                "No. A failed check sends the member to quarantine, not a kick.",
              ],
              [
                "What happens after 3 failures?",
                "Verification locks and the member is quarantined. Attempts use a 3-minute cooldown, then a 3-hour cooldown. Limits persist across restarts and new links.",
              ],
              [
                "Does Axex store IPs?",
                "Network signals are checked privately. IP addresses are never shown in Discord. Contact support about data deletion.",
              ],
              [
                "Which permissions does it need?",
                "Axex needs the permissions required to create verification messages, assign the configured member role, and place members in quarantine. Grant only the permissions needed for your setup.",
              ],
              [
                "Who can see logs?",
                "Verification records are posted in your configured #axex-logs channel. Use /verification-log to search by Case ID.",
              ],
              [
                "What if a user closes the link?",
                "The link is marked EXPIRED automatically and the user receives a DM naming the server. They can press Verify again.",
              ],
              ["Does Axex have pricing?", "[PRICING TBD]"],
            ].map(([q, a]) => (
              <details
                key={q}
                aria-expanded={false}
                onToggle={(event) =>
                  event.currentTarget.setAttribute(
                    "aria-expanded",
                    String(event.currentTarget.open),
                  )
                }
              >
                <summary>
                  {q}
                  <ChevronDown aria-hidden="true" />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta section-wrap">
          <div>
            <p className="eyebrow">Ready to start?</p>
            <h2>Give new members a fair check.</h2>
          </div>
          <a className="button button-primary" href={botInviteUrl} target="_blank" rel="noreferrer">
            Add Axex to Discord <ArrowRight size={17} />
          </a>
        </section>
      </main>
      <footer className="footer section-wrap">
        <a className="brand" href="/" aria-label="Axex home">
          <span className="brand-mark">AX</span>
          <strong>Axex</strong>
        </a>
        <nav aria-label="Footer navigation">
          <a href={supportServerUrl} target="_blank" rel="noreferrer">
            Support server
          </a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
        <span>© {new Date().getFullYear()} Axex</span>
      </footer>
    </div>
  );
}
