import assert from "node:assert/strict";
import { test } from "node:test";
import {
  consumeOAuthState,
  createOAuthState,
  createSessionCookie,
  getSession,
  sessionCookieNames,
} from "../src/lib/session.server.ts";

process.env.SESSION_SECRET = "test-only-session-secret-that-is-at-least-32-chars";
const userId = "200000000000000001";
const now = 1_800_000_000_000;
const requestWithCookie = (cookie) =>
  new Request("https://dashboard.example.test/", { headers: { cookie } });

test("session cookie is signed, HttpOnly, Secure, SameSite=Lax, and valid for 12 hours", () => {
  const value = createSessionCookie(userId, now);
  assert.match(value, new RegExp(`^${sessionCookieNames.session}=`));
  assert.match(value, /HttpOnly/);
  assert.match(value, /Secure/);
  assert.match(value, /SameSite=Lax/);
  assert.match(value, /Max-Age=43200/);
  const cookie = value.split(";", 1)[0];
  assert.deepEqual(getSession(requestWithCookie(cookie), now + 1000), {
    userId,
    issuedAt: 1_800_000_000,
    expiresAt: 1_800_043_200,
  });
});

test("session rejects signature tampering, expiration, malformed IDs, and wrong lifetime", () => {
  const value = createSessionCookie(userId, now);
  const cookie = value.split(";", 1)[0];
  const [name, signed] = cookie.split("=");
  const tampered = `${name}=${signed.slice(0, -2)}xx`;
  assert.equal(getSession(requestWithCookie(tampered), now), null);
  assert.equal(getSession(requestWithCookie(cookie), now + 43_201_000), null);
  assert.equal(getSession(requestWithCookie("axex_session=not-a-cookie"), now), null);
});

test("OAuth state nonce is random, signed, short-lived, and consumed only on matching state", () => {
  const first = createOAuthState(now);
  const second = createOAuthState(now);
  assert.notEqual(first.nonce, second.nonce);
  assert.match(first.cookie, /Max-Age=600/);
  assert.match(first.cookie, /HttpOnly; Secure; SameSite=Lax/);
  const cookie = first.cookie.split(";", 1)[0];
  assert.equal(consumeOAuthState(requestWithCookie(cookie), "wrong", now), null);
  assert.ok(consumeOAuthState(requestWithCookie(cookie), first.nonce, now));
  assert.equal(consumeOAuthState(requestWithCookie(cookie), first.nonce, now + 601_000), null);
});
