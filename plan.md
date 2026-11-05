# Axex Dashboard — D1 implementation plan

## Scope and architecture

Build the D1 SSR dashboard in `github.com/demon-richis/axex-dashboard` on `main`, and the matching guild-presence sync in `github.com/demon-richis/axex`. The dashboard uses TanStack Start, React, TypeScript, Tailwind v4, Drizzle ORM with `@neondatabase/serverless` HTTP transport, and is deployable to Vercel. It reads existing verification data and does not store Discord bot credentials. Database changes are delivered as migrations and are not applied to any live database.

The server boundary is explicit: `src/lib/security.ts` handles runtime environment validation and headers; `src/lib/session.server.ts` signs OAuth state and 12-hour session cookies; `src/lib/db/client.server.ts` owns the Neon/Drizzle connection; `src/lib/db/schema.ts` defines only the dashboard-owned schema; `src/lib/access.server.ts` is the single per-request `getGuildAccess` policy; `src/lib/admins.server.ts`, `audit.server.ts`, and `guilds.server.ts` provide authorization-checked domain operations; `src/routes/api/*` exposes OAuth and mutation handlers; file routes provide SSR pages. CI runs lint, TypeScript, tests, and build. PGlite tests exercise service behavior without a live database.

The `dashboard` schema and its migration journal schema `dashboard_meta` are independent from the portal. `dashboard.bot_guilds` is the exact shared DDL required by the bot; the bot project receives the same DDL. Only code/migrations are added; no production or development database is migrated. Verification stats are read-only, and unavailable `public.verification_cases` is treated as an unavailable statistic rather than a page failure.

## Design

- **Design Movement:** Axex's own premium dark operations-console aesthetic, guided by the supplied portal design tokens.
- **Core Principles:** quiet high-contrast surfaces; warm, sparing action color; direct server-first navigation; clear access-role and bot-health states.
- **Color Philosophy:** near-black keeps the console focused; ember red-orange carries Axex identity; gold `#ffb21e` marks attention and primary calls; restrained green indicates healthy bot status.
- **Layout Paradigm:** compact app shell with a persistent server rail/sidebar and broad operational canvas; on small screens the sidebar becomes a drawer.
- **Signature Elements:** fine ember edge highlights; lightly translucent glass panels; small uppercase metadata labels and role/status chips.
- **Interaction Philosophy:** visible focus, large touch targets, inline feedback, and no controls that appear interactive but do nothing.
- **Animation:** 150–200 ms transitions only, with reduced-motion support; loading uses stable skeletons rather than spinners.
- **Typography System:** Inter for interface text; medium-weight labels, restrained display sizing, tabular numerals for metrics and IDs.
- **Brand Essence:** a focused control room for Axex server owners; secure, composed, precise.
- **Brand Voice:** concise and calm. Examples: “Your servers, in one place.” “Axex is offline. Last seen 18 minutes ago.”
- **Wordmark & Logo:** an angular double-chevron AX mark paired with a compact uppercase AXEX wordmark; use a CSS/SVG mark rather than an unrelated image.
- **Signature Brand Color:** Axex ember `#f04b2f`, paired with gold `#ffb21e`.

## Project structure

- `src/routes/`: landing, server picker, guild shell and admin/audit pages, plus API endpoints.
- `src/lib/`: request security, OAuth/session, DB schema/client, access checks, rate-limits, and domain data operations.
- `drizzle/`: schema-scoped SQL migrations and Drizzle metadata, isolated under `dashboard_meta`.
- `test/`: `node:test` unit/integration tests using PGlite and mocked Discord HTTP.
- `.github/workflows/`: reproducible CI checks; `README.md`, `DEPLOY.md`, `.env.example`: operator guidance.

## Delivery constraints

Use the authenticated owner's GitHub access to work directly on each repository's `main`; preserve concurrent remote commits, never force-push, and use small commits. Before each push, both affected repositories must pass their specified checks; dashboard checks are `npm test`, `npm run check`, and `npm run build`, while bot checks are `npm test` and `npm run check`. Do not run migrations, create Vercel deployments, or claim browser verification unless performed.