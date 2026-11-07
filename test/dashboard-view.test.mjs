import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../src/lib/db/schema.ts";
import { auditLog, users } from "../src/lib/db/schema.ts";
import { listAudit } from "../src/lib/audit.server.ts";
import {
  describeAuditAction,
  isCalendarDateString,
  isGuildOnline,
  relativeAge,
} from "../src/lib/dashboard-view.ts";

const migration = await readFile(
  new URL("../drizzle/0000_dashboard_foundation.sql", import.meta.url),
  "utf8",
);
const guildId = "300000000000000001";
const actorId = "400000000000000001";
let client;
let db;

before(async () => {
  client = new PGlite();
  await client.exec(migration);
  db = drizzle(client, { schema });
  await db.insert(users).values({
    userId: actorId,
    username: "axex-owner",
    globalName: "Axex Owner",
    avatar: null,
  });
  await db.insert(auditLog).values({
    guildId,
    actorId,
    action: "change_role",
    targetId: "500000000000000001",
    details: { role: "viewer" },
    createdAt: new Date("2026-11-06T12:00:00.000Z"),
  });
});

after(async () => {
  await client?.close();
});

test("bot status uses the ten-minute heartbeat window and fails closed for invalid timestamps", () => {
  const now = Date.parse("2026-11-06T12:10:00.000Z");
  assert.equal(isGuildOnline("2026-11-06T12:00:00.000Z", now), true);
  assert.equal(isGuildOnline("2026-11-06T11:59:59.999Z", now), false);
  assert.equal(isGuildOnline("invalid", now), false);
});

test("audit descriptions turn saved role fields into concise, safe summaries", () => {
  assert.equal(
    describeAuditAction("add_admin", '{"role":"admin"}'),
    "Added an admin to dashboard access",
  );
  assert.equal(describeAuditAction("change_role", { role: "viewer" }), "Changed role to viewer");
  assert.equal(
    describeAuditAction("remove_admin", "not-json"),
    "Removed someone from dashboard access",
  );
  assert.equal(describeAuditAction("unknown", {}), "Updated dashboard access");
});

test("relative age is stable, concise, and handles invalid dates", () => {
  const now = Date.parse("2026-11-06T12:10:00.000Z");
  assert.equal(relativeAge("2026-11-06T12:09:30.000Z", now), "just now");
  assert.equal(relativeAge("2026-11-06T12:05:00.000Z", now), "5 min ago");
  assert.equal(relativeAge("invalid", now), "Time unavailable");
});

test("calendar-date validation rejects impossible dates before query execution", () => {
  assert.equal(isCalendarDateString("2024-02-29"), true);
  assert.equal(isCalendarDateString("2026-02-29"), false);
  assert.equal(isCalendarDateString("2026-13-01"), false);
  assert.equal(isCalendarDateString("1969-12-31"), false);
});

test("audit query returns a known actor name and preserves the event details", async () => {
  const rows = await listAudit({ guildId, page: 1, pageSize: 5 }, db);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].actorGlobalName, "Axex Owner");
  assert.equal(rows[0].actorUsername, "axex-owner");
  assert.deepEqual(rows[0].details, { role: "viewer" });
});
