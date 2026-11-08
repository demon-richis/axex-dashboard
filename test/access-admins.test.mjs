import assert from "node:assert/strict";
import { isNotFound } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../src/lib/db/schema.ts";
import { getGuildAccess, requireGuildAccess } from "../src/lib/access.server.ts";
import { addAdmin, changeAdminRole, removeAdmin } from "../src/lib/admins.server.ts";
import { auditLog, botGuilds, guildAdmins } from "../src/lib/db/schema.ts";

const migration = await readFile(
  new URL("../drizzle/0000_dashboard_foundation.sql", import.meta.url),
  "utf8",
);
const guild = "100000000000000001";
const otherGuild = "100000000000000002";
const owner = "200000000000000001";
const admin = "200000000000000002";
const viewer = "200000000000000003";
const outsider = "200000000000000004";
let client;
let db;
const allowRate = async () => ({ allowed: true, remaining: 29 });

before(async () => {
  client = new PGlite();
  await client.exec(migration);
  db = drizzle(client, { schema });
  await db.insert(botGuilds).values([
    { guildId: guild, name: "Test server", ownerId: owner },
    { guildId: otherGuild, name: "Other server", ownerId: outsider },
  ]);
  await db.insert(guildAdmins).values([
    { guildId: guild, userId: admin, role: "admin", addedBy: owner },
    { guildId: guild, userId: viewer, role: "viewer", addedBy: owner },
  ]);
});

after(async () => {
  await client?.close();
});

const expectStatus = async (promise, status) => {
  await assert.rejects(
    promise,
    (error) =>
      (error instanceof Response && error.status === status) ||
      (status === 404 && isNotFound(error)),
  );
};

test("getGuildAccess enforces owner, admin, viewer, none, removed bot, and wrong guild matrix", async () => {
  assert.deepEqual(await getGuildAccess(owner, guild, db), { guildId: guild, role: "owner" });
  assert.deepEqual(await getGuildAccess(admin, guild, db), { guildId: guild, role: "admin" });
  assert.deepEqual(await getGuildAccess(viewer, guild, db), { guildId: guild, role: "viewer" });
  assert.equal(await getGuildAccess(outsider, guild, db), null);
  assert.equal(await getGuildAccess(admin, otherGuild, db), null);
  await client.query("UPDATE dashboard.bot_guilds SET removed_at = NOW() WHERE guild_id = $1", [
    guild,
  ]);
  assert.equal(await getGuildAccess(owner, guild, db), null);
  assert.equal(await getGuildAccess(admin, guild, db), null);
  await client.query("UPDATE dashboard.bot_guilds SET removed_at = NULL WHERE guild_id = $1", [
    guild,
  ]);
});

test("only the owner can add, change, and remove admins; every successful write has an audit row", async () => {
  const ownerAccess = { guildId: guild, role: "owner" };
  const adminAccess = { guildId: guild, role: "admin" };
  await expectStatus(
    addAdmin({ guildId: guild, userId: outsider, role: "viewer" }, admin, adminAccess, db, {
      rateLimit: allowRate,
    }),
    404,
  );
  await assert.rejects(
    addAdmin({ guildId: guild, userId: "bad-id", role: "admin" }, owner, ownerAccess, db, {
      rateLimit: allowRate,
    }),
  );
  await addAdmin({ guildId: guild, userId: outsider, role: "admin" }, owner, ownerAccess, db, {
    rateLimit: allowRate,
  });
  await expectStatus(
    addAdmin({ guildId: guild, userId: outsider, role: "admin" }, owner, ownerAccess, db, {
      rateLimit: allowRate,
    }),
    409,
  );
  await expectStatus(
    addAdmin({ guildId: guild, userId: owner, role: "viewer" }, owner, ownerAccess, db, {
      rateLimit: allowRate,
    }),
    409,
  );
  await expectStatus(
    changeAdminRole({ guildId: guild, userId: owner, role: "viewer" }, owner, ownerAccess, db, {
      rateLimit: allowRate,
    }),
    409,
  );
  await changeAdminRole(
    { guildId: guild, userId: outsider, role: "viewer" },
    owner,
    ownerAccess,
    db,
    { rateLimit: allowRate },
  );
  await expectStatus(
    removeAdmin({ guildId: guild, userId: owner, confirmation: owner }, owner, ownerAccess, db, {
      rateLimit: allowRate,
    }),
    409,
  );
  await expectStatus(
    removeAdmin(
      { guildId: guild, userId: outsider, confirmation: "wrong" },
      owner,
      ownerAccess,
      db,
      { rateLimit: allowRate },
    ),
    400,
  );
  await removeAdmin(
    { guildId: guild, userId: outsider, confirmation: outsider },
    owner,
    ownerAccess,
    db,
    { rateLimit: allowRate },
  );
  const entries = await db
    .select({ action: auditLog.action, targetId: auditLog.targetId })
    .from(auditLog)
    .where((await import("drizzle-orm")).eq(auditLog.guildId, guild));
  assert.deepEqual(
    entries.map((row) => row.action),
    ["add_admin", "change_role", "remove_admin"],
  );
  assert.ok(entries.every((row) => row.targetId === outsider));
});

test("forbidden and unknown guilds are concealed as 404, never 403", async () => {
  await expectStatus(requireGuildAccess(outsider, guild, db), 404);
  await expectStatus(requireGuildAccess(admin, otherGuild, db), 404);
});
