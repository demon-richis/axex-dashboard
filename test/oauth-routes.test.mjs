import assert from "node:assert/strict";
import { test } from "node:test";
import { beginOAuth, completeOAuth } from "../src/lib/auth.server.ts";
import { createOAuthState, sessionCookieNames } from "../src/lib/session.server.ts";

process.env.SESSION_SECRET = "test-only-session-secret-that-is-at-least-32-chars";
process.env.DISCORD_CLIENT_ID = "client-id-test";
process.env.DISCORD_CLIENT_SECRET = "client-secret-test";
process.env.DISCORD_REDIRECT_URI = "https://dashboard.example.test/api/auth/callback";
process.env.PUBLIC_URL = "https://dashboard.example.test";

const allowRate = async () => ({ allowed: true, remaining: 19 });

function cookieFrom(setCookie) {
  return setCookie.split(";", 1)[0];
}

test("OAuth start requests identify only and forces re-consent", async () => {
  const response = await beginOAuth(
    new Request("https://dashboard.example.test/api/auth/discord?consent=1", {
      headers: { "x-real-ip": "192.0.2.10" },
    }),
    { now: 1_800_000_000_000, rateLimit: allowRate },
  );

  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.origin, "https://discord.com");
  assert.equal(location.pathname, "/oauth2/authorize");
  assert.equal(location.searchParams.get("scope"), "identify");
  assert.equal(location.searchParams.get("prompt"), "consent");
  assert.equal(location.searchParams.has("guilds"), false);
  assert.ok(location.searchParams.get("state"));
  assert.match(response.headers.get("set-cookie"), /axex_oauth_state=/);
});

test("OAuth callback fetches only identity, persists no token, and creates a session", async () => {
  const now = 1_800_000_000_000;
  const state = createOAuthState(now);
  const cookie = cookieFrom(state.cookie);
  const calls = [];
  let saved;
  const fetcher = async (input, init) => {
    const url = String(input);
    calls.push({ url, authorization: new Headers(init?.headers).get("authorization") });
    if (url.endsWith("/oauth2/token")) {
      return Response.json({ access_token: "single-use-token", scope: "identify" });
    }
    if (url.endsWith("/users/@me")) {
      return Response.json({
        id: "200000000000000001",
        username: "axex-owner",
        global_name: "Axex Owner",
        avatar: "avatar-hash",
      });
    }
    throw new Error(`Unexpected Discord endpoint: ${url}`);
  };
  const response = await completeOAuth(
    new Request(
      `https://dashboard.example.test/api/auth/callback?code=mock-code&state=${encodeURIComponent(state.nonce)}`,
      {
        headers: { cookie },
      },
    ),
    {
      now,
      fetcher,
      rateLimit: allowRate,
      saveUser: async (profile) => {
        saved = profile;
      },
    },
  );
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location")).searchParams.get("connected"), "1");
  assert.deepEqual(
    calls.map((call) => call.url),
    ["https://discord.com/api/oauth2/token", "https://discord.com/api/v10/users/@me"],
  );
  assert.equal(calls[1].authorization, "Bearer single-use-token");
  assert.deepEqual(saved, {
    id: "200000000000000001",
    username: "axex-owner",
    global_name: "Axex Owner",
    avatar: "avatar-hash",
  });
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.some((value) => value.startsWith(`${sessionCookieNames.session}=`)));
  assert.ok(cookies.every((value) => !value.includes("single-use-token")));
});

test("OAuth callback handles a rejected token exchange without creating a session", async () => {
  const now = 1_800_000_000_000;
  const state = createOAuthState(now);
  const response = await completeOAuth(
    new Request(
      `https://dashboard.example.test/api/auth/callback?code=bad&state=${encodeURIComponent(state.nonce)}`,
      {
        headers: { cookie: cookieFrom(state.cookie) },
      },
    ),
    { now, rateLimit: allowRate, fetcher: async () => new Response("denied", { status: 400 }) },
  );
  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location")).searchParams.get("error"), "oauth");
  assert.ok(
    response.headers
      .getSetCookie()
      .every((value) => !value.startsWith(`${sessionCookieNames.session}=`)),
  );
});

test("OAuth callback rejects missing or mismatched state without calling Discord", async () => {
  let calls = 0;
  const response = await completeOAuth(
    new Request("https://dashboard.example.test/api/auth/callback?code=x&state=wrong", {
      headers: { cookie: "" },
    }),
    {
      fetcher: async () => {
        calls += 1;
        return Response.json({});
      },
      rateLimit: allowRate,
    },
  );

  assert.equal(response.status, 302);
  assert.equal(new URL(response.headers.get("location")).searchParams.get("error"), "state");
  assert.equal(calls, 0);
});
