import { randomUUID } from "node:crypto";
import { renderErrorPage } from "./lib/error-page.ts";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};
let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  serverEntryPromise ??= import("@tanstack/react-start/server-entry").then(
    (module) => (module.default ?? module) as ServerEntry,
  );
  return serverEntryPromise;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      return await (await getServerEntry()).fetch(request, env, ctx);
    } catch (error) {
      const requestId = randomUUID();
      console.error("[Axex Dashboard] Server entry failed:", {
        requestId,
        name: error instanceof Error ? error.name : "unknown",
        message: error instanceof Error ? error.message : "Unknown server failure",
      });
      return new Response(renderErrorPage(error, requestId), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    }
  },
};
