import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applySecurityHeaders,
  isSameOrigin,
  requireSameOrigin,
  validateRuntimeEnvironment,
} from "../src/lib/security.ts";

const env = {
  DATABASE_URL: "postgresql://user:pass@example.test/db",
  SESSION_SECRET: "x".repeat(32),
  DISCORD_CLIENT_ID: "id",
  DISCORD_CLIENT_SECRET: "secret",
  DISCORD_REDIRECT_URI: "https://dashboard.example.test/api/auth/callback",
  BOT_INVITE_URL: "https://discord.com/oauth2/authorize",
  PUBLIC_URL: "https://dashboard.example.test",
  NODE_ENV: "production",
};

test("runtime validation requires all server environment variables and a strong session secret", () => {
  assert.doesNotThrow(() => validateRuntimeEnvironment(env));
  assert.throws(
    () => validateRuntimeEnvironment({ ...env, SESSION_SECRET: "short" }),
    /SESSION_SECRET/,
  );
  assert.throws(() => validateRuntimeEnvironment({ ...env, BOT_INVITE_URL: "" }), /BOT_INVITE_URL/);
  assert.throws(
    () => validateRuntimeEnvironment({ ...env, PUBLIC_URL: "http://dashboard.example.test" }),
    /HTTPS/,
  );
});

test("mutations accept only an exact same-origin Origin header", () => {
  const request = new Request("https://dashboard.example.test/api/admins", {
    method: "POST",
    headers: { origin: "https://dashboard.example.test" },
  });
  assert.equal(isSameOrigin(request), true);
  assert.doesNotThrow(() => requireSameOrigin(request));
  for (const headers of [{ origin: "https://evil.example" }, {}]) {
    assert.throws(
      () =>
        requireSameOrigin(
          new Request("https://dashboard.example.test/api/admins", { method: "POST", headers }),
        ),
      (error) => error instanceof Response && error.status === 404,
    );
  }
});

test("security headers include nonce-only scripts, HSTS, nosniff, no-referrer, frame denial, and authenticated no-store", async () => {
  const nonce = "A1B2C3nonce";
  const request = new Request("https://dashboard.example.test/servers/100000000000000001");
  const response = await applySecurityHeaders(
    request,
    new Response("<html><script>window.ok=true</script></html>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
    nonce,
  );
  const html = await response.text();
  assert.match(
    response.headers.get("content-security-policy"),
    new RegExp(`script-src[^;]*'nonce-${nonce}'`),
  );
  assert.doesNotMatch(
    response.headers.get("content-security-policy"),
    /script-src[^;]*unsafe-inline/,
  );
  assert.match(html, new RegExp(`<script nonce="${nonce}">`));
  assert.equal(
    response.headers.get("strict-transport-security"),
    "max-age=31536000; includeSubDomains; preload",
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("cache-control"), "no-store");
});
