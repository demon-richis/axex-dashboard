import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { test } from "node:test";

import { createFetchRequest } from "../api/index.mjs";

test("Vercel rewrites restore the original path and keep the original query", () => {
  const request = createFetchRequest({
    method: "GET",
    url: "/api?__axex_path=%2Fservers%2F123&tab=admins",
    headers: {
      host: "dashboard.example.test",
      "x-forwarded-proto": "https",
    },
  });

  assert.equal(request.url, "https://dashboard.example.test/servers/123?tab=admins");
});

test("Vercel adapter preserves request bodies and rejects invalid rewrite paths", async () => {
  const incoming = Readable.from(["{}"]);
  Object.assign(incoming, {
    method: "POST",
    url: "/api?__axex_path=%2Fapi%2Fadmins",
    headers: {
      host: "dashboard.example.test",
      "x-forwarded-proto": "https",
      "content-type": "application/json",
    },
  });
  const request = createFetchRequest(incoming);
  assert.equal(await request.text(), "{}");

  assert.throws(
    () =>
      createFetchRequest({
        method: "GET",
        url: "/api?__axex_path=%2F%2Fevil.example",
        headers: { host: "dashboard.example.test" },
      }),
    /Invalid rewritten request path/,
  );
});
