import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { completeOAuth } = await import("../lib/auth.server.ts");
        return completeOAuth(request);
      },
    },
  },
});
