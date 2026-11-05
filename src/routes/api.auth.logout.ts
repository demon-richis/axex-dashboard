import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ clearSessionCookie }, { requireSameOrigin }] = await Promise.all([
          import("../lib/session.server.ts"),
          import("../lib/security.ts"),
        ]);
        requireSameOrigin(request);
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/",
            "Set-Cookie": clearSessionCookie(),
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
