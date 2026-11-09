import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { MotionConfig, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle2,
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
import { Button } from "../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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
    inviteUrl: process.env["BOT_INVITE_URL"] ?? "https://discord.com/oauth2/authorize",
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
        content: "Discord security, verification and server controls in one dashboard.",
      },
      { property: "og:title", content: "Axex — Discord Security" },
      {
        property: "og:description",
        content: "One dashboard for your Discord security.",
      },
    ],
  }),
  component: LandingPage,
});

const capabilities = [
  {
    icon: Server,
    number: "01",
    title: "Server management",
    tag: "SERVER OPS",
    tone: "red",
    description: "Every connected server, one workspace.",
  },
  {
    icon: Fingerprint,
    number: "02",
    title: "Member verification",
    tag: "IDENTITY",
    tone: "green",
    description: "Verify members before they get access.",
  },
  {
    icon: Radar,
    number: "03",
    title: "Raid detection",
    tag: "THREAT SIGNALS",
    tone: "amber",
    description: "Spot unusual join activity early.",
  },
  {
    icon: UsersRound,
    number: "04",
    title: "Admin & audit",
    tag: "GOVERNANCE",
    tone: "green",
    description: "Control access. Review changes.",
  },
];

const surfaces = [
  {
    icon: Bot,
    title: "Axex bot",
    label: "DISCORD",
    tone: "red",
    description: "Protection inside your server.",
  },
  {
    icon: LayoutDashboard,
    title: "Web dashboard",
    label: "CONTROL",
    tone: "green",
    description: "Server controls in one place.",
  },
  {
    icon: Fingerprint,
    title: "Verification portal",
    label: "MEMBERS",
    tone: "amber",
    description: "A clean member check-in.",
  },
];

const steps = [
  {
    number: "01",
    icon: Bot,
    title: "Invite Axex",
    description: "Add the bot to your Discord server.",
  },
  {
    number: "02",
    icon: LockKeyhole,
    title: "Sign in",
    description: "Connect your Discord account.",
  },
  {
    number: "03",
    icon: SlidersHorizontal,
    title: "Configure",
    description: "Set up your server controls.",
  },
];

const faqs = [
  {
    question: "What is Axex?",
    answer: "A Discord security platform with a bot, dashboard and verification portal.",
  },
  {
    question: "Does it replace Discord?",
    answer: "No. Axex works alongside Discord.",
  },
  {
    question: "Who can access my dashboard?",
    answer:
      "The server owner controls dashboard access. Discord server permissions alone do not grant it.",
  },
  {
    question: "Do I need the bot?",
    answer: "Yes. Add Axex to each server you manage.",
  },
];

