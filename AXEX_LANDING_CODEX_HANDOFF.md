# Axex landing-page revamp — Codex handoff

The landing-page revamp and public trust pages are committed directly in this branch. No patch application is required. Read AGENTS.md before making further changes. Keep work on main; do not force-push or discard owner changes.

## Stack and guardrails

TanStack Start, React 19, TypeScript, Vite, Tailwind CSS v4, Drizzle ORM, Neon and Vercel. Preserve the current dashboard schema and migration constraints. Keep OAuth scope identify only unless the owner explicitly approves a policy change. Do not persist OAuth tokens or add the Discord bot token. Always use src/lib/access.server.ts:getGuildAccess to authorize guild access.

## Implemented

- Product-focused hero with clear primary/secondary CTAs and compact copy.
- Expandable feature details, bot → verification portal → dashboard flow, and role-based setup sequence.
- Interactive sample case with summary, evidence and timeline, labelled as sample data.
- Expanded FAQ covering permissions, privacy, false positives, AutoMod, latency, pricing, setup and dashboard access.
- Active-section navigation, sticky header, mobile invite CTA and footer links.
- /docs, /permissions, /privacy, /terms and /status routes.
- Privacy field/retention summary, canonical and social metadata, SoftwareApplication JSON-LD and Open Graph image.
- Responsive layouts, semantic headings, focus-visible states, skip links and reduced-motion support.
- SSR tests for public information routes.
- Landing events are dispatched as axex:analytics CustomEvents; no external analytics SDK is currently installed.

## Owner decisions / production follow-up

1. OAuth scope mismatch (P0): AGENTS.md/README require identify only, but existing src/lib/auth.server.ts and test/oauth-routes.test.mjs request identify guilds and fetch /users/@me/guilds. This revamp intentionally does not alter auth. The owner must choose and reconcile the policy before changing either side.
2. Verify production BOT_INVITE_URL and that the invite requests only the permissions actually needed.
3. Confirm Vercel environment settings, analytics preference and that no personal data is sent to analytics.
4. Confirm retention behaviour across portal and bot-side case data, including suspicious-attempt rows and raw IP fields. The visible portal cleanup defaults do not establish deletion of all bot-side records.
5. Add a real privacy contact and self-serve deletion path; obtain legal review of Privacy/Terms before treating them as binding notices.
6. /status currently describes monitoring as not connected. Wire a real health source before advertising live status.
7. Do a browser-based responsive/accessibility review and validate CTA conversion and sample-case interactions with real users.

## Verification

Run npm test, npm run check, npm run build and git diff --check before each push. The current handoff run passed all 24 tests, typecheck and production build. ESLint still reports two pre-existing Fast Refresh warnings in src/components/ui/badge.tsx and src/components/ui/button.tsx.
