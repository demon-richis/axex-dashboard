import { eq } from "drizzle-orm";
import { z } from "zod";

import { ensureDashboardSchema, getDb } from "./db/client.server.ts";
import { users } from "./db/schema.ts";
import { consumeRateLimit } from "./rate-limit.server.ts";
import { consumeOAuthState, createOAuthState, createSessionCookie } from "./session.server.ts";

const discordUserSchema = z.object({
  id: z.string().regex(/^\d{17,20}$/),
  username: z.string().min(1).max(100),
  global_name: z.string().max(100).nullable().optional(),
  avatar: z.string().max(128).nullable().optional(),
});

function parseDiscordPayload<Schema extends z.ZodTypeAny>(
  context: string,
  schema: Schema,
  payload: unknown,
): z.infer<Schema> {
  const result = schema.safeParse(payload);
  if (!result.success) {
    console.error(
      `[auth] Discord ${context} response validation failed:`,
      result.error.issues.map((issue) => ({
        code: issue.code,
        path: issue.path.map(String).join("."),
      })),
    );
    throw new Error(`Discord ${context} response validation failed`);
  }
  return result.data;
}

function redirect(location: string, cookies?: string | string[]): Response {
  const headers = new Headers({ Location: location, "Cache-Control": "no-store" });
  for (const value of cookies ? (Array.isArray(cookies) ? cookies : [cookies]) : []) {
    headers.append("Set-Cookie", value);
  }
  return new Response(null, { status: 302, headers });
}

function requestOrigin(request: Request): string {
  return process.env["PUBLIC_URL"] ?? new URL(request.url).origin;
}

function getClientIp(request: Request): string {
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function beginOAuth(
  request: Request,
  dependencies: Pick<OAuthDependencies, "now" | "rateLimit"> = {},
): Promise<Response> {
  const now = dependencies.now ?? Date.now();
  const limitFn = dependencies.rateLimit ?? consumeRateLimit;
  const clientId = process.env["DISCORD_CLIENT_ID"];
  const redirectUri = process.env["DISCORD_REDIRECT_URI"];

  if (!clientId || !redirectUri) {
    return new Response("Discord sign-in is not configured", { status: 503 });
  }

  try {
    if (limitFn === consumeRateLimit) {
      await ensureDashboardSchema();
    }
    const limit = await limitFn(`oauth-start:${getClientIp(request)}`, 20, 60_000, now);
    if (!limit.allowed) {
      return Response.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
            "Cache-Control": "no-store",
          },
        },
      );
    }
  } catch (error) {
    console.error(
      "[auth] OAuth start rate limiter unavailable:",
      error instanceof Error ? error.name : "unknown",
    );
    return new Response("Sign-in is temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const state = createOAuthState(now);
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  if (new URL(request.url).searchParams.get("consent") === "1") {
    url.searchParams.set("prompt", "consent");
  }
  url.searchParams.set("state", state.nonce);

  return redirect(url.toString(), state.cookie);
}

export type OAuthDependencies = {
  fetcher?: typeof fetch;
  now?: number;
  rateLimit?: typeof consumeRateLimit;
  saveUser?: (profile: z.infer<typeof discordUserSchema>) => Promise<void>;
};

class OAuthFailure extends Error {
  constructor(
    public readonly code:
      | "discord_rejected"
      | "discord_token_invalid"
      | "discord_profile"
      | "discord_profile_invalid"
      | "database"
      | "oauth",
    message: string,
  ) {
    super(message);
    this.name = "OAuthFailure";
  }
}

const callbackParamsSchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(1).max(512),
});

async function saveDiscordUser(profile: z.infer<typeof discordUserSchema>): Promise<void> {
  await ensureDashboardSchema();
  const db = getDb();

  await db
    .insert(users)
    .values({
      userId: profile.id,
      username: profile.username,
      globalName: profile.global_name ?? null,
      avatar: profile.avatar ?? null,
      lastLoginAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.userId,
      set: {
        username: profile.username,
        globalName: profile.global_name ?? null,
        avatar: profile.avatar ?? null,
        lastLoginAt: new Date(),
      },
    });
}

