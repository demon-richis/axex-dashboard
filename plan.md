# Axex Dashboard — D1 foundation and evidence-led UX refinement plan

## Scope and architecture

Build the D1 SSR dashboard in `github.com/demon-richis/axex-dashboard` on `main`, and the matching guild-presence sync in `github.com/demon-richis/axex`. The dashboard uses TanStack Start, React, TypeScript, Tailwind v4, Drizzle ORM with `@neondatabase/serverless` HTTP transport, and is deployable to Vercel. It reads existing verification data and does not store Discord bot credentials. Database changes are delivered as migrations and are not applied to any live database.

The server boundary is explicit: `src/lib/security.ts` handles runtime environment validation and headers; `src/lib/session.server.ts` signs OAuth state and 12-hour session cookies; `src/lib/db/client.server.ts` owns the Neon/Drizzle connection; `src/lib/db/schema.ts` defines only the dashboard-owned schema; `src/lib/access.server.ts` is the single per-request `getGuildAccess` policy; `src/lib/admins.server.ts`, `audit.server.ts`, and `guilds.server.ts` provide authorization-checked domain operations; `src/routes/api/*` exposes OAuth and mutation handlers; file routes provide SSR pages. CI runs lint, TypeScript, tests, and build. PGlite tests exercise service behavior without a live database.

The `dashboard` schema and its migration journal schema `dashboard_meta` are independent from the portal. `dashboard.bot_guilds` is the exact shared DDL required by the bot; the bot project receives the same DDL. Only code/migrations are added; no production or development database is migrated. Verification stats are read-only, and unavailable `public.verification_cases` is treated as an unavailable statistic rather than a page failure.

## Design

