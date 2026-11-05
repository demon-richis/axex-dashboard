import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const actionSchema = z
  .object({
    action: z.enum(["add_admin", "remove_admin", "change_role"]),
    guildId: z.string().regex(/^\d{17,20}$/),
  })
  .passthrough();
export const Route = createFileRoute("/api/admins")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [
          { getSession },
          { requireSameOrigin },
          { getGuildAccess },
          { addAdmin, changeAdminRole, removeAdmin },
        ] = await Promise.all([
          import("../lib/session.server.ts"),
          import("../lib/security.ts"),
          import("../lib/access.server.ts"),
          import("../lib/admins.server.ts"),
        ]);
        try {
          requireSameOrigin(request);
          const session = getSession(request);
          if (!session)
            return Response.json(
              { error: "session_required" },
              { status: 401, headers: { "Cache-Control": "no-store" } },
            );
          const raw: unknown = await request.json();
          const input = actionSchema.parse(raw);
          const access = await getGuildAccess(session.userId, input.guildId);
          if (!access)
            return Response.json(
              { error: "not_found", message: "Not found" },
              { status: 404, headers: { "Cache-Control": "no-store" } },
            );
          if (input.action === "add_admin") await addAdmin(raw, session.userId, access);
          else if (input.action === "change_role")
            await changeAdminRole(raw, session.userId, access);
          else await removeAdmin(raw, session.userId, access);
          return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          if (error instanceof Response)
            return Response.json(
              {
                error: error.status === 404 ? "not_found" : "request_failed",
                message: error.status === 404 ? "Not found" : await error.text(),
              },
              { status: error.status, headers: { "Cache-Control": "no-store" } },
            );
          if (error instanceof z.ZodError)
            return Response.json(
              {
                error: "invalid_input",
                message: error.issues[0]?.message ?? "Check the submitted details.",
              },
              { status: 400, headers: { "Cache-Control": "no-store" } },
            );
          console.error(
            "[admins] Mutation failed:",
            error instanceof Error ? error.name : "unknown",
          );
          return Response.json(
            {
              error: "temporarily_unavailable",
              message: "That change could not be saved right now.",
            },
            { status: 500, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
