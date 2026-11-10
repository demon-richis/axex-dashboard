import assert from "node:assert/strict";
import { test } from "node:test";
import { applyLocalServerEnv } from "../src/lib/local-server-env.ts";

test("local server env loads required private settings without exposing arbitrary keys", () => {
  const fileEnvironment = {
    DATABASE_URL: "postgresql://file-db.example/test",
    SESSION_SECRET: "x".repeat(32),
    DISCORD_CLIENT_ID: "client-id",
    DISCORD_CLIENT_SECRET: "client-secret",
    DISCORD_REDIRECT_URI: "http://localhost:3000/api/auth/callback",
    BOT_INVITE_URL: "https://discord.com/oauth2/authorize",
    AXEX_BOT_HEALTH_URL: "https://bot.example.test/health",
    PUBLIC_URL: "http://localhost:3000",
    VITE_PUBLIC_TOKEN: "must-not-copy",
    UNRELATED: "must-not-copy",
  };
  const targetEnvironment = { DATABASE_URL: "postgresql://shell-db.example/test" };

  applyLocalServerEnv(fileEnvironment, targetEnvironment);

  assert.equal(targetEnvironment.DATABASE_URL, "postgresql://shell-db.example/test");
  assert.equal(targetEnvironment.SESSION_SECRET, "x".repeat(32));
  assert.equal(targetEnvironment.DISCORD_CLIENT_ID, "client-id");
  assert.equal(targetEnvironment.DISCORD_CLIENT_SECRET, "client-secret");
  assert.equal(targetEnvironment.DISCORD_REDIRECT_URI, "http://localhost:3000/api/auth/callback");
  assert.equal(targetEnvironment.BOT_INVITE_URL, "https://discord.com/oauth2/authorize");
  assert.equal(targetEnvironment.AXEX_BOT_HEALTH_URL, "https://bot.example.test/health");
  assert.equal(targetEnvironment.PUBLIC_URL, "http://localhost:3000");
  assert.equal(targetEnvironment.VITE_PUBLIC_TOKEN, undefined);
  assert.equal(targetEnvironment.UNRELATED, undefined);
});

test("a blank shell setting can be filled from the local env file", () => {
  const targetEnvironment = { SESSION_SECRET: "  " };
  applyLocalServerEnv({ SESSION_SECRET: "x".repeat(32) }, targetEnvironment);
  assert.equal(targetEnvironment.SESSION_SECRET, "x".repeat(32));
});