- **Design Movement:** Screenshot-guided industrial editorial design, borrowing from instrument panels and precision hardware rather than a generic SaaS landing-page kit.
- **Core Principles:** deliberate asymmetry; a believable, tactile control-room surface; clear identity and access cues; a single confident 3D visual instead of scattered decorative cards.
- **Color Philosophy:** preserve the existing near-black canvas and Axex ember/gold identity. Use a softer graphite field and fine low-contrast drafting lines for depth; reserve gold for the primary action and active signal, and green only for healthy state.
- **Layout Paradigm:** keep the left-side editorial invitation but balance it with a visually anchored 3D server instrument on the right. Replace oversized blank space and floating generic widgets with a compact calibration rail, structured information bands, and intentional alignment.
- **Signature Elements:** an exploded server-stack sculpture with visible front/side/top planes; thin orbital/measurement lines; tiny equipment-style index labels and status LEDs.
- **Interaction Philosophy:** the 3D object reacts subtly to pointer movement and settles when focus leaves; the login path remains the most prominent action. All actual controls remain semantic, keyboard reachable, and at least 44px tall. Decorative 3D art is hidden from assistive technology.
- **Animation:** use Anime.js v4.5.0 `createScope()` within React `useEffect()` and call `revert()` on cleanup. Animate CSS 3D `rotateX`, `rotateY`, `translateZ`, and restrained opacity/position reveals with slow, low-amplitude movement. Respect `prefers-reduced-motion` by skipping continuous motion and keeping the final still composition. No motion communicates status or gates a task. Follow the [official React integration](https://animejs.com/documentation/getting-started/using-with-react) and [CSS transform reference](https://animejs.com/documentation/animation/animatable-properties/css-transforms).
- **Typography System:** retain Inter for readable controls and body text; use a larger, tightly tracked editorial headline and compact monospaced index labels for instrument details. Keep data IDs and counts tabular.
- **Brand Essence:** a secure, precise control room for Axex server owners; composed, technical, trustworthy.
- **Brand Voice:** short, direct, and quietly confident. Examples: “Your servers. One clear view.” “Only trusted access gets through.”
- **Wordmark & Logo:** retain the custom angular AX tile and compact AXEX wordmark, but pair it with deliberate spacing and a small instrument-index label rather than a default text-only brand.
- **Signature Brand Color:** Axex ember `#f04b2f`, with gold `#ffb21e` kept as the rare high-attention accent.

## Evidence-led authenticated dashboard UX (D2)

The five-product benchmark is saved at `research/bot-dashboard-benchmark.md`. Carl-bot, MEE6, Wick, Dyno, and ProBot generally gate their authenticated dashboard pages; therefore the report separates directly observed public pages from official-documentation evidence and makes no claims about competitors’ protected layouts or accessibility. Apply the reusable lessons—clear server context, concise operational overview, data freshness, attributable activity, and actionable states—without copying feature breadth or implying any feature Axex does not have.

- **Workspace shell:** make the selected server and the current user's owner/admin/viewer role visible throughout the session. Keep first-level destinations stable and grouped by task: Overview, Verification (Coming soon), Admins, Logs (Coming soon), and Audit log. Use one coherent icon family, accessible current-page states, a persistent server switcher, and keyboard-operable navigation/search.
- **Server picker:** keep the one-server redirect and last-server preference. For multiple servers, add immediate search, a small accurate access/connection summary, and a legible card hierarchy for server identity, member count, role, and heartbeat. Distinguish no accessible servers from a search with no matches and provide relevant next actions.
- **Overview:** lead with the selected server's actual bot connection state and last-seen freshness, plus an explicit refresh affordance. Keep the seven-day verification count card conditional on available `public.verification_cases` data. Add a compact recent-change feed sourced from the existing audit table (actor, action, target, time, and known actor identity), with a route to the full audit history. Do not synthesize daily trends, uptime percentages, or unsupported system-health metrics.
- **Admin roster:** add a clear owner/admin/viewer count, searchable names and IDs, and a role filter while preserving the locked owner row and owner-only writes. Explain the read-only status of admin/viewer accounts and the consequences of the selected role without suggesting that admins may edit the roster.
- **Audit log:** retain actor/action/date filters and pagination, offer convenient date-range shortcuts, and render role/add/remove events in plain language from their saved details. Keep actor and target IDs available, and show known dashboard usernames only when the existing users table has them.
- **Data and trust constraints:** use only existing dashboard records and read-only queries; any guild-specific loader still calls `getGuildAccess` on every request. Do not add migrations, Bot API scopes, bot tokens, feature modules, permission escalation, or fake data. Preserve empty, loading, denied, stale, and error explanations, visible keyboard focus, semantic labels, reduced-motion support, and the existing Axex palette.

## Local development environment handling

For Vite `serve` mode only, load `.env`/mode-specific values with Vite's `loadEnv` and copy only the allowlisted server variables into `process.env` when a shell-provided value is absent. Keep these values out of the client `import.meta.env` surface and do not load them during production builds. Deployed runtimes continue to use their platform-provided environment variables; the local `.env` does not replace required secrets or the unapplied database migration.

## Project structure

- `src/routes/`: landing, server picker, guild shell and admin/audit pages, plus API endpoints.
- `src/components/`: reusable dashboard shell and the landing-page 3D server instrument.
- `src/lib/`: request security, OAuth/session, DB schema/client, access checks, rate-limits, domain data operations, and the private-env allowlist helper used only by Vite configuration.
- `drizzle/`: schema-scoped SQL migrations and Drizzle metadata, isolated under `dashboard_meta`.
- `research/`: source-grounded competitor benchmark with official URLs and explicit login-gating/evidence limits.
- `test/`: `node:test` unit/integration tests using PGlite and mocked Discord HTTP.
- `.github/workflows/`: reproducible CI checks; `README.md`, `DEPLOY.md`, `.env.example`: operator guidance.

## Delivery constraints

Use the authenticated owner's GitHub access to work directly on each repository's `main`; preserve concurrent remote commits, never force-push, and use small commits. Before each push, dashboard checks are `npm test`, `npm run check`, and `npm run build`; bot checks are `npm test` and `npm run check`. Do not run migrations, create Vercel deployments, or claim browser verification unless performed.
