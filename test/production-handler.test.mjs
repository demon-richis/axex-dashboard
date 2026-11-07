import assert from "node:assert/strict";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
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
  assert.match(html, /Safer servers\./);
  assert.match(html, /Clearer control\./);
  assert.match(html, /id="capabilities"/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /id="security"/);
  assert.match(html, /Login with Discord/);
  assert.match(html, /never stores a bot token/);
  assert.doesNotMatch(html, /Your servers/);
});
