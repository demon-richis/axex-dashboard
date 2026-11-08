import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileClock,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Network,
  Radar,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  X,
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
      { title: "Axex — Discord Security Control Platform" },
      {
        name: "description",
        content:
          "Protect and manage your Discord communities with Axex: server operations, member verification, raid awareness, and permission-aware administration.",
      },
      { property: "og:title", content: "Axex — Discord Security Control Platform" },
      {
        property: "og:description",
        content: "One connected control plane for your Discord security and server operations.",
      },
    ],
  }),
  component: LandingPage,
});

const capabilities = [
  {
    icon: Server,
    number: "01",
    title: "Server operations",
    tag: "CONTROL",
    tone: "red",
    description:
      "Keep connected communities in one workspace. Move between servers and reach the controls that matter.",
  },
  {
    icon: Fingerprint,
    number: "02",
    title: "Member verification",
    tag: "IDENTITY",
    tone: "green",
    description:
      "Connect members to a structured verification flow before they receive access to your community.",
  },
  {
    icon: Radar,
    number: "03",
    title: "Raid awareness",
    tag: "DETECTION",
    tone: "amber",
    description:
      "Watch join patterns and surface unusual bursts with raid-aware signals for your server team.",
  },
  {
    icon: UsersRound,
    number: "04",
    title: "Access and audit",
    tag: "GOVERNANCE",
    tone: "green",
    description:
      "Keep dashboard access permission-aware, with admin management and a history of important changes.",
  },
];

const surfaces = [
  {
    icon: Bot,
    title: "Axex bot",
    label: "INSIDE DISCORD",
    tone: "red",
    description: "Security workflows and server operations where your community already lives.",
  },
  {
    icon: LayoutDashboard,
    title: "Web dashboard",
    label: "CONTROL PLANE",
    tone: "green",
    description: "A focused workspace for connected servers, administrators, and audit history.",
  },
  {
    icon: Fingerprint,
    title: "Verification portal",
    label: "MEMBER EXPERIENCE",
    tone: "amber",
    description: "A dedicated verification experience connected to your Discord server workflow.",
  },
];

const steps = [
  {
    number: "01",
    icon: LockKeyhole,
    title: "Connect your Discord",
    description:
      "Sign in with Discord. Axex uses your authorised identity to determine which servers you can manage.",
  },
  {
    number: "02",
    icon: Network,
    title: "Choose a community",
    description:
      "Open a server where Axex is already installed, or add the bot to a new community.",
  },
  {
    number: "03",
    icon: SlidersHorizontal,
    title: "Manage with clarity",
    description:
      "Use available server controls, manage dashboard access, and review important changes.",
  },
];

const faqs = [
  {
    question: "What is Axex?",
    answer:
      "Axex is a Discord security platform that connects a Discord bot, a web dashboard, and a dedicated verification experience for server operators.",
  },
  {
    question: "Do I need to install the Axex bot?",
    answer:
      "Yes. Add Axex to the Discord server you want to manage. Servers where the bot is already installed appear in your connected server list when your Discord permissions allow access.",
  },
  {
    question: "Who can access a server dashboard?",
    answer:
      "Access is checked against your Discord identity and the server-level permissions configured for the dashboard. You only see server workspaces you are authorised to manage.",
  },
  {
    question: "Does the dashboard replace Discord?",
    answer:
      "No. Axex complements Discord. The bot handles server-side workflows, while the dashboard provides a dedicated place for supported management and audit tasks.",
  },
];

function DiscordMark({ size = 17 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.393-.4063-.8742-.6264-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.069.069 0 0 0-.0321.0276C.5334 9.0468-.319 13.5798.0993 18.057a.0824.0824 0 0 0 .0312.0567c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0781.0781 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2738-.5508-1.8722-.9095a.077.077 0 0 1-.0076-.1277c.1258-.094.2517-.1918.3718-.2898a.0743.0743 0 0 1 .0776-.0106c3.9278 1.7933 8.18 1.7933 12.061 0a.074.074 0 0 1 .0785.0094c.1201.098.246.197.3737.291a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.9086.0766.0766 0 0 0-.0407.1066c.3604.6978.7719 1.3626 1.225 1.9932a.076.076 0 0 0 .0842.0285c1.961-.6066 3.9495-1.5218 6.0023-3.0294a.077.077 0 0 0 .0312-.0558c.5004-5.177-.8382-9.6707-3.5485-13.66a.061.061 0 0 0-.0312-.0276ZM8.02 15.331c-1.1825 0-2.1569-1.0857-2.1569-2.419s.955-2.419 2.1569-2.419c1.2113 0 2.176.095 2.1569 2.419 0 1.3333-.955 2.419-2.1569 2.419Zm7.9747 0c-1.1826 0-2.1569-1.0857-2.1569-2.419s.955-2.419 2.1569-2.419c1.2113 0 2.176.095 2.1569 2.419 0 1.3333-.955 2.419-2.1569 2.419Z" />
    </svg>
  );
}

