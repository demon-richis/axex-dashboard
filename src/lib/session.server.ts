import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_COOKIE = "axex_oauth_state";
const SESSION_COOKIE = "axex_session";
const STATE_SECONDS = 10 * 60;
const SESSION_SECONDS = 12 * 60 * 60;

type StatePayload = { nonce: string; expiresAt: number };
export type SessionPayload = { userId: string; issuedAt: number; expiresAt: number };

function secret(): string {
  const value = process.env["SESSION_SECRET"]?.trim();
  if (!value || value.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  return value;
}

function encode(payload: StatePayload | SessionPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function signed(payload: string): string {
  return `${payload}.${sign(payload)}`;
}

function verify(value: string): string | null {
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = value.slice(0, separator);
  const provided = Buffer.from(value.slice(separator + 1), "base64url");
  const expected = Buffer.from(sign(payload), "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
  return payload;
}

function parse<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function cookieValue(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i >= 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

function cookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function createOAuthState(now = Date.now()): { nonce: string; cookie: string } {
  const nonce = randomBytes(32).toString("base64url");
  const payload = encode({ nonce, expiresAt: Math.floor(now / 1000) + STATE_SECONDS });
  return { nonce, cookie: cookie(STATE_COOKIE, signed(payload), STATE_SECONDS) };
}

export function consumeOAuthState(
  request: Request,
  nonce: string,
  now = Date.now(),
): { clearCookie: string } | null {
  const raw = cookieValue(request, STATE_COOKIE);
  const payload = raw ? verify(raw) : null;
  const state = payload ? parse<StatePayload>(payload) : null;
  if (!state || !state.nonce || state.nonce !== nonce || state.expiresAt < Math.floor(now / 1000))
    return null;
  return { clearCookie: cookie(STATE_COOKIE, "", 0) };
}

export function createSessionCookie(userId: string, now = Date.now()): string {
  const issuedAt = Math.floor(now / 1000);
  const payload = encode({ userId, issuedAt, expiresAt: issuedAt + SESSION_SECONDS });
  return cookie(SESSION_COOKIE, signed(payload), SESSION_SECONDS);
}

export function getSession(request: Request, now = Date.now()): SessionPayload | null {
  const raw = cookieValue(request, SESSION_COOKIE);
  const payload = raw ? verify(raw) : null;
  const session = payload ? parse<SessionPayload>(payload) : null;
  const timestamp = Math.floor(now / 1000);
  if (
    !session ||
    !/^\d{17,20}$/.test(session.userId) ||
    !Number.isInteger(session.issuedAt) ||
    !Number.isInteger(session.expiresAt) ||
    session.expiresAt < timestamp ||
    session.expiresAt - session.issuedAt !== SESSION_SECONDS
  )
    return null;
  return session;
}

export function clearSessionCookie(): string {
  return cookie(SESSION_COOKIE, "", 0);
}
export const sessionCookieNames = { state: STATE_COOKIE, session: SESSION_COOKIE };
