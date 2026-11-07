import { createHmac } from "node:crypto";
import { neon } from "@neondatabase/serverless";

function getSafeDatabaseErrorCode(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    const code = error.code;
    if (typeof code === "string" && /^[A-Z0-9_]{5,10}$/.test(code)) return code;
  }
  return error instanceof Error ? error.name : "unknown";
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<{ allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number }> {
  if (
    !key ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    !Number.isSafeInteger(windowMs) ||
    windowMs < 1
  )
    throw new Error("Rate limit parameters must be valid and positive");
  const databaseUrl = process.env["DATABASE_URL"];
  const secret = process.env["SESSION_SECRET"];
  if (!databaseUrl || !secret || secret.length < 32)
    throw new Error("Neon rate limiting requires DATABASE_URL and SESSION_SECRET");
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const bucket = createHmac("sha256", secret).update(key).digest("hex");
  const query = neon(databaseUrl);
  let rows: Awaited<ReturnType<typeof query>>;
  try {
    rows = await query`
      INSERT INTO dashboard.rate_limit_buckets (bucket_hash, window_start, count, expires_at)
      VALUES (${bucket}, to_timestamp(${windowStartMs / 1000}), 1, to_timestamp(${(windowStartMs + 2 * windowMs) / 1000}))
      ON CONFLICT (bucket_hash, window_start)
      DO UPDATE SET count = dashboard.rate_limit_buckets.count + 1
      RETURNING count
    `;
  } catch (error) {
    console.error("[rate-limit] Neon request failed:", getSafeDatabaseErrorCode(error));
    throw error;
  }
  const count = Number(rows[0]?.["count"]);
  if (!Number.isFinite(count)) throw new Error("Rate limit update returned no count");
  if (count > limit)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000)),
    };
  return { allowed: true, remaining: limit - count };
}