export async function completeOAuth(
  request: Request,
  dependencies: OAuthDependencies = {},
): Promise<Response> {
  const fetcher = dependencies.fetcher ?? fetch;
  const now = dependencies.now ?? Date.now();
  const limitFn = dependencies.rateLimit ?? consumeRateLimit;
  const url = new URL(request.url);
  const params = callbackParamsSchema.safeParse({
    code: url.searchParams.get("code"),
    state: url.searchParams.get("state"),
  });
  const code = params.success ? params.data.code : "";
  const nonce = params.success ? params.data.state : "";
  const state = nonce ? consumeOAuthState(request, nonce, now) : null;
  const home = new URL("/", requestOrigin(request));

  if (!code || !state) {
    home.searchParams.set("error", "state");
    return redirect(home.toString(), state?.clearCookie);
  }

  try {
    if (limitFn === consumeRateLimit) {
      await ensureDashboardSchema();
    }
    const limit = await limitFn(`oauth-callback:${getClientIp(request)}`, 20, 60_000, now);
    if (!limit.allowed) {
      return Response.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSeconds),
            "Set-Cookie": state.clearCookie,
            "Cache-Control": "no-store",
          },
        },
      );
    }
  } catch (error) {
    console.error(
      "[auth] OAuth callback rate limiter unavailable:",
      error instanceof Error ? error.name : "unknown",
    );
    return new Response("Sign-in is temporarily unavailable", {
      status: 503,
      headers: { "Set-Cookie": state.clearCookie, "Cache-Control": "no-store" },
    });
  }

  let accessToken = "";

  try {
    const tokenResponse = await fetcher("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env["DISCORD_CLIENT_ID"] ?? "",
        client_secret: process.env["DISCORD_CLIENT_SECRET"] ?? "",
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env["DISCORD_REDIRECT_URI"] ?? "",
      }),
    });

    if (!tokenResponse.ok) {
      throw new OAuthFailure(
        "discord_rejected",
        `Discord rejected the authorization code (HTTP ${tokenResponse.status})`,
      );
    }

    let tokenJson;
    try {
      tokenJson = parseDiscordPayload(
        "token",
        z.object({
          access_token: z.string().min(1).max(4096),
          scope: z.string().optional(),
        }),
        await tokenResponse.json(),
      );
    } catch (error) {
      throw new OAuthFailure(
        "discord_token_invalid",
        error instanceof Error ? error.message : "Discord returned an invalid token response",
      );
    }

    accessToken = tokenJson.access_token;

    const profileResponse = await fetcher("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      throw new OAuthFailure(
        "discord_profile",
        `Discord profile lookup failed (HTTP ${profileResponse.status})`,
      );
    }

    let profile;
    try {
      profile = parseDiscordPayload("profile", discordUserSchema, await profileResponse.json());
    } catch (error) {
      throw new OAuthFailure(
        "discord_profile_invalid",
        error instanceof Error ? error.message : "Discord returned an invalid profile response",
      );
    }

    try {
      await (dependencies.saveUser ?? saveDiscordUser)(profile);
    } catch (error) {
      throw new OAuthFailure(
        "database",
        error instanceof Error ? error.message : "Dashboard could not save the Discord profile",
      );
    }

    home.searchParams.set("connected", "1");
    return redirect(home.toString(), [state.clearCookie, createSessionCookie(profile.id, now)]);
  } catch (error) {
    const code = error instanceof OAuthFailure ? error.code : "oauth";
    console.error("[auth] OAuth callback failed:", {
      code,
      error: error instanceof Error ? error.name : "unknown",
    });
    home.searchParams.set("error", code);
    return redirect(home.toString(), state.clearCookie);
  } finally {
    accessToken = "";
  }
}
