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

test("OAuth start redirects with identify-only scope and signed state cookie", async () => {
  const response = await beginOAuth(
    new Request("https://dashboard.example.test/api/auth/discord", {
      headers: { "x-real-ip": "192.0.2.10" },
    }),
    { now: 1_800_000_000_000, rateLimit: allowRate },
  );
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.origin, "https://discord.com");
  assert.equal(location.pathname, "/oauth2/authorize");
  assert.equal(location.searchParams.get("scope"), "identify guilds");
  assert.equal(location.searchParams.has("guilds"), false);
  assert.ok(location.searchParams.get("state"));
  assert.match(response.headers.get("set-cookie"), /axex_oauth_state=/);
});

test("OAuth callback verifies state, uses token only for /users/@me, stores profile, then discards token", async () => {
  const now = 1_800_000_000_000;
  const state = createOAuthState(now);
  const cookie = cookieFrom(state.cookie);
  const calls = [];
  let saved;
  const fetcher = async (input, init) => {
    calls.push({
      url: String(input),
      authorization: new Headers(init?.headers).get("authorization"),
    });
    if (String(input).endsWith("/oauth2/token"))
      return Response.json({ access_token: "single-use-token" });
    return Response.json({
      id: "200000000000000001",
      username: "axex-owner",
      global_name: "Axex Owner",
      avatar: "avatar-hash",
    });
  };
  const response = await completeOAuth(
    new Request(
      `https://dashboard.example.test/api/auth/callback?code=mock-code&state=${encodeURIComponent(state.nonce)}`,
      { headers: { cookie, "x-forwarded-for": "192.0.2.20" } },
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
  assert.equal(new URL(response.headers.get("location")).searchParams.get("signedIn"), "1");
  assert.deepEqual(
    calls.map((call) => call.url),
    ["https://discord.com/api/oauth2/token", "https://discord.com/api/users/@me"],
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
