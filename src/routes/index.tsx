import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Globe2,
  LockKeyhole,
  Menu,
  MessageCircle,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
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
      { title: "Axex Dashboard — Discord Security Control" },
      {
        name: "description",
        content:
          "Manage your Discord servers, configure Axex security and keep your community protected from one clear control panel.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: ShieldCheck,
    number: "01",
    title: "Server management",
    description: "Keep your Axex-enabled communities organised from one control room.",
    tone: "ember",
  },
  {
    icon: BarChart3,
    number: "02",
    title: "Advanced analytics",
    description: "Read verification activity and understand what is happening in your server.",
    tone: "gold",
  },
  {
    icon: Zap,
    number: "03",
    title: "Real-time security",
    description: "A clearer view of bot connection health and important security activity.",
    tone: "ember",
  },
  {
    icon: Settings,
    number: "04",
    title: "Easy configuration",
    description: "Manage dashboard access and server administration without the clutter.",
    tone: "gold",
  },
];

const steps = [
  {
    number: "01",
    title: "Sign in securely",
    description: "Connect your Discord account to see the servers you are allowed to manage.",
  },
  {
    number: "02",
    title: "Choose a server",
    description: "Open an Axex-enabled server or invite the bot where it is not installed yet.",
  },
  {
    number: "03",
    title: "Take control",
    description: "Review activity, manage dashboard access and keep an eye on server status.",
  },
];

