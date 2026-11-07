import { LoadingSkeleton } from "../components/loading-skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useGuildShell } from "../components/dashboard-shell";
import "../components/pages.css";

const guildParams = z.object({ guildId: z.string().regex(/^\d{17,20}$/) });
const loadAdmins = createServerFn({ method: "GET" })
  .validator(guildParams)
  .handler(async ({ data }) => {
    const [
      { getRequest },
      { requireUser },
      { requireGuildAccess },
      { getGuildDetails, listGuildAdmins },
      { getDb },
      { users },
      { eq },
    ] = await Promise.all([
      import("@tanstack/react-start/server"),
      import("../lib/current-user.server.ts"),
      import("../lib/access.server.ts"),
      import("../lib/guilds.server.ts"),
      import("../lib/db/client.server.ts"),
      import("../lib/db/schema.ts"),
      import("drizzle-orm"),
    ]);
    const user = await requireUser(getRequest());
    const access = await requireGuildAccess(user.userId, data.guildId);
    const guild = await getGuildDetails(data.guildId);
    if (!guild) throw new Response("Not found", { status: 404 });
    const admins = await listGuildAdmins(data.guildId);
    const [owner] = await getDb()
      .select({
        userId: users.userId,
        username: users.username,
        globalName: users.globalName,
        avatar: users.avatar,
      })
      .from(users)
      .where(eq(users.userId, guild.ownerId))
      .limit(1);
    return {
      guildId: data.guildId,
      ownerId: guild.ownerId,
      owner: owner ?? null,
      admins,
      canEdit: access.role === "owner",
    };
  });

