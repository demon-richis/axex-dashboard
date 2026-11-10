import { neon } from "@neondatabase/serverless";

export type LiveStatus = {
  monitoring: "online" | "offline" | "degraded" | "unavailable";
  apiAvailable: boolean | null;
  botOnline: boolean | null;
  lastHeartbeat: string | null;
  latencyMs: number | null;
  updatedAt: string;
};

type StatusDependencies = {
  fetcher?: typeof fetch;
  now?: () => number;
  heartbeat?: () => Promise<string | null>;
  url?: string;
};

const CACHE_MS = 15_000;
const HEARTBEAT_STALE_MS = 10 * 60_000;
let cached: { expiresAt: number; value: LiveStatus } | null = null;

async function readLastHeartbeat(): Promise<string | null> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("Monitoring database is not configured");
  const query = neon(databaseUrl);
  const rows = await query`
    SELECT MAX(last_seen_at) AS last_seen_at
    FROM dashboard.bot_guilds
    WHERE removed_at IS NULL
  `;
  const value = rows[0]?.["last_seen_at"];
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getLiveStatus(dependencies: StatusDependencies = {}): Promise<LiveStatus> {
  const now = dependencies.now ?? Date.now;
  const current = now();
  if (!dependencies.fetcher && !dependencies.heartbeat && cached && cached.expiresAt > current) {
    return cached.value;
  }
  const updatedAt = new Date(current).toISOString();
  const endpoint = dependencies.url ?? process.env["AXEX_BOT_HEALTH_URL"];
  if (!endpoint) {
    return {
      monitoring: "unavailable",
      apiAvailable: null,
      botOnline: null,
      lastHeartbeat: null,
      latencyMs: null,
      updatedAt,
    };
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(endpoint);
  } catch {
    return {
      monitoring: "unavailable",
      apiAvailable: null,
      botOnline: null,
      lastHeartbeat: null,
      latencyMs: null,
      updatedAt,
    };
  }
  if (parsedUrl.protocol !== "https:") {
    return {
      monitoring: "unavailable",
      apiAvailable: null,
      botOnline: null,
      lastHeartbeat: null,
      latencyMs: null,
      updatedAt,
    };
  }

  const fetcher = dependencies.fetcher ?? fetch;
  const startedAt = now();
  let apiAvailable = false;
  let botOnline: boolean | null = null;
  let latencyMs: number | null = null;
  try {
    const response = await fetcher(parsedUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(2_500),
      redirect: "error",
    });
    latencyMs = Math.max(0, now() - startedAt);
    if (response.ok) {
      const body: unknown = await response.json();
      if (body && typeof body === "object") {
        const value = body as Record<string, unknown>;
        if (
          value["service"] === "axex-bot-webhook" &&
          typeof value["ready"] === "boolean" &&
          typeof value["checkedAt"] === "string" &&
          Number.isFinite(Date.parse(value["checkedAt"]))
        ) {
          apiAvailable = true;
          botOnline = value["ready"];
        }
      }
    }
  } catch {
    latencyMs = null;
  }

  let lastHeartbeat: string | null = null;
  try {
    lastHeartbeat = await (dependencies.heartbeat ?? readLastHeartbeat)();
  } catch {
    // Monitoring is reported degraded/unavailable rather than exposing an internal DB error.
  }
  const isFresh =
    lastHeartbeat !== null && current - Date.parse(lastHeartbeat) <= HEARTBEAT_STALE_MS;
  const monitoring: LiveStatus["monitoring"] = !apiAvailable
    ? "unavailable"
    : !botOnline
      ? "offline"
      : lastHeartbeat === null
        ? "degraded"
        : isFresh
          ? "online"
          : "degraded";
  const result = { monitoring, apiAvailable, botOnline, lastHeartbeat, latencyMs, updatedAt };
  if (!dependencies.fetcher && !dependencies.heartbeat)
    cached = { expiresAt: current + CACHE_MS, value: result };
  return result;
}
