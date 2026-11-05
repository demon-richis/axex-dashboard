import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

async function jsFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await jsFiles(path)));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(path);
  }
  return files;
}

test("client bundle contains no server environment names or secret text", async () => {
  const assets = join(process.cwd(), "dist", "client", "assets");
  const files = await jsFiles(assets);
  assert.ok(files.length > 0, "build client assets must exist before the bundle leak test");
  for (const file of files) {
    const bundle = await readFile(file, "utf8");
    assert.doesNotMatch(
      bundle,
      /DATABASE_URL|SESSION_SECRET|DISCORD_CLIENT_SECRET|DISCORD_REDIRECT_URI|BOT_INVITE_URL/,
    );
    assert.doesNotMatch(bundle, /secret/i, `server-only secret text found in ${file}`);
  }
});