const previewModules = [
  {
    icon: Server,
    title: "Server ops",
    detail: "Connected servers",
    state: "Managed",
    tone: "red",
  },
  {
    icon: UsersRound,
    title: "Admin access",
    detail: "Role permissions",
    state: "Controlled",
    tone: "green",
  },
  {
    icon: Fingerprint,
    title: "Verification",
    detail: "Member checks",
    state: "Portal-linked",
    tone: "amber",
  },
  {
    icon: FileClock,
    title: "Audit log",
    detail: "Recent changes",
    state: "Tracked",
    tone: "green",
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
  const { signedIn, connected, error, inviteUrl } = Route.useLoaderData();
  const [menuOpen, setMenuOpen] = useState(false);
  const authHref = signedIn ? "/api/auth/discord?consent=1" : "/api/auth/discord";

  let notice = "";
  if (connected) notice = "Discord connected. Your servers are ready.";
  else if (error === "permissions") notice = "Server access denied. Try reconnecting.";
  else if (error === "state") notice = "Session expired. Sign in again.";
  else if (error) notice = "Discord sign-in failed. Try again.";

  return (
    <MotionConfig reducedMotion="user">
      <div className="landing-page" id="home">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="landing-ambient landing-ambient-red" aria-hidden="true" />
        <div className="landing-ambient landing-ambient-green" aria-hidden="true" />

        <header className="landing-header">
          <a className="landing-brand" href="/" aria-label="Axex home">
            <span className="landing-brand-mark">AX</span>
            <span className="landing-brand-copy">
              <strong>AXEX</strong>
              <i />
              <span>SECURITY</span>
            </span>
          </a>

          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#platform">Platform</a>
            <a href="#security">Protection</a>
            <a href="#how-it-works">Get started</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="landing-header-actions">
            {signedIn ? (
              <a className="landing-dashboard-link" href="/servers">
                Dashboard <ArrowUpRight size={14} />
              </a>
            ) : (
              <a className="landing-signin-link" href={authHref}>
                Sign in
              </a>
            )}
            <Button asChild variant="primary" className="landing-header-cta">
              <a
                href={inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Invite Axex to your Discord server"
              >
                <DiscordMark size={17} />
                <span>Invite Axex</span>
                <ArrowUpRight size={15} />
              </a>
            </Button>

            <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
              <DialogTrigger asChild>
                <button
                  className="landing-menu-button"
                  type="button"
                  aria-label={menuOpen ? "Close navigation" : "Open navigation"}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? <X size={19} /> : <Menu size={19} />}
                </button>
              </DialogTrigger>
              <DialogContent className="landing-mobile-dialog">
                <DialogTitle className="sr-only">Axex navigation</DialogTitle>
                <DialogDescription className="sr-only">
                  Navigate the Axex security platform.
                </DialogDescription>
                <div className="landing-mobile-brand">
                  <span className="landing-brand-mark">AX</span>
                  <strong>AXEX</strong>
                  <span>SECURITY</span>
                </div>
                <nav className="landing-mobile-links" aria-label="Mobile navigation">
                  <DialogClose asChild>
                    <a href="#platform">
                      Platform <ArrowUpRight size={15} />
                    </a>
                  </DialogClose>
                  <DialogClose asChild>
                    <a href="#security">
                      Protection <ArrowUpRight size={15} />
                    </a>
                  </DialogClose>
                  <DialogClose asChild>
                    <a href="#how-it-works">
                      Get started <ArrowUpRight size={15} />
                    </a>
                  </DialogClose>
                  <DialogClose asChild>
                    <a href="#faq">
                      FAQ <ArrowUpRight size={15} />
                    </a>
                  </DialogClose>
                  {signedIn ? (
                    <DialogClose asChild>
                      <a href="/servers" className="mobile-dashboard-link">
                        Open dashboard <ArrowRight size={15} />
                      </a>
                    </DialogClose>
                  ) : (
                    <DialogClose asChild>
                      <a href={authHref} className="mobile-signin-link">
                        Sign in with Discord <ArrowRight size={15} />
                      </a>
                    </DialogClose>
                  )}
                </nav>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main id="main-content">
          <section className="landing-hero" aria-labelledby="hero-title">
            <motion.div
              className="landing-hero-copy"
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, ease: "easeOut" }}
            >
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-icon">
                  <ShieldCheck size={15} />
                </span>
                <span>DISCORD SECURITY</span>
                <span className="hero-security-label">
                  <CheckCircle2 size={13} /> Permission-aware
                </span>
              </div>
              <h1 id="hero-title">
                Discord security.<span> Under control.</span>
              </h1>
              <p className="hero-lede">One dashboard. Every server.</p>
              <p className="hero-description">Manage access, verification and security signals.</p>
              {notice && (
                <p
                  className={connected ? "landing-notice success" : "landing-notice"}
                  role="status"
                >
                  {connected && <CheckCircle2 size={16} />}
                  {notice}
                </p>
              )}
              <div className="landing-actions">
                <Button asChild variant="primary">
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Invite Axex to your Discord server"
                  >
                    <DiscordMark size={17} />
                    <span>Invite Axex</span>
                    <ArrowUpRight size={17} />
                  </a>
                </Button>
              </div>
              <div className="landing-assurance">
                <span>
                  <Check size={13} /> Role-aware access
                </span>
                <b />
                <span>
                  <Check size={13} /> Raid detection
                </span>
                <b />
                <span>
                  <Check size={13} /> Audit trail
                </span>
              </div>
            </motion.div>

            <motion.div
              className="landing-hero-visual"
              role="img"
              aria-label="Illustrative Axex control dashboard preview"
              initial={false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.68, delay: 0.12, ease: "easeOut" }}
            >
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
                  <aside className="preview-sidebar" aria-hidden="true">
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
                        <strong>Workspace</strong>
                        <small>Access controlled</small>
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
                        <span className="preview-kicker">SECURITY OVERVIEW</span>
                        <h3>All servers. One view.</h3>
                        <p>Your security at a glance.</p>
                      </div>
                      <div className="preview-shield">
                        <ShieldCheck size={23} />
                      </div>
                    </div>

                    <div className="preview-module-grid">
                      {previewModules.map((module) => {
                        const Icon = module.icon;
                        return (
                          <div className="preview-module" key={module.title}>
                            <span className={"preview-module-icon " + module.tone}>
                              <Icon size={16} />
                            </span>
                            <strong>{module.title}</strong>
                            <small>{module.detail}</small>
                            <span className={"preview-module-state " + module.tone}>
                              <i /> {module.state}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="preview-security-card">
                      <div className="preview-security-heading">
                        <span>
                          <Activity size={14} /> SECURITY FLOW
                        </span>
                        <span>ILLUSTRATIVE</span>
                      </div>
                      <div className="preview-flow">
                        <div className="preview-flow-node">
                          <span className="preview-flow-icon">
                            <Server size={16} />
                          </span>
                          <span>
                            <strong>Discord</strong>
                            <small>Server activity</small>
                          </span>
                        </div>
                        <ChevronRight size={16} />
                        <div className="preview-flow-node">
                          <span className="preview-flow-icon red">
                            <ShieldCheck size={16} />
                          </span>
                          <span>
                            <strong>Axex</strong>
                            <small>Security layer</small>
                          </span>
                        </div>
                        <ChevronRight size={16} />
                        <div className="preview-flow-node">
                          <span className="preview-flow-icon green">
                            <LayoutDashboard size={16} />
                          </span>
                          <span>
                            <strong>Dashboard</strong>
                            <small>Control panel</small>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="preview-caption">
                <span /> Product preview <i>·</i> Demo data
              </div>
            </motion.div>
          </section>

          <section className="landing-trust-strip" aria-label="Platform principles">
            <span>MADE FOR SERVER ADMINS</span>
            <i />
            <span>
              <LockKeyhole size={14} /> Permission-aware
            </span>
            <i />
            <span>
              <ShieldCheck size={14} /> Security-first
            </span>
            <i />
            <span>
              <FileClock size={14} /> Audit-ready
            </span>
          </section>

          <motion.section
            className="landing-section landing-platform"
            id="platform"
            aria-labelledby="platform-title"
            initial={{ y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
          >
            <div className="section-heading">
              <span className="section-eyebrow">
                <i /> THE PLATFORM
              </span>
              <h2 id="platform-title">
                All your security. <em>One place.</em>
              </h2>
              <p>The essentials, without the clutter.</p>
            </div>
            <div className="capability-grid">
              {capabilities.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    className="capability-card-motion"
                    key={feature.number}
                    initial={{ y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.42, delay: index * 0.07, ease: "easeOut" }}
                  >
                    <Card className="capability-card">
                      <CardHeader className="capability-card-header">
                        <div className="capability-card-top">
                          <span className={"capability-icon " + feature.tone}>
                            <Icon size={21} />
                          </span>
                          <span className="capability-number">{feature.number}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={"capability-tag capability-tag-" + feature.tone}
                        >
                          {feature.tag}
                        </Badge>
                      </CardHeader>
                      <CardContent className="capability-card-content">
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                        <span className="capability-rule" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            className="landing-ecosystem"
            id="security"
            aria-labelledby="ecosystem-title"
            initial={{ y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.14 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
          >
            <div className="ecosystem-copy">
              <span className="section-eyebrow">
                <i /> CONNECTED TOGETHER
              </span>
              <h2 id="ecosystem-title">
                One system. <em>Three surfaces.</em>
              </h2>
              <p>Bot, dashboard, portal. Working together.</p>
              <a className="text-link" href="#how-it-works">
                View setup steps <ArrowUpRight size={15} />
              </a>
            </div>
            <div className="ecosystem-stack">
              {surfaces.map((surface) => {
                const Icon = surface.icon;
                return (
                  <article className="ecosystem-card" key={surface.title}>
                    <span className={"ecosystem-icon " + surface.tone}>
                      <Icon size={21} />
                    </span>
                    <div className="ecosystem-card-copy">
                      <span>{surface.label}</span>
                      <h3>{surface.title}</h3>
                      <p>{surface.description}</p>
                    </div>
                    <ArrowUpRight size={17} />
                  </article>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            className="landing-section landing-workflow"
            id="how-it-works"
            aria-labelledby="workflow-title"
            initial={{ y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.14 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
          >
            <div className="section-heading">
              <span className="section-eyebrow">
                <i /> GET STARTED
              </span>
              <h2 id="workflow-title">
                Get started. <em>In three steps.</em>
              </h2>
              <p>Invite Axex, connect Discord, and configure your server.</p>
            </div>
            <div className="workflow-grid">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <article className="workflow-step" key={step.number}>
                    <div className="workflow-step-top">
                      <span>{step.number}</span>
                      <Icon size={21} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            className="landing-faq"
            id="faq"
            aria-labelledby="faq-title"
            initial={{ y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.14 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
          >
            <div className="faq-intro">
              <span className="section-eyebrow">
                <i /> FAQ
              </span>
              <h2 id="faq-title">Good to know.</h2>
              <p>The essentials, answered.</p>
            </div>
            <Accordion type="single" collapsible className="faq-accordion">
              {faqs.map((faq, index) => (
                <AccordionItem value={"faq-" + index} key={faq.question}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>
                    <p>{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.section>

          <motion.section
            className="landing-final-cta"
            initial={{ y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <div className="final-cta-icon">
              <ShieldCheck size={25} />
            </div>
            <div className="final-cta-copy">
              <span className="section-eyebrow">AXEX SECURITY</span>
              <h2>Ready to take control?</h2>
              <p>Connect Discord. Open your dashboard.</p>
            </div>
            <Button asChild variant="primary" className="final-cta-button">
              <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                <DiscordMark size={16} />
                <span>Invite Axex</span>
                <ArrowUpRight size={16} />
              </a>
            </Button>
          </motion.section>
        </main>

        <footer className="landing-footer" aria-label="Site footer">
          <div className="landing-footer-main">
            <a className="landing-footer-brand" href="#home" aria-label="Axex home">
              <span className="landing-brand-mark">AX</span>
              <strong>AXEX</strong>
            </a>
            <p className="landing-footer-note">Security tools for Discord communities.</p>
            <nav className="landing-footer-links" aria-label="Footer navigation">
              <a href="#platform">Platform</a>
              <a href="#security">Protection</a>
              <a href="#how-it-works">Setup</a>
              <a href="#faq">FAQ</a>
              <a className="landing-footer-top" href="#home">
                Back to top <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </nav>
          </div>
          <div className="landing-footer-bottom">
            <p className="landing-footer-copy">
              © {new Date().getFullYear()} Axex. All rights reserved.
            </p>
            <span className="landing-footer-caption">Discord security, under control.</span>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
