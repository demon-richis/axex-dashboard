# D1 Outcomes

## Dashboard stack, schema, and operations

- [x] Use TanStack Start + React + TypeScript + Tailwind v4, Drizzle + Neon (HTTP driver), and Vercel. Use `dashboard` schema and independent Drizzle migration journal `{ schema: "dashboard_meta", table: "__migrations" }`; never touch the portal journal. Create `dashboard.users`, `dashboard.guild_admins(guild_id,user_id,role in ('admin','viewer'),added_by,created_at,PRIMARY KEY(guild_id,user_id))`, `dashboard.audit_log(id,guild_id,actor_id,action,target_id,details jsonb,created_at)`, and `dashboard.bot_guilds` with exactly: `CREATE SCHEMA IF NOT EXISTS dashboard; CREATE TABLE IF NOT EXISTS dashboard.bot_guilds (guild_id TEXT PRIMARY KEY, name TEXT NOT NULL, icon TEXT, owner_id TEXT NOT NULL, member_count INTEGER NOT NULL DEFAULT 0, installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), removed_at TIMESTAMPTZ);`. Read only `public.verification_cases(status,created_at,guild_id)` for statistics; if missing, hide the card gracefully. Do not run migrations against any database.

## Authentication and application security

- [x] Discord OAuth2 scope is `identify` only (never `guilds`). Generate random OAuth state nonce in a short-lived signed cookie and verify it in callback. After login store signed session `{userId, issuedAt, expiresAt}` for 12 hours. Never persist Discord access tokens: use the token once for `/users/@me`, then discard. Upsert `dashboard.users(user_id,username,global_name,avatar,last_login_at)`. Sign out clears session. Redirect via `new Response(null,{status:302,headers})`.
- [x] CSP uses per-request nonce and no `unsafe-inline` scripts; add HSTS, nosniff, `Referrer-Policy: no-referrer`, `frame-ancestors 'none'`, and `Cache-Control: no-store` on `/api` and authenticated pages. CSRF Origin-check every mutation; zod-validate every input; Neon-backed rate limit login, callback, admin mutations. Every write is recorded in audit log (`add_admin`, `remove_admin`, `change_role`; login optional). Runtime env validation clearly fails fast for `DATABASE_URL`, `SESSION_SECRET` (>=32 chars), `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `BOT_INVITE_URL`, `PUBLIC_URL`. Never request or store a Discord bot token. Test the client bundle for server env names and `secret`.

## Authorization and server picker

- [x] A single `getGuildAccess(userId,guildId)` is called by every loader and action and reads the DB on every request (no cookie role caching). Role `owner` iff `dashboard.bot_guilds.owner_id === userId` and `removed_at IS NULL`; otherwise use guild_admins role; otherwise no access. Unknown/forbidden guilds are 404, never 403. Only owner adds/removes admins or changes roles. Test owner/admin/viewer/none/removed bot/wrong guild. `/servers` shows all accessible servers (icon,name,member count,role,bot status); with exactly one server redirect to it; remember last server in cookie. Empty state explains, links `BOT_INVITE_URL`, and has Refresh.

## Pages and interactions

- [x] `/` is short, premium Axex landing with “Login with Discord”. `/servers/$guildId` shell has Overview, Verification [Coming soon], Logs [Coming soon], Admins, Audit log; mobile drawer; searchable/icon server switcher; sign-out menu; breadcrumbs; Ctrl+K palette for servers/pages; disabled items display Coming soon and are not dead links.
- [x] Overview shows server header; “Connected” if `last_seen_at` within 10 minutes, else “Offline” and relative time; 7-day success/failed/quarantined/expired/in-progress counts; next-step cards for Verification settings, Logs, Admins with Coming soon where appropriate.
- [x] Admins: owner can edit, admin/viewer read-only. Table has avatar/name (or “Not seen yet”), User ID chip with copy, role, added by, date. Add-admin drawer validates snowflake and role, includes exact helper: “Discord > Settings > Advanced > Developer Mode, then right-click a user > Copy User ID”. Owner row locked with tooltip. Removing requires typed confirmation. Role changes use optimistic update and Undo toast.
- [x] Audit log has actor/action/date filters, pagination, relative times, empty state. 404 and themed error pages have retry.
- [x] UX hard requirements: dark Axex theme, pointer/hover/focus-visible on interactive controls, >=44px touch target, skeletons not spinners, inline validation, success/error toasts, empty/loading/error states on every page, 320–1440px responsive, reduced-motion support, landmarks and aria labels, WCAG AA contrast, unsaved-change form guard, route titles, 150–200ms motion, short friendly copy, no lorem ipsum or inert placeholder buttons.

## Visual refinement and 3D interaction

- [x] Replace the template-like landing treatment with a deliberate, screenshot-guided Axex art direction: strong editorial hierarchy, asymmetric composition, considered surface detail, and one distinctive 3D server-control visual, while preserving the existing brand palette and Discord sign-in path.
- [x] Use Anime.js to animate the 3D component’s CSS transforms (`rotateX`, `rotateY`, `translateZ`) with restrained movement. Integrate through React lifecycle cleanup, respect `prefers-reduced-motion`, and keep decorative motion from hiding or delaying content or controls.

## D2 Research-led authenticated dashboard UX

- [x] Research Carl-bot, MEE6, Wick, Dyno, and ProBot dashboard patterns using official public pages and documentation; distinguish directly observed public pages from login-gated or documentation-only UI evidence; save the sourced comparison in `research/bot-dashboard-benchmark.md`.
- [x] Keep the current server identity and owner/admin/viewer role visible across authenticated pages. Group only the supported Axex D1 destinations—Overview, Verification [Coming soon], Admins, Logs [Coming soon], and Audit log—with consistent accessible icons, current-page state, persistent server switching, and keyboard-operable navigation/search.
- [x] In `/servers`, preserve one-server redirect and the last-server preference; add immediate server search and a concise accurate count of accessible/connected servers. Cards show icon, name, member count, role, and bot status. Distinguish zero accessible servers from zero search matches and give each state a relevant next action.
- [x] On `/servers/$guildId`, show the actual connection state and last-seen freshness with a refresh affordance. Show seven-day verification counts only when `public.verification_cases` is available. Add a small recent-change feed sourced from real audit entries (actor, action, target, time, and known name when available) linked to the full audit log; do not invent trends or uptime metrics.
- [x] On Admins, show accurate owner/admin/viewer counts; support searching known names/User IDs and filtering by role; state clearly that only the owner can add, remove, or change roles. Preserve the locked owner row and existing validated, confirmed, owner-only mutations.
- [x] On Audit log, retain actor/action/date filtering and pagination; add quick date ranges and readable action/detail summaries derived from saved audit fields while retaining actor and target IDs and respecting unknown actor identities.
- [x] Keep guild data behind per-request `getGuildAccess`, use existing records/read-only queries only, preserve no-migration/no-bot-token security constraints, and maintain responsive layout, semantic labels, focus visibility, useful empty/loading/denied/stale/error states, and reduced-motion support.

## Local sign-in configuration

- [x] In Vite `serve` mode, load private local `.env` values into server-side `process.env` for the allowlisted dashboard server settings (`DATABASE_URL`, `SESSION_SECRET`, Discord OAuth settings, `BOT_INVITE_URL`, and `PUBLIC_URL`). Existing shell environment values take precedence; do not expose private values to client bundles or load local values during production builds.
- [x] Keep deployed configuration distinct: local `.env` does not configure Vercel; sign-in still requires `SESSION_SECRET` of at least 32 characters and a reachable Neon database with the reviewed `dashboard.rate_limit_buckets` migration applied.

## Tests, docs, and CI

- [x] `node:test` + PGlite tests: OAuth start/callback with mocked Discord; session sign/verify/expiry/tamper; access matrix; admin owner-only/duplicate/invalid ID/owner-not-removable; audit entry for every write; CSRF rejection; 404-not-403; bundle leak; built-handler smoke test returns 200 HTML and CSP-matching nonces.
- [x] README architecture/local setup; commented `.env.example`; DEPLOY.md with Discord Developer Portal redirect URI, Vercel env vars, migration command, and order bot first then dashboard. GitHub Actions install/lint/typecheck/test/build.

## Bot guild synchronization (`demon-richis/axex`)

- [x] Append identical `dashboard.bot_guilds` DDL in `src/db/schema.sql`; avoid semicolons in comments because `initDB` splits on `;`.
- [x] Add `src/utils/guildSync.js` exporting `upsertGuild(guild)`, `markGuildRemoved(guildId)`, `syncAllGuilds(client)` (one batched statement), and a 5-minute heartbeat (`setInterval` + `unref`) updating `last_seen_at` for every guild. Hook ready (full sync + heartbeat), `guildCreate`, `guildUpdate` (name/icon/owner/member count), `guildDelete` (`removed_at=now`). Best effort: catch/log, never break bot.
- [x] PGlite tests cover upsert, removal, owner change, heartbeat; bot `npm test` and `npm run check` pass.

## Git and final audit

- [x] Work directly on `main`, small commits, no force push, no secrets printed/committed. Before each push all applicable checks pass. Final response includes table `task | DONE / NOT DONE | evidence (file + test name)`, test counts for both repos, `git log --oneline -5` for both, and explicit list of what was not verified in a real browser.
