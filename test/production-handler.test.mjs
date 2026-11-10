import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";

let child;
let baseUrl;
async function unusedPort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  await new Promise((resolve) => server.close(resolve));
  return address.port;
}

after(() => {
  child?.kill("SIGTERM");
});

test("built SSR handler returns 200 HTML with nonce attributes matching its CSP", async () => {
  const port = await unusedPort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["server.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOST: "127.0.0.1",
      DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
      SESSION_SECRET: "test-only-session-secret-that-is-at-least-32-chars",
      DISCORD_CLIENT_ID: "test-client",
      DISCORD_CLIENT_SECRET: "test-client-secret",
      DISCORD_REDIRECT_URI: `${baseUrl}/api/auth/callback`,
      BOT_INVITE_URL: "https://discord.com/oauth2/authorize",
      PUBLIC_URL: "https://dashboard.example.test",
    },
    stdio: "ignore",
  });
  let response;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (child.exitCode !== null) assert.fail(`server exited early with ${child.exitCode}`);
    try {
      response = await fetch(baseUrl);
      if (response.status === 200) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.ok(response, "built server became reachable");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  const policy = response.headers.get("content-security-policy") ?? "";
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce, "CSP includes a nonce");
  const html = await response.text();
  const scripts = [...html.matchAll(/<script\b[^>]*>/gi)].map((match) => match[0]);
  assert.ok(scripts.length > 0, "SSR includes framework scripts");
  assert.ok(
    scripts.every((script) => script.includes(`nonce="${nonce}"`)),
    "every rendered script nonce matches CSP",
  );
  assert.match(html, /Stop fake accounts/);
  assert.match(html, /before they get access/);
  assert.match(html, /DISCORD SECURITY/);
  assert.match(html, /name="twitter:card"/);
  assert.ok(html.includes("application/ld+json"));
  assert.ok(html.includes("og-axex.jpg"));
  assert.doesNotMatch(
    html,
    /Discord security\.|Under control\.|One dashboard\. Every server\.|All servers\. One view\./,
  );
  assert.match(html, /id="platform"/);
  assert.match(html, /id="security"/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="case-example"/);
  assert.match(html, /id="faq"/);
  const fragmentLinks = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  for (const id of fragmentLinks) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /Add Axex to Discord/);
  assert.match(html, /View sample case/);
  assert.match(html, /No checkout step in the current install flow/);
  assert.match(html, /Built for Discord server owners and moderation teams/);
  assert.match(html, /Open dashboard/);
  assert.match(html, /href="\/api\/auth\/discord"/);
  assert.doesNotMatch(
    html,
    /Invite Axex|Continue with Discord|Explore features|Sign in with Discord/,
  );
  assert.match(html, /How it works/);
  assert.match(html, /Role-based access/);
  assert.match(html, /Product preview/);
  assert.match(html, /Demo data/);
  assert.match(html, /Verification portal/);
  assert.match(html, /Raid detection/);
  assert.match(html, /id="case-example"/);
  assert.match(html, /Case 74633148/);
  assert.match(html, /Sample data, not a live server record/);
  assert.match(html, /2-day-old account/);
  assert.match(html, /three failed attempts/);
  assert.match(html, /#quarantine/);
  assert.match(html, /Manage Roles/);
  assert.match(html, /Manage Channels/);
  const landingSource = await readFile(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
  const landingStyles =
    (await readFile(new URL("../src/components/landing.css", import.meta.url), "utf8")) +
    (await readFile(new URL("../src/components/landing-extra.css", import.meta.url), "utf8"));
  assert.match(landingSource, /new IntersectionObserver/);
  assert.match(landingSource, /aria-current=\{activeSection === "platform"/);
  assert.match(landingStyles, /\.landing-nav > a\[aria-current="location"\]/);
  assert.doesNotMatch(landingStyles, /\.landing-nav > a\[href="#how-it-works"\]/);
  assert.match(landingSource, /The server owner controls dashboard access/);
  assert.doesNotMatch(landingSource, /Access follows your Discord permissions/);
  assert.match(landingSource, /landing_scroll_depth/);
  assert.match(landingSource, /faq_expanded/);
  assert.match(landingSource, /sample_case_opened/);
  assert.match(landingSource, /sample_case_tab_changed/);
  assert.match(landingSource, /dashboard_cta_clicked/);
  assert.ok(html.includes("All rights reserved."));

  for (const [path, marker] of [
    ["/docs", "Set up Axex in your Discord server"],
    ["/permissions", "Understand the permissions first"],
    ["/privacy", "What Axex stores"],
    ["/terms", "Use Axex responsibly"],
    ["/status", "Monitoring unavailable"],
  ]) {
    const page = await fetch(baseUrl + path);
    assert.equal(page.status, 200, path + " renders successfully");
    const pageHtml = await page.text();
    assert.match(pageHtml, new RegExp(marker));
    if (path === "/privacy") {
      assert.match(pageHtml, /raw IP-address fields/i);
      assert.match(pageHtml, /TOKEN_RETENTION_DAYS/);
      assert.match(pageHtml, /365 days/);
    }
  }
  assert.match(html, /Back to top/);
  assert.doesNotMatch(html, /landing-hero-copy"[^>]*style="[^"]*opacity:0/);
  assert.doesNotMatch(html, /landing-hero-visual"[^>]*style="[^"]*opacity:0/);
  assert.match(html, /capability-card/);
  assert.match(html, /What Axex checks/);
  assert.doesNotMatch(html, /99\.9%|24\.7K|12\.3K|All systems operational/);
  assert.doesNotMatch(html, /No bot token in dashboard/);
  assert.doesNotMatch(html, /Keep your server/);

  const malformedPathResponse = await fetch(`${baseUrl}/%E0%A4%A`);
  assert.equal(malformedPathResponse.status, 400);
  const healthyResponse = await fetch(baseUrl);
  assert.equal(healthyResponse.status, 200);

  const pickerResponse = await fetch(`${baseUrl}/servers`, { redirect: "manual" });
  assert.equal(pickerResponse.status, 302);
  assert.equal(pickerResponse.headers.get("location"), "/?next=%2Fservers");
});
