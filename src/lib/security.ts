import { z } from "zod";

const requiredEnvironment = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  DISCORD_REDIRECT_URI: z.string().url(),
  BOT_INVITE_URL: z.string().url(),
  PUBLIC_URL: z.string().url(),
});

export function validateRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  const result = requiredEnvironment.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid Axex Dashboard environment: ${details}`);
  }
  if (result.data.PUBLIC_URL.startsWith("https://") === false && env["NODE_ENV"] === "production") {
    throw new Error("PUBLIC_URL must use HTTPS in production");
  }
  if (result.data.DISCORD_REDIRECT_URI !== new URL(result.data.DISCORD_REDIRECT_URI).toString()) {
    throw new Error("DISCORD_REDIRECT_URI must be an absolute URL");
  }
}

function policy(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://discord.com",
    `script-src 'self' 'nonce-${nonce}' https://discord.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https://cdn.discordapp.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://discord.com",
  ].join("; ");
}

export async function applySecurityHeaders(
  request: Request,
  response: Response,
  nonce: string,
): Promise<Response> {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", policy(nonce));
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/") || path.startsWith("/servers"))
    headers.set("Cache-Control", "no-store");

  if ((headers.get("content-type") ?? "").includes("text/html")) {
    const html = await response.text();
    const secured = html.replace(/<script(?![^>]*\bnonce=)/gi, `<script nonce="${nonce}"`);
    return new Response(secured, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin) && origin === new URL(request.url).origin;
}

export function requireSameOrigin(request: Request): void {
  if (!isSameOrigin(request)) throw new Response("Not found", { status: 404 });
}
