import { Readable } from "node:stream";

let handlerPromise;

async function getHandler() {
  handlerPromise ??= import("../dist/server/server.js").then((module) => module.default ?? module);
  return handlerPromise;
}

function requestUrl(request) {
  const protocol = request.headers["x-forwarded-proto"]?.split(",")[0]?.trim() || "https";
  const host = request.headers.host || "localhost";
  return `${protocol}://${host}${request.url || "/"}`;
}

export default async function handler(request, response) {
  try {
    const body =
      request.method === "GET" || request.method === "HEAD" ? undefined : Readable.toWeb(request);
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
    const result = await (
      await getHandler()
    ).fetch(new Request(requestUrl(request), { method: request.method, headers, body }), {}, {});
    response.status(result.status);
    for (const [key, value] of result.headers) {
      if (key.toLowerCase() !== "set-cookie") response.setHeader(key, value);
    }
    const cookies = result.headers.getSetCookie?.();
    if (cookies?.length) response.setHeader("set-cookie", cookies);
    response.send(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error("[vercel] Request failed:", error instanceof Error ? error.name : "unknown");
    response.status(500).send("Internal Server Error");
  }
}
