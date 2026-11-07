import { LoadingSkeleton } from "../components/loading-skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { describeAuditAction, isCalendarDateString, relativeAge } from "../lib/dashboard-view.ts";
import { DataTable, type DataTableColumn } from "../components/data-table";
import "../components/pages.css";

const searchSchema = z.object({
  actor: z
    .string()
    .regex(/^\d{0,20}$/)
    .optional(),
  action: z.enum(["", "add_admin", "remove_admin", "change_role", "login"]).optional(),
  from: z.string().refine(isCalendarDateString, "Enter a valid date").or(z.literal("")).optional(),
  to: z.string().refine(isCalendarDateString, "Enter a valid date").or(z.literal("")).optional(),
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
        actorName: row.actorGlobalName ?? row.actorUsername,
        actorAvatar: row.actorAvatar,
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
  const hasFilters = Boolean(search.actor || search.action || search.from || search.to);
  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    {
      id: "createdAt",
      label: "Time",
      accessor: (row) => Date.parse(row.createdAt),
      cell: (row) => {
        const createdAt = new Date(row.createdAt);
        return (
          <time dateTime={row.createdAt} title={createdAt.toLocaleString()}>
            {relativeAge(createdAt)}
          </time>
        );
      },
    },
    {
      id: "actor",
      label: "Actor",
      accessor: (row) => row.actorName ?? row.actorId,
      cell: (row) => (
        <div className="audit-person">
          <strong>{row.actorName ?? "Discord user"}</strong>
          <code>{row.actorId}</code>
        </div>
      ),
    },
    {
      id: "action",
      label: "Action",
      accessor: (row) => actionLabel(row.action),
      cell: (row) => <span className="audit-event-pill">{actionLabel(row.action)}</span>,
    },
    {
      id: "change",
      label: "Change",
      accessor: (row) => describeAuditAction(row.action, row.details),
      cell: (row) => (
        <span className="audit-change">{describeAuditAction(row.action, row.details)}</span>
      ),
    },
    {
      id: "targetId",
      label: "Target User ID",
      accessor: (row) => row.targetId ?? "",
      cell: (row) =>
        row.targetId ? (
          <code className="audit-target">{row.targetId}</code>
        ) : (
          <span className="muted">—</span>
        ),
    },
  ];

  return (
    <section className="audit-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">
            PEOPLE &amp; HISTORY <span className="title-divider">/</span> ACCESS CONTROL
          </p>
          <h1>Audit log</h1>
          <p className="muted">A clear record of changes to dashboard access.</p>
        </div>
        <a className="button button-secondary" href={`/servers/${guild.guildId}/admins`}>
          Manage admins <span aria-hidden="true">↗</span>
        </a>
      </div>

      <section className="card audit-filter-panel" aria-label="Audit log filters">
        <div className="audit-filter-heading">
          <div>
            <strong>Find an access change</strong>
            <span>Filter by person, action, or date.</span>
          </div>
          <span>
            {rows.length} {rows.length === 1 ? "entry" : "entries"} on this page
          </span>
        </div>
        <div className="audit-quick-ranges" aria-label="Quick date ranges">
          <button
            type="button"
            className="filter-preset"
            onClick={() => applyRange(base, search, 1)}
          >
            Today
          </button>
          <button
            type="button"
            className="filter-preset"
            onClick={() => applyRange(base, search, 7)}
          >
            Last 7 days
          </button>
          <button
            type="button"
            className="filter-preset"
            onClick={() => applyRange(base, search, 30)}
          >
            Last 30 days
          </button>
        </div>
        <form
          className="audit-filter-form"
          method="get"
          action={base}
          aria-label="Filter audit entries"
        >
          <label className="audit-filter-field">
            Actor User ID
            <input
              className="text-input mono"
              name="actor"
              inputMode="numeric"
              placeholder="Discord ID"
              defaultValue={search.actor}
            />
          </label>
          <label className="audit-filter-field">
            Action
            <select className="select-input" name="action" defaultValue={search.action}>
              <option value="">All actions</option>
              <option value="add_admin">Admin added</option>
              <option value="remove_admin">Admin removed</option>
              <option value="change_role">Role changed</option>
              <option value="login">Login</option>
            </select>
          </label>
          <label className="audit-filter-field">
            From
            <input className="text-input" type="date" name="from" defaultValue={search.from} />
          </label>
          <label className="audit-filter-field">
            To
            <input className="text-input" type="date" name="to" defaultValue={search.to} />
          </label>
          <button className="button button-primary" type="submit">
            Apply filters
          </button>
          {hasFilters && (
            <a className="audit-reset" href={base}>
              Clear all
            </a>
          )}
        </form>
      </section>

      <div className="card table-card audit-card">
                <DataTable
          rows={rows}
          columns={columns}
          rowId={(row) => String(row.id)}
          tableClassName="audit-table"
          ariaLabel="Audit log entries"
          initialSorting={[{ id: "createdAt", desc: true }]}
          emptyMessage={
            <div className="empty-state" role="status">
              <h2>
                {hasFilters
                  ? "No matching changes"
                  : search.page > 1
                    ? "End of the audit log"
                    : "No changes recorded yet"}
              </h2>
              <p>
                {hasFilters
                  ? "Try a different person, action, or date range."
                  : search.page > 1
                    ? "You’re viewing beyond the last page of recorded changes."
                    : "Changes to dashboard access will appear here when the server owner updates the roster."}
              </p>
              {hasFilters && (
                <a className="button button-secondary" href={base}>
                  Clear all filters
                </a>
              )}
            </div>
          }
        />
        <div className="pagination">
          <span>Page {search.page}</span>
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
    )[action] ?? "Access changed"
  );
}

function applyRange(base: string, search: { actor?: string; action?: string }, days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const query = new URLSearchParams();
  if (search.actor) query.set("actor", search.actor);
  if (search.action) query.set("action", search.action);
  query.set("from", start.toISOString().slice(0, 10));
  query.set("to", end.toISOString().slice(0, 10));
  window.location.assign(`${base}?${query.toString()}`);
}

function pageUrl(base: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  next.set("page", String(page));
  return `${base}?${next.toString()}`;
}
