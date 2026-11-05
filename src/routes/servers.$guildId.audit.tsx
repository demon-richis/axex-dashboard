import { LoadingSkeleton } from "../components/loading-skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import "../components/pages.css";

const searchSchema = z.object({
  actor: z
    .string()
    .regex(/^\d{0,20}$/)
    .optional(),
  action: z.enum(["", "add_admin", "remove_admin", "change_role", "login"]).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  page: z.coerce.number().int().min(1).max(10000).catch(1),
});
const inputSchema = z.object({ guildId: z.string().regex(/^\d{17,20}$/) }).merge(searchSchema);
const loadAudit = createServerFn({ method: "GET" })
  .validator(inputSchema)
  .handler(async ({ data }) => {
    const [
      { getRequest },
      { requireUser },
      { requireGuildAccess },
      { getGuildDetails },
      { listAudit },
    ] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("../lib/current-user.server.ts"),
      import("../lib/access.server.ts"),
      import("../lib/guilds.server.ts"),
      import("../lib/audit.server.ts"),
    ]);
    const user = await requireUser(getRequest());
    await requireGuildAccess(user.userId, data.guildId);
    const guild = await getGuildDetails(data.guildId);
    if (!guild) throw new Response("Not found", { status: 404 });
    const from = data.from ? new Date(`${data.from}T00:00:00.000Z`) : undefined;
    const to = data.to ? new Date(`${data.to}T23:59:59.999Z`) : undefined;
    const rows = await listAudit({
      guildId: data.guildId,
      ...(data.actor ? { actor: data.actor } : {}),
      ...(data.action ? { action: data.action } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      page: data.page,
      pageSize: 25,
    });
    return {
      guild: { guildId: guild.guildId, name: guild.name },
      rows: rows.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        action: row.action,
        targetId: row.targetId,
        details: JSON.stringify(row.details ?? {}),
        createdAt: row.createdAt.toISOString(),
      })),
      search: {
        actor: data.actor ?? "",
        action: data.action ?? "",
        from: data.from ?? "",
        to: data.to ?? "",
        page: data.page,
      },
      hasNextPage: rows.length === 25,
    };
  });

export const Route = createFileRoute("/servers/$guildId/audit")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingSkeleton variant="guild" />,
  validateSearch: searchSchema,
  loader: ({ params, location }) => {
    const search = location.search as unknown as z.infer<typeof searchSchema>;
    return loadAudit({ data: { guildId: params.guildId, ...search } });
  },
  head: () => ({ meta: [{ title: "Audit log · Axex Dashboard" }] }),
  component: AuditPage,
});

function AuditPage() {
  const { guild, rows, search, hasNextPage } = Route.useLoaderData();
  const base = `/servers/${guild.guildId}/audit`;
  const filters = new URLSearchParams();
  if (search.actor) filters.set("actor", search.actor);
  if (search.action) filters.set("action", search.action);
  if (search.from) filters.set("from", search.from);
  if (search.to) filters.set("to", search.to);
  return (
    <section>
      <div className="page-title">
        <div>
          <p className="eyebrow">ACCOUNTABILITY</p>
          <h1>Audit log</h1>
          <p className="muted">Changes made to {guild.name} dashboard access.</p>
        </div>
      </div>
      <form className="toolbar" method="get" action={base} aria-label="Filter audit log">
        <input
          className="text-input mono"
          name="actor"
          placeholder="Actor User ID"
          defaultValue={search.actor}
          aria-label="Filter by actor User ID"
        />
        <select
          className="select-input"
          name="action"
          defaultValue={search.action}
          aria-label="Filter by action"
        >
          <option value="">All actions</option>
          <option value="add_admin">Admin added</option>
          <option value="remove_admin">Admin removed</option>
          <option value="change_role">Role changed</option>
          <option value="login">Login</option>
        </select>
        <label className="filter-date">
          <span className="sr-only">From date</span>
          <input className="text-input" type="date" name="from" defaultValue={search.from} />
        </label>
        <label className="filter-date">
          <span className="sr-only">To date</span>
          <input className="text-input" type="date" name="to" defaultValue={search.to} />
        </label>
        <button className="button button-secondary" type="submit">
          Apply filters
        </button>
      </form>
      <div className="card table-card">
        <table className="data-table audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const createdAt = new Date(row.createdAt);
              return (
                <tr key={row.id}>
                  <td data-label="Time">
                    <time dateTime={row.createdAt} title={createdAt.toLocaleString()}>
                      {relativeTime(createdAt)}
                    </time>
                  </td>
                  <td data-label="Actor">
                    <span className="mono">{row.actorId}</span>
                  </td>
                  <td data-label="Action">
                    <span className="audit-action">{actionLabel(row.action)}</span>
                  </td>
                  <td data-label="Target">
                    <span className="mono muted">{row.targetId ?? "—"}</span>
                  </td>
                  <td data-label="Details">
                    <span className="audit-detail" title={row.details}>
                      {row.details === "{}" ? "—" : row.details}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty-state">
            <h2>No matching activity</h2>
            <p>
              {search.actor || search.action || search.from || search.to
                ? "Try changing the filters, or clear them to see the full log."
                : "Admin changes will appear here when they happen."}
            </p>
            {(search.actor || search.action || search.from || search.to) && (
              <a className="button button-secondary" href={base}>
                Clear filters
              </a>
            )}
          </div>
        )}
        <div className="pagination">
          <span>
            Page {search.page}
            {rows.length ? ` · ${rows.length} entries` : ""}
          </span>
          <div className="table-actions">
            <a
              className={`small-button ${search.page <= 1 ? "disabled-link" : ""}`}
              aria-disabled={search.page <= 1}
              href={search.page > 1 ? pageUrl(base, filters, search.page - 1) : undefined}
            >
              Previous
            </a>
            <a
              className={`small-button ${!hasNextPage ? "disabled-link" : ""}`}
              aria-disabled={!hasNextPage}
              href={hasNextPage ? pageUrl(base, filters, search.page + 1) : undefined}
            >
              Next
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
function actionLabel(action: string) {
  return (
    (
      {
        add_admin: "Admin added",
        remove_admin: "Admin removed",
        change_role: "Role changed",
        login: "Signed in",
      } as Record<string, string>
    )[action] ?? action
  );
}
function relativeTime(date: Date) {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second");
  if (Math.abs(seconds) < 3600) return formatter.format(Math.round(seconds / 60), "minute");
  if (Math.abs(seconds) < 86400) return formatter.format(Math.round(seconds / 3600), "hour");
  return formatter.format(Math.round(seconds / 86400), "day");
}
function pageUrl(base: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `${base}?${next.toString()}`;
}