function LandingPage() {
  const { signedIn, connected, error } = Route.useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const authHref = signedIn ? "/api/auth/discord?consent=1" : "/api/auth/discord";
  const signInLabel = signedIn ? "Reconnect Discord" : "Sign in with Discord";
  const primaryLabel = signedIn ? "Open dashboard" : "Get started with Discord";
  const closeMenu = () => setMenuOpen(false);

  let notice = "";
  if (connected) notice = "Discord access updated. Your server list is ready.";
  else if (error === "permissions")
    notice = "Server access was not approved. Reconnect Discord and approve the requested access.";
  else if (error === "state") notice = "Your sign-in session expired. Please try again.";
  else if (error) notice = "Discord sign-in did not finish. Please try again.";

  return (
    <div className="landing-page" id="home">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="landing-ambient landing-ambient-red" aria-hidden="true" />
      <div className="landing-ambient landing-ambient-green" aria-hidden="true" />

      <header className="landing-header">
        <a className="landing-brand" href="/" aria-label="Axex home" onClick={closeMenu}>
          <span className="landing-brand-mark">AX</span>
          <span className="landing-brand-copy">
            <strong>AXEX</strong>
            <i />
            <span>SECURITY PLATFORM</span>
          </span>
        </a>
        <nav
          id="landing-navigation"
          className={menuOpen ? "landing-nav landing-nav-open" : "landing-nav"}
          aria-label="Main navigation"
        >
          <a href="#platform" onClick={closeMenu}>
            Platform
          </a>
          <a href="#security" onClick={closeMenu}>
            Security
          </a>
          <a href="#how-it-works" onClick={closeMenu}>
            How it works
          </a>
          <a href="#faq" onClick={closeMenu}>
            FAQ
          </a>
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
          <a className="landing-header-cta" href={authHref} aria-label={signInLabel}>
            <DiscordMark size={17} />
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
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-copy">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-icon">
                <ShieldCheck size={15} />
              </span>
              <span>DISCORD SECURITY CONTROL PLANE</span>
              <span className="hero-security-label">
                <CheckCircle2 size={13} /> Permission-aware
              </span>
            </div>
            <h1 id="hero-title">
              Discord security.<span> Under control.</span>
            </h1>
            <p className="hero-lede">
              Protect your community. Manage every server from one secure control room.
            </p>
            <p className="hero-description">
              Axex connects server operations, member verification, raid awareness, and
              permission-aware administration in one focused platform.
            </p>
            {notice && (
              <p className={connected ? "landing-notice success" : "landing-notice"} role="status">
                {connected && <CheckCircle2 size={16} />}
                {notice}
              </p>
            )}
            <div className="landing-actions">
              <a className="landing-primary-button" href={signedIn ? "/servers" : authHref}>
                <DiscordMark size={17} />
                <span>{primaryLabel}</span>
                <ArrowRight size={17} />
              </a>
              <a className="landing-secondary-button" href="#platform">
                <span>Explore the platform</span>
                <ArrowUpRight size={17} />
              </a>
            </div>
            <div className="landing-assurance">
              <span>
                <Check size={13} /> Discord-native workflows
              </span>
              <b />
              <span>
                <Check size={13} /> Role-aware access
              </span>
              <b />
              <span>
                <Check size={13} /> Server-level control
              </span>
            </div>
          </div>

          <div className="landing-hero-visual" aria-label="Illustrative Axex control plane preview">
            <div className="preview-orbit preview-orbit-one" aria-hidden="true" />
            <div className="preview-orbit preview-orbit-two" aria-hidden="true" />
            <div className="preview-window">
              <div className="preview-window-bar">
                <div className="preview-product-brand">
                  <span className="preview-product-mark">AX</span>
                  <span>
                    AXEX <i>/</i> CONTROL
                  </span>
                </div>
                <span className="preview-demo-label">
                  <i /> PRODUCT PREVIEW
                </span>
              </div>
              <div className="preview-content">
                <aside className="preview-sidebar">
                  <span className="preview-sidebar-label">WORKSPACE</span>
                  <div className="preview-side-item active">
                    <LayoutDashboard size={15} /> Overview
                  </div>
                  <div className="preview-side-item">
                    <Server size={15} /> Servers
                  </div>
                  <div className="preview-side-item">
                    <UsersRound size={15} /> Admins
                  </div>
                  <div className="preview-side-item">
                    <FileClock size={15} /> Audit log
                  </div>
                  <div className="preview-sidebar-bottom">
                    <span className="preview-avatar">AX</span>
                    <span>
                      <strong>Server workspace</strong>
                      <small>Role-aware access</small>
                    </span>
                  </div>
                </aside>
                <div className="preview-main">
                  <div className="preview-main-top">
                    <span>
                      WORKSPACE <i>/</i> OVERVIEW
                    </span>
                    <span className="preview-access">
                      <LockKeyhole size={11} /> ACCESS CONTROLLED
                    </span>
                  </div>
                  <div className="preview-greeting">
                    <div>
                      <span className="preview-kicker">SECURITY CONTROL PLANE</span>
                      <h3>Your servers. One view.</h3>
                      <p>A clearer picture of the tools available to your team.</p>
                    </div>
                    <div className="preview-shield">
                      <ShieldCheck size={23} />
                    </div>
                  </div>
                  <div className="preview-module-grid">
                    <div className="preview-module">
                      <span className="preview-module-icon red">
                        <Server size={16} />
                      </span>
                      <strong>Server operations</strong>
                      <small>Connected communities</small>
                      <span className="preview-module-state">
                        <i /> Workspace
                      </span>
                    </div>
                    <div className="preview-module">
                      <span className="preview-module-icon green">
                        <UsersRound size={16} />
                      </span>
                      <strong>Admin access</strong>
                      <small>Role-aware permissions</small>
                      <span className="preview-module-state green">
                        <i /> Managed access
                      </span>
                    </div>
                    <div className="preview-module">
                      <span className="preview-module-icon amber">
                        <Fingerprint size={16} />
                      </span>
                      <strong>Verification</strong>
                      <small>Member onboarding flow</small>
                      <span className="preview-module-state amber">
                        <i /> Portal-linked
                      </span>
                    </div>
                    <div className="preview-module">
                      <span className="preview-module-icon green">
                        <FileClock size={16} />
                      </span>
                      <strong>Audit history</strong>
                      <small>Important admin changes</small>
                      <span className="preview-module-state green">
                        <i /> Traceable
                      </span>
                    </div>
                  </div>
                  <div className="preview-security-card">
                    <div className="preview-security-heading">
                      <span>
                        <Activity size={14} /> SERVER SECURITY WORKFLOW
                      </span>
                      <span>ILLUSTRATIVE</span>
                    </div>
                    <div className="preview-flow">
                      <div className="preview-flow-node">
                        <span className="preview-flow-icon">
                          <Server size={16} />
                        </span>
                        <span>
                          <strong>Discord server</strong>
                          <small>Community activity</small>
                        </span>
                      </div>
                      <ChevronRight size={16} />
                      <div className="preview-flow-node">
                        <span className="preview-flow-icon red">
                          <ShieldCheck size={16} />
                        </span>
                        <span>
                          <strong>Axex security</strong>
                          <small>Signals and workflows</small>
                        </span>
                      </div>
                      <ChevronRight size={16} />
                      <div className="preview-flow-node">
                        <span className="preview-flow-icon green">
                          <LayoutDashboard size={16} />
                        </span>
                        <span>
                          <strong>Control plane</strong>
                          <small>Team visibility</small>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="preview-caption">
              <span /> Illustrative product interface <i>·</i> Not live server data
            </div>
          </div>
        </section>

        <section className="landing-trust-strip" aria-label="Platform principles">
          <span>BUILT FOR DISCORD OPERATORS</span>
          <i />
          <span>
            <LockKeyhole size={14} /> Permission-aware
          </span>
          <i />
          <span>
            <ShieldCheck size={14} /> Security focused
          </span>
          <i />
          <span>
            <FileClock size={14} /> Audit conscious
          </span>
        </section>

        <section
          className="landing-section landing-platform"
          id="platform"
          aria-labelledby="platform-title"
        >
          <div className="section-heading">
            <span className="section-eyebrow">
              <i /> THE AXEX PLATFORM
            </span>
            <h2 id="platform-title">
              The tools behind a <em>safer community.</em>
            </h2>
            <p>Security operations should feel connected, understandable, and easy to manage.</p>
          </div>
          <div className="capability-grid">
            {capabilities.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="capability-card" key={feature.number}>
                  <div className="capability-card-top">
                    <span className={"capability-icon " + feature.tone}>
                      <Icon size={21} />
                    </span>
                    <span className="capability-number">{feature.number}</span>
                  </div>
                  <span className="capability-tag">{feature.tag}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <span className="capability-rule" />
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-ecosystem" id="security" aria-labelledby="ecosystem-title">
          <div className="ecosystem-copy">
            <span className="section-eyebrow">
              <i /> ONE CONNECTED ECOSYSTEM
            </span>
            <h2 id="ecosystem-title">
              Discord is where your community lives. <em>Axex connects the control.</em>
            </h2>
            <p>
              The bot, the dashboard, and the verification experience each have a clear role.
              Together, they give server teams a more organised way to operate.
            </p>
            <a className="text-link" href="#how-it-works">
              See how it works <ArrowRight size={16} />
            </a>
          </div>
          <div className="ecosystem-stack">
            {surfaces.map((surface, index) => {
              const Icon = surface.icon;
              return (
                <article
                  className={"ecosystem-card ecosystem-card-" + surface.tone}
                  key={surface.title}
                >
                  <span className="ecosystem-icon">
                    <Icon size={22} />
                  </span>
                  <div className="ecosystem-card-copy">
                    <span>{surface.label}</span>
                    <h3>{surface.title}</h3>
                    <p>{surface.description}</p>
                  </div>
                  <span className="ecosystem-index">0{index + 1}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="landing-section landing-workflow"
          id="how-it-works"
          aria-labelledby="workflow-title"
        >
          <div className="section-heading">
            <span className="section-eyebrow">
              <i /> GET STARTED IN THREE STEPS
            </span>
            <h2 id="workflow-title">
              From Discord sign-in to <em>server control.</em>
            </h2>
            <p>Start with the communities you manage. Keep the rest permission-aware.</p>
          </div>
          <div className="workflow-grid">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article className="workflow-step" key={step.number}>
                  <div className="workflow-step-top">
                    <span>{step.number}</span>
                    <Icon size={20} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="landing-faq" id="faq" aria-labelledby="faq-title">
          <div className="faq-intro">
            <span className="section-eyebrow">
              <i /> GOOD TO KNOW
            </span>
            <h2 id="faq-title">
              Questions, <em>answered.</em>
            </h2>
            <p>What to expect when you bring Axex into your server workflow.</p>
          </div>
          <div className="faq-list">
            {faqs.map((item, index) => (
              <details className="faq-item" key={item.question} open={index === 0}>
                <summary>
                  <span>{item.question}</span>
                  <ChevronDown size={17} />
                </summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="final-cta-glow" aria-hidden="true" />
          <div className="final-cta-icon">
            <ShieldCheck size={26} />
          </div>
          <div className="final-cta-copy">
            <span className="section-eyebrow">
              <i /> YOUR SERVER. YOUR CONTROL.
            </span>
            <h2>
              Bring your server operations <em>together.</em>
            </h2>
            <p>Connect Discord and open your Axex workspace.</p>
          </div>
          <a
            className="landing-primary-button final-cta-button"
            href={signedIn ? "/servers" : authHref}
          >
            {signedIn ? "Open your dashboard" : "Continue with Discord"}
            <ArrowRight size={17} />
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <a href="/" className="landing-footer-brand">
          <span className="landing-brand-mark">AX</span>
          <strong>AXEX</strong>
        </a>
        <span className="landing-footer-note">Discord security control platform.</span>
        <div className="landing-footer-links">
          <a href="#platform">Platform</a>
          <a href="#security">Security</a>
          <a href="#faq">FAQ</a>
        </div>
        <span className="landing-footer-copy">© {new Date().getFullYear()} Axex</span>
      </footer>
    </div>
  );
}
