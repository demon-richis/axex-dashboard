import assert from "node:assert/strict";
import { test } from "node:test";
import { getLiveStatus } from "../src/lib/status.server.ts";

const NOW = Date.parse("2026-11-09T22:00:00.000Z");
const endpoint = "https://bot.example.test/health";
const fetchJson =
  (body, status = 200) =>
  async () =>
    Response.json(body, { status });
const health = (ready = true) => ({
  service: "axex-bot-webhook",
  ready,
  status: ready ? "ok" : "starting",
  checkedAt: new Date(NOW).toISOString(),
});
const deps = (overrides = {}) => ({
  now: () => NOW,
  url: endpoint,
  fetcher: fetchJson(health(true)),
  heartbeat: async () => new Date(NOW - 60_000).toISOString(),
  ...overrides,
});

test("reports online only when API is valid and bot heartbeat is fresh", async () => {
  const status = await getLiveStatus(deps());
  assert.equal(status.monitoring, "online");
  assert.equal(status.apiAvailable, true);
  assert.equal(status.botOnline, true);
  assert.ok(status.lastHeartbeat);
});

test("reports bot offline when the health API explicitly says not ready", async () => {
  const status = await getLiveStatus(deps({ fetcher: fetchJson(health(false)) }));
  assert.equal(status.monitoring, "offline");
  assert.equal(status.apiAvailable, true);
  assert.equal(status.botOnline, false);
});

test("reports degraded when a heartbeat is stale", async () => {
  const status = await getLiveStatus(
    deps({ heartbeat: async () => new Date(NOW - 11 * 60_000).toISOString() }),
  );
  assert.equal(status.monitoring, "degraded");
  assert.equal(status.apiAvailable, true);
});

test("fails closed when the API fails or its payload is invalid", async () => {
  const failed = await getLiveStatus(deps({ fetcher: fetchJson({}, 503) }));
  assert.equal(failed.monitoring, "unavailable");
  assert.equal(failed.apiAvailable, false);
  const invalid = await getLiveStatus(
    deps({ fetcher: fetchJson({ service: "other", ready: true }) }),
  );
  assert.equal(invalid.monitoring, "unavailable");
  assert.equal(invalid.botOnline, null);
});

test("reports unavailable without a configured HTTPS health endpoint", async () => {
  const missing = await getLiveStatus({ now: () => NOW, heartbeat: async () => null });
  assert.equal(missing.monitoring, "unavailable");
  const insecure = await getLiveStatus({ ...deps(), url: "http://bot.example.test/health" });
  assert.equal(insecure.monitoring, "unavailable");
});
