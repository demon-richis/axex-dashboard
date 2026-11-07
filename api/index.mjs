let serverEntryPromise;

async function getServerEntry() {
  serverEntryPromise ??= import("../dist/server/server.js").then(
    (module) => module.default ?? module,
  );
  return serverEntryPromise;
}

export function createFetchRequest(request) {
  const forwardedProtocol = request.headers["x-forwarded-proto"]?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || "https";
  const host = request.headers.host || "localhost";
  const url = new URL(request.url || "/", `${protocol}://${host}`);
  const rewrittenPath = url.searchParams.get("__axex_path");

  if (rewrittenPath !== null) {
    if (!rewrittenPath.startsWith("/") || rewrittenPath.startsWith("//")) {
      throw new TypeError("Invalid rewritten request path");
    }
    url.pathname = rewrittenPath;
    url.searchParams.delete("__axex_path");
  }

  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
  }

  const method = request.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(url, {
    method,
    headers,
    ...(hasBody ? { body: request, duplex: "half" } : {}),
  });
}

export default async function handler(request, response) {
  try {
    const result = await (await getServerEntry()).fetch(createFetchRequest(request), {}, {});
    response.statusCode = result.status;
    for (const [key, value] of result.headers) {
      if (key.toLowerCase() !== "set-cookie") response.setHeader(key, value);
    }
    const cookies = result.headers.getSetCookie?.();
    if (cookies?.length) response.setHeader("set-cookie", cookies);
    response.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error("[vercel] Request failed:", error instanceof Error ? error.name : "unknown");
    response.statusCode = 500;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.end("Internal Server Error");
  }
}
