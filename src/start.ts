import { randomBytes } from "node:crypto";
import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page.ts";
import { applySecurityHeaders, validateRuntimeEnvironment } from "./lib/security.ts";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error(
      "[Axex Dashboard] Request failed:",
      error instanceof Error ? error.name : "unknown",
    );
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});
const securityHeadersMiddleware = createMiddleware().server(async ({ request, next }) => {
  if (process.env["NODE_ENV"] === "production") validateRuntimeEnvironment();
  const nonce = randomBytes(18).toString("base64url");
  const result = await next({ context: { cspNonce: nonce } });
  return applySecurityHeaders(request, result.response, nonce);
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware, errorMiddleware, csrfMiddleware],
}));