function LandingPage() {
  const { signedIn, connected, error } = Route.useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const authHref = signedIn ? "/api/auth/discord?consent=1" : "/api/auth/discord";
  const signInLabel = signedIn ? "Reconnect Discord" : "Sign in with Discord";
  const closeMenu = () => setMenuOpen(false);

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
    <div className="landing-page" id="home">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <div className="landing-ambient landing-ambient-left" aria-hidden="true" />
      <div className="landing-ambient landing-ambient-right" aria-hidden="true" />

      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Axex home" onClick={closeMenu}>
          <span className="landing-brand-mark">AX</span>
          <span className="landing-brand-copy">
            <strong>AXEX</strong>
            <i />
            <span>DASHBOARD</span>
          </span>
        </a>

        <nav className={menuOpen ? "landing-nav landing-nav-open" : "landing-nav"} aria-label="Main navigation">
          <a className="active" href="#home" onClick={closeMenu}>Home</a>
          <a href="#features" onClick={closeMenu}>Features</a>
          <a href="#guide" onClick={closeMenu}>Guide</a>
          <a href="#support" onClick={closeMenu}>Support</a>
          {signedIn && (
            <a className="landing-mobile-dashboard" href="/servers" onClick={closeMenu}>
              Open dashboard <ArrowUpRight size={15} />
            </a>
          )}
        </nav>

        <div className="landing-header-actions">
          {signedIn && (
            <a className="landing-dashboard-link" href="/servers">
              Dashboard <ArrowUpRight size={14} />
            </a>
          )}
          <a className="landing-header-cta" href={authHref}>
            <MessageCircle size={16} fill="currentColor" strokeWidth={1.7} />
            <span>{signInLabel}</span>
            <ArrowRight size={15} />
          </a>
          <button
            className="landing-menu-button"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="landing-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main id="main-content">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-icon"><ShieldCheck size={15} /></span>
              <span>GLOBAL DISCORD SECURITY</span>
              <i />
              <span className="hero-online">Online</span>
            </div>

            <h1>
              Axex <span>Dashboard</span>
            </h1>
            <h2>Manage your servers, configure Axex and keep your community secure.</h2>
            <p className="hero-description">
              Powerful. Modern. Built for your community. The control panel for your Axex bot,
              designed to keep important server tools clear and close at hand.
            </p>

            {notice && (
              <p className={connected ? "landing-notice success" : "landing-notice"} role="status">
                {connected && <CheckCircle2 size={16} />}
                {notice}
              </p>
            )}

            <div className="landing-actions">
              <a className="landing-primary-button" href={signedIn ? "/servers" : authHref}>
                <Zap size={17} fill="currentColor" />
                <span>{signedIn ? "Open dashboard" : "Get started"}</span>
                <ArrowRight size={17} />
              </a>
              <a className="landing-secondary-button" href="#features">
                <BookOpen size={18} />
                <span>Learn more</span>
              </a>
            </div>

            <div className="landing-assurance">
              <span><i /> Server-focused security</span>
              <b />
              <span><LockKeyhole size={13} /> Discord sign-in</span>
              <b />
              <span>No bot token in dashboard</span>
            </div>
          </div>

          <div className="landing-hero-visual" aria-label="Illustrative Axex dashboard preview">
            <div className="preview-glow" aria-hidden="true" />
            <div className="preview-window">
              <aside className="preview-sidebar">
                <div className="preview-brand">
                  <span>AX</span>
                  <strong>AXEX</strong>
                  <ChevronRight size={13} />
                </div>
                <div className="preview-nav preview-nav-active"><BarChart3 size={14} /> Dashboard</div>
                <div className="preview-nav"><Server size={14} /> Servers</div>
                <div className="preview-nav"><Settings size={14} /> Settings</div>
                <div className="preview-nav"><Activity size={14} /> Audit logs</div>
                <div className="preview-nav"><MessageCircle size={14} /> Support</div>
                <div className="preview-profile">
                  <span className="preview-avatar">AX</span>
                  <span><strong>Server owner</strong><small><i /> Online</small></span>
                  <ChevronRight size={13} />
                </div>
              </aside>

              <div className="preview-main">
                <div className="preview-topline">
                  <span className="preview-breadcrumb"><span>AX</span> / OVERVIEW</span>
                  <span className="preview-operational"><i /> All systems operational</span>
                </div>
                <div className="preview-welcome">
                  <div>
                    <p>CONTROL ROOM <span>/</span> OVERVIEW</p>
                    <h3>Welcome back.</h3>
                    <small>Your Axex workspace at a glance.</small>
                  </div>
                  <span className="preview-live-icon"><ShieldCheck size={17} /></span>
                </div>
                <div className="preview-stat-grid">
                  <div className="preview-stat"><Server size={16} /><strong>06</strong><small>Servers</small></div>
                  <div className="preview-stat"><CheckCircle2 size={16} /><strong>99.9%</strong><small>Uptime</small></div>
                  <div className="preview-stat"><Activity size={16} /><strong>24.7K</strong><small>Events</small></div>
                  <div className="preview-stat"><Users size={16} /><strong>12.3K</strong><small>Members</small></div>
                </div>
                <div className="preview-chart-card">
                  <div className="preview-chart-heading">
                    <span>ACTIVITY OVERVIEW</span>
                    <span>LAST 7 DAYS</span>
                  </div>
                  <svg className="preview-chart" viewBox="0 0 560 118" role="img" aria-label="Decorative activity trend illustration">
                    <defs>
                      <linearGradient id="preview-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ff6a1a" stopOpacity=".28" />
                        <stop offset="100%" stopColor="#ff6a1a" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 87 C25 87 27 49 55 55 S90 95 116 67 S154 25 177 51 S218 88 246 61 S280 40 304 57 S340 95 365 58 S404 22 428 44 S465 90 492 56 S526 43 560 19 L560 118 L0 118Z" fill="url(#preview-area)" />
                    <path d="M0 87 C25 87 27 49 55 55 S90 95 116 67 S154 25 177 51 S218 88 246 61 S280 40 304 57 S340 95 365 58 S404 22 428 44 S465 90 492 56 S526 43 560 19" fill="none" stroke="#ff7a24" strokeWidth="2.5" />
                    <path d="M0 108 H560 M0 70 H560 M0 32 H560" stroke="#ffffff" strokeOpacity=".07" strokeDasharray="4 7" />
                  </svg>
                  <div className="preview-chart-footer">
                    <span><i /> Axex bot online</span>
                    <span>Sample interface preview</span>
                  </div>
                  <div className="preview-figure" aria-hidden="true">
                    <div className="figure-orbit" />
                    <div className="figure-hood" />
                    <div className="figure-head" />
                    <div className="figure-body"><span>A</span></div>
                  </div>
                </div>
                <div className="preview-bottomline">
                  <span><Sparkles size={13} /> A clearer view of your community</span>
                  <span>AXEX CONTROL</span>
                </div>
              </div>
            </div>
            <div className="preview-caption"><span /> Illustrative dashboard preview <i>•</i> Sample data</div>
          </div>
        </section>

        <section className="landing-features" id="features" aria-labelledby="features-title">
          <div className="landing-section-heading">
            <p><span /> BUILT FOR YOUR SERVER <span /></p>
            <h2 id="features-title">Powerful <em>features.</em></h2>
            <span className="landing-section-subtitle">Everything you need to manage Axex like a pro.</span>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="landing-feature" key={feature.number}>
                  <div className={"feature-icon feature-icon-" + feature.tone}>
                    <Icon size={24} strokeWidth={1.9} />
                  </div>
                  <div className="feature-copy">
                    <span className="feature-number">{feature.number} / AXEX</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                  <span className="feature-arrow"><ArrowUpRight size={17} /></span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-proof" aria-label="Axex principles">
          <div className="proof-item">
            <Globe2 size={25} />
            <span><strong>One control room</strong><small>Your Axex servers in one place</small></span>
          </div>
          <div className="proof-divider" />
          <div className="proof-item">
            <Users size={25} />
            <span><strong>Community first</strong><small>Built around Discord servers</small></span>
          </div>
          <div className="proof-divider" />
          <div className="proof-item">
            <Zap size={25} />
            <span><strong>Security focused</strong><small>Clear tools, less clutter</small></span>
          </div>
          <div className="proof-divider" />
          <div className="proof-item">
            <ShieldCheck size={25} />
            <span><strong>Owner controlled</strong><small>Access stays permission-aware</small></span>
          </div>
        </section>

        <section className="landing-guide" id="guide" aria-labelledby="guide-title">
          <div className="guide-intro">
            <p className="landing-section-kicker">GETTING STARTED / 03 STEPS</p>
            <h2 id="guide-title">From sign-in to <em>server control.</em></h2>
            <p>Get into your workspace without a complicated setup flow.</p>
            <a href={signedIn ? "/servers" : authHref} className="guide-link">
              {signedIn ? "Go to your servers" : "Start with Discord"} <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="guide-steps">
            {steps.map((step) => (
              <article className="guide-step" key={step.number}>
                <span className="guide-step-number">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
                <ChevronRight size={18} />
              </article>
            ))}
          </div>
        </section>

        <section className="landing-security" id="support">
          <div className="security-emblem"><ShieldCheck size={27} /></div>
          <div className="security-copy">
            <p className="landing-section-kicker">ACCESS & SECURITY</p>
            <h2>Built to protect.<br /><em>Designed to stay clear.</em></h2>
            <p>
              Sign in with Discord to view servers you can manage. Dashboard access is checked
              against server ownership and the roles granted by the owner.
            </p>
          </div>
          <div className="security-action">
            <span><LockKeyhole size={14} /> Secure Discord sign-in</span>
            <a className="landing-primary-button" href={signedIn ? "/servers" : authHref}>
              {signedIn ? "Open dashboard" : "Continue with Discord"} <ArrowRight size={17} />
            </a>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="/" className="landing-footer-brand">
          <span className="landing-brand-mark">AX</span>
          <strong>AXEX</strong>
        </a>
        <span className="landing-footer-note">Discord security and server control.</span>
        <div className="landing-footer-links">
          <a href="#features">Features</a>
          <a href="#guide">Guide</a>
          <a href="#support">Security</a>
        </div>
        <span className="landing-footer-copy">© {new Date().getFullYear()} Axex</span>
      </footer>
    </div>
  );
}
