# Axex Dashboard (D1)

A secure SSR console for Axex Discord server owners and owner-registered admins. D1 covers server overview, access-list administration, and dashboard audit history. Discord is used only to establish the signed-in identity; dashboard access is decided exclusively by the dashboard database.

## Architecture

The app is built with TanStack Start, React, TypeScript, Tailwind CSS v4, Drizzle ORM, and Neon’s serverless HTTP driver. Vercel is the deployment target. The `dashboard` Postgres schema is owned by this app. Drizzle uses the separate `dashboard_meta.__migrations` journal so it never touches the Axex Guardian Portal migration journal. `dashboard.bot_guilds` is shared with the bot and must have the same DDL in both repositories.

OAuth requests only Discord’s `identify` scope. The short-lived signed OAuth-state cookie contains a random state nonce, not a token. The callback uses the access token once for `/users/@me`, upserts the profile, and discards the local token value. User sessions are signed, HttpOnly, Secure, SameSite=Lax cookies with a 12-hour lifetime. No bot token is used or stored by the dashboard.

Each page/action needing a guild calls `getGuildAccess` against the database for that request. Bot ownership is authoritative while `removed_at` is null; other access comes from `guild_admins`. Unknown and forbidden guilds are concealed with a 404. Admin writes use same-origin checks, Zod validation, Neon-backed rate limits, and audit records.

`public.verification_cases` is accessed only through a read-only aggregate query. If unavailable, the statistics card is omitted. No migration is run automatically or during tests.

## Local setup

1. Use Node.js 22 or newer and npm.
2. Copy `.env.example` to `.env` and fill in a Neon `DATABASE_URL`, a randomly generated `SESSION_SECRET` of at least 32 characters, the Discord OAuth client ID/secret, `DISCORD_REDIRECT_URI`, `BOT_INVITE_URL`, and `PUBLIC_URL`. Do not put a Discord bot token in this project.
3. In the Discord Developer Portal, register the callback URL exactly as `DISCORD_REDIRECT_URI` and enable the OAuth2 identify scope.
4. Install and start the app:

   ```sh
   npm ci
   npm run dev
   ```

5. Apply migrations only after reviewing the target database and the generated SQL:

   ```sh
   npm run db:generate
   npm run db:migrate
   ```

   The application and CI never apply migrations. For first-time rollout, deploy the bot schema sync before enabling the dashboard.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm test` runs `node:test` cases. PGlite tests use an isolated local in-memory database and do not connect to Neon. The production-handler test starts the built server locally. No browser automation is included; verify responsive behavior and the actual Discord OAuth round trip in a real browser before production launch.

## Deployment

See [DEPLOY.md](./DEPLOY.md) for Discord redirect setup, Vercel environment variables, and safe bot-first migration/deployment order.