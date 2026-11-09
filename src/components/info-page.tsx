import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import "../components/dashboard.css";
import "../components/landing.css";

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  reviewed?: string;
  children: ReactNode;
};

export function InfoPage({
  eyebrow,
  title,
  description,
  reviewed = "Technical notes reviewed 9 November 2026",
  children,
}: InfoPageProps) {
  return (
    <div className="landing-page info-page" id="home">
      <a className="skip-link" href="#info-content">
        Skip to content
      </a>
      <header className="landing-header info-header">
        <a className="landing-brand" href="/" aria-label="Axex home">
          <span className="landing-brand-mark">AX</span>
          <span className="landing-brand-copy">
            <strong>AXEX</strong>
            <i />
            <span>Security</span>
          </span>
        </a>
        <nav className="landing-nav info-nav" aria-label="Documentation navigation">
          <a href="/docs">Docs</a>
          <a href="/permissions">Permissions</a>
          <a href="/privacy">Privacy</a>
          <a href="/status">Status</a>
        </nav>
        <div className="landing-header-actions info-header-actions">
          <a className="landing-secondary-button" href="/">
            <ArrowLeft size={15} /> Website
          </a>
          <a className="landing-primary-button" href="/servers">
            Open dashboard <ArrowUpRight size={15} />
          </a>
        </div>
      </header>

      <main className="info-main" id="info-content">
        <div className="info-title-block">
          <span className="section-eyebrow">
            <i /> {eyebrow}
          </span>
          <h1>{title}</h1>
          <p>{description}</p>
          <span className="info-reviewed">{reviewed}</span>
        </div>
        <div className="info-content">{children}</div>
        <section className="info-help">
          <span className="info-help-icon">
            <ShieldCheck size={22} />
          </span>
          <div>
            <h2>Need help with an installation?</h2>
            <p>
              Share a reproducible issue without posting tokens, member details or private case
              data.
            </p>
          </div>
          <a
            className="landing-secondary-button"
            href="https://github.com/demon-richis/axex-dashboard/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact support <ArrowUpRight size={14} />
          </a>
        </section>
      </main>

      <footer className="info-footer">
        <span>© {new Date().getFullYear()} Axex</span>
        <nav aria-label="Policy navigation">
          <a href="/docs">Docs</a>
          <a href="/privacy">Privacy & data</a>
          <a href="/terms">Terms</a>
          <a href="/status">Status</a>
          <a
            href="https://github.com/demon-richis/axex-dashboard/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support
          </a>
        </nav>
      </footer>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="info-section">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
