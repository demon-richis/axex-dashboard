import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/discord")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { beginOAuth } = await import("../lib/auth.server.ts");
        return beginOAuth(request);
      },
    },
  },
});