export const Route = createFileRoute("/servers/$guildId/admins")({
  pendingMs: 80,
  pendingMinMs: 180,
  pendingComponent: () => <LoadingSkeleton variant="guild" />,
  loader: ({ params }) => loadAdmins({ data: params }),
  head: () => ({ meta: [{ title: "Admins · Axex Dashboard" }] }),
  component: AdminsPage,
});
type Role = "admin" | "viewer";
type Toast = { type: "success" | "error"; text: string; undo?: () => void };
async function mutate(body: object) {
  const response = await fetch("/api/admins", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as { message?: string };
  return response.ok
    ? { ok: true as const }
    : { ok: false as const, message: payload.message ?? "That change couldn’t be saved." };
}
function AdminsPage() {
  const data = Route.useLoaderData();
  const shell = useGuildShell();
  const [rows, setRows] = useState(data.admins);
  const [drawer, setDrawer] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [error, setError] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [confirmId, setConfirmId] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = drawer && Boolean(userId || role !== "admin");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const visibleRows = useMemo(() => {
    const needle = searchTerm.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      const matchesText =
        !needle ||
        [row.userId, row.username ?? "", row.globalName ?? ""].some((value) =>
          value.toLocaleLowerCase().includes(needle),
        );
      return matchesText && (roleFilter === "all" || row.role === roleFilter);
    });
  }, [roleFilter, rows, searchTerm]);
  const adminCount = rows.filter((row) => row.role === "admin").length;
  const viewerCount = rows.filter((row) => row.role === "viewer").length;
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(id);
  }, [toast]);
  function closeDrawer() {
    if (dirty && !window.confirm("Discard the unsaved admin details?")) return;
    setDrawer(false);
    setUserId("");
    setRole("admin");
    setError("");
  }
  async function add(event: React.FormEvent) {
    event.preventDefault();
    const cleanId = userId.trim();
    if (!/^\d{17,20}$/.test(cleanId)) {
      setError("Enter a valid Discord User ID (17–20 digits).");
      return;
    }
    setBusy(true);
    const result = await mutate({
      action: "add_admin",
      guildId: data.guildId,
      userId: cleanId,
      role,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setToast({ type: "success", text: "Admin added." });
    setDrawer(false);
    window.setTimeout(() => window.location.reload(), 700);
  }
  async function changeRole(targetId: string, next: Role) {
    const previous = rows.find((row) => row.userId === targetId)?.role as Role | undefined;
    if (!previous || previous === next) return;
    setRows((old) => old.map((row) => (row.userId === targetId ? { ...row, role: next } : row)));
    const result = await mutate({
      action: "change_role",
      guildId: data.guildId,
      userId: targetId,
      role: next,
    });
    if (!result.ok) {
      setRows((old) =>
        old.map((row) => (row.userId === targetId ? { ...row, role: previous } : row)),
      );
      setToast({ type: "error", text: result.message });
      return;
    }
    setToast({
      type: "success",
      text: "Role updated.",
      undo: () => {
        void undo(targetId, previous, next);
      },
    });
  }
  async function undo(targetId: string, previous: Role, next: Role) {
    setRows((old) =>
      old.map((row) => (row.userId === targetId ? { ...row, role: previous } : row)),
    );
    const result = await mutate({
      action: "change_role",
      guildId: data.guildId,
      userId: targetId,
      role: previous,
    });
    if (!result.ok) {
      setRows((old) => old.map((row) => (row.userId === targetId ? { ...row, role: next } : row)));
      setToast({ type: "error", text: result.message });
    } else setToast({ type: "success", text: "Role change undone." });
  }
  async function remove() {
    if (!removeId || confirmId !== removeId) return;
    setBusy(true);
    const result = await mutate({
      action: "remove_admin",
      guildId: data.guildId,
      userId: removeId,
      confirmation: confirmId,
    });
    setBusy(false);
    if (!result.ok) {
      setToast({ type: "error", text: result.message });
      return;
    }
    setRemoveId("");
    setToast({ type: "success", text: "Admin removed." });
    window.setTimeout(() => window.location.reload(), 700);
  }
  async function copy(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setToast({ type: "success", text: "User ID copied." });
    } catch {
      setToast({ type: "error", text: "Clipboard access isn’t available." });
    }
  }
  return (
    <section className="admin-page">
      <div className="page-title">
        <div>
          <p className="eyebrow">PEOPLE &amp; ACCESS</p>
          <h1>Admins</h1>
          <p className="muted">Owner-managed access to {shell.guild.name}’s dashboard.</p>
        </div>
        {data.canEdit && (
          <button className="button button-primary" onClick={() => setDrawer(true)}>
            ＋ Add admin
          </button>
        )}
      </div>
      <div className="access-summary" aria-label="Dashboard access summary">
        <div className="access-summary-item">
          <span>Owner</span>
          <strong>1</strong>
          <small>Controls this list</small>
        </div>
        <div className="access-summary-item">
          <span>Admins</span>
          <strong>{adminCount}</strong>
          <small>Dashboard access</small>
        </div>
        <div className="access-summary-item">
          <span>Viewers</span>
          <strong>{viewerCount}</strong>
          <small>Read-only access</small>
        </div>
      </div>
      {!data.canEdit && (
        <aside className="readonly-note" role="note">
          <strong>Read-only access.</strong>
          <span>Only the server owner can add people, remove access, or change roles.</span>
        </aside>
      )}
      <div className="roster-toolbar">
        <div className="roster-heading">
          <p className="eyebrow">ACCESS ROSTER</p>
          <h2>{rows.length + 1} people</h2>
          <p>
            1 owner · {adminCount} admins · {viewerCount} viewers
          </p>
        </div>
        <div className="roster-filters">
          <label className="roster-search">
            <span className="sr-only">Search admins by name or Discord ID</span>
            <input
              className="text-input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search people or IDs"
            />
          </label>
          <label>
            <span className="sr-only">Filter admins by role</span>
            <select
              className="select-input"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as "all" | Role)}
            >
              <option value="all">All roles</option>
              <option value="admin">Admins</option>
              <option value="viewer">Viewers</option>
            </select>
          </label>
        </div>
      </div>
      <div className="card table-card roster-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Discord User ID</th>
              <th>Role</th>
              <th>Added by</th>
              <th>Date added</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="owner-row">
              <td data-label="Person">
                <Person
                  name={data.owner?.globalName ?? data.owner?.username ?? "Not seen yet"}
                  avatar={data.owner?.avatar ?? null}
                  id={data.ownerId}
                />
              </td>
              <td data-label="Discord User ID">
                <Id id={data.ownerId} copy={() => void copy(data.ownerId)} />
              </td>
              <td data-label="Role">
                <span className="role-badge role-owner">Owner</span>
              </td>
              <td data-label="Added by">—</td>
              <td data-label="Date added">—</td>
              <td data-label="Actions">
                <span className="owner-lock" title="The server owner cannot be changed or removed.">
                  🔒 Locked
                </span>
              </td>
            </tr>
            {visibleRows.map((row) => (
              <tr key={row.userId}>
                <td data-label="Person">
                  <Person
                    name={row.globalName ?? row.username ?? "Not seen yet"}
                    avatar={row.avatar}
                    id={row.userId}
                  />
                </td>
                <td data-label="Discord User ID">
                  <Id id={row.userId} copy={() => void copy(row.userId)} />
                </td>
                <td data-label="Role">
                  {data.canEdit ? (
                    <label>
                      <span className="sr-only">Role for {row.username ?? row.userId}</span>
                      <select
                        className="select-input"
                        value={row.role}
                        onChange={(event) =>
                          void changeRole(row.userId, event.target.value as Role)
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </label>
                  ) : (
                    <span className={`role-badge role-${row.role}`}>{row.role}</span>
                  )}
                </td>
                <td data-label="Added by">
                  <span className="mono muted">{row.addedBy}</span>
                </td>
                <td data-label="Date added">
                  <time dateTime={new Date(row.createdAt).toISOString()}>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </time>
                </td>
                <td data-label="Actions">
                  {data.canEdit && (
                    <button
                      className="small-button danger"
                      onClick={() => {
                        setRemoveId(row.userId);
                        setConfirmId("");
                      }}
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="empty-state">
            <h2>No admins added yet</h2>
            <p>
              Only the server owner has dashboard access. Add a trusted person to help keep an eye
              on things.
            </p>
            {data.canEdit && (
              <button className="button button-primary" onClick={() => setDrawer(true)}>
                Add admin
              </button>
            )}
          </div>
        )}
        {rows.length > 0 && visibleRows.length === 0 && (
          <div className="roster-no-match" role="status">
            <strong>No admins match those filters</strong>
            <p>Try another name, Discord ID, or role.</p>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      {drawer && (
        <div
          className="modal-backdrop drawer-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDrawer();
          }}
        >
          <section
            className="card dialog-card drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
          >
            <p className="eyebrow">ACCESS CONTROL</p>
            <h2 id="add-title">Add an admin</h2>
            <p className="muted small">Grant someone access to this server’s dashboard.</p>
            <form onSubmit={(event) => void add(event)} noValidate>
              <div className="field">
                <label htmlFor="new-user-id">Discord User ID</label>
                <input
                  id="new-user-id"
                  className="text-input mono"
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                    setError("");
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={Boolean(error)}
                  aria-describedby="id-help id-error"
                  placeholder="123456789012345678"
                />
                <span id="id-help" className="field-help">
                  Discord &gt; Settings &gt; Advanced &gt; Developer Mode, then right-click a user
                  &gt; Copy User ID
                </span>
                {error && (
                  <span id="id-error" className="field-error" role="alert">
                    {error}
                  </span>
                )}
              </div>
              <div className="field">
                <label htmlFor="new-role">Access level</label>
                <select
                  id="new-role"
                  className="select-input"
                  value={role}
                  onChange={(event) => setRole(event.target.value as Role)}
                >
                  <option value="admin">Admin — dashboard access</option>
                  <option value="viewer">Viewer — read-only dashboard access</option>
                </select>
              </div>
              <div className="dialog-actions">
                <button type="button" className="button button-secondary" onClick={closeDrawer}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={busy || !/^\d{17,20}$/.test(userId.trim())}
                >
                  {busy ? "Adding…" : "Add admin"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {removeId && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setRemoveId("");
          }}
        >
          <section
            className="card dialog-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-title"
          >
            <p className="eyebrow">CONFIRM REMOVAL</p>
            <h2 id="remove-title">Remove this admin?</h2>
            <p className="muted">
              They will lose access to <strong>{shell.guild.name}</strong>. Type their Discord User
              ID to confirm.
            </p>
            <div className="field">
              <label htmlFor="remove-confirm">Discord User ID</label>
              <input
                id="remove-confirm"
                className="text-input mono"
                value={confirmId}
                onChange={(event) => setConfirmId(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="dialog-actions">
              <button className="button button-secondary" onClick={() => setRemoveId("")}>
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={busy || confirmId !== removeId}
                onClick={() => void remove()}
              >
                {busy ? "Removing…" : "Remove admin"}
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast-region" role="status" aria-live="polite">
          <div className={`toast ${toast.type}`}>
            {toast.text}{" "}
            {toast.undo && (
              <button
                className="small-button"
                onClick={() => {
                  const fn = toast.undo;
                  setToast(null);
                  if (fn) fn();
                }}
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
function Person({ name, avatar, id }: { name: string; avatar: string | null; id: string }) {
  return (
    <div className="person-cell">
      <span className="person-avatar">
        {avatar ? (
          <img src={`https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=64`} alt="" />
        ) : (
          name.slice(0, 1).toUpperCase()
        )}
      </span>
      <span>
        <strong className="person-name">{name}</strong>
        <span className="person-sub">{name === "Not seen yet" ? "Not seen yet" : ""}</span>
      </span>
    </div>
  );
}
function Id({ id, copy }: { id: string; copy: () => void }) {
  return (
    <span className="id-chip">
      <span className="mono">{id}</span>
      <button
        className="copy-button"
        title="Copy User ID"
        aria-label={`Copy Discord User ID ${id}`}
        onClick={copy}
      >
        ▢
      </button>
    </span>
  );
}
