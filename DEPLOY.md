# Deployment guide

## 1. Prepare Discord OAuth

In the Discord Developer Portal, open the OAuth2 settings for the Axex Dashboard application. Add the exact callback URL used for deployment, for example `https://dashboard.example.com/api/auth/callback` (and a separate local callback if desired). Configure the application for the `identify` scope only. Do not request `guilds`; this dashboard intentionally does not use Discord permissions to grant access.

## 2. Configure Vercel

Connect `demon-richis/axex-dashboard` to a Vercel project and configure these server-only environment variables for the appropriate environments:

- `DATABASE_URL`: Neon Postgres connection string (HTTP driver).
- `SESSION_SECRET`: cryptographically random value of at least 32 characters.
- `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET`.
- `DISCORD_REDIRECT_URI`: exact deployed callback URL from step 1.
- `BOT_INVITE_URL`: Axex Discord installation URL.
- `PUBLIC_URL`: canonical HTTPS origin of the dashboard.

The Vercel rewrites send application requests through `api/index.mjs`, which forwards them to the built TanStack server entry. Keep the configured Vercel build command so the server bundle is included with that function.

Never prefix server values with `VITE_`, print them in logs, or put a Discord bot token in the dashboard. The app validates required settings at runtime. Do not enable unauthenticated access to management routes.

## 3. Migration and release order

1. Deploy the bot change first. Its startup initializes `dashboard.bot_guilds` with `CREATE TABLE IF NOT EXISTS` and keeps server membership/heartbeat fresh.
2. Review the committed SQL under `drizzle/` and verify the target Neon project. The project is not migrated automatically. Apply with `npm run db:migrate` only when the owner is ready; the Drizzle journal is isolated in `dashboard_meta.__migrations`.
3. Set all Vercel environment variables, including the canonical redirect URL.
4. Deploy the dashboard repository and complete a real-browser OAuth test with an owner account. Confirm that guild access reflects `dashboard.bot_guilds.owner_id` and `dashboard.guild_admins`, never Discord roles or permissions.

## 4. Operational notes

`dashboard.bot_guilds` is the single shared installation/heartbeat table. Its schema must stay byte-for-byte compatible in the bot and dashboard migrations. `public.verification_cases` is read-only and optional; if it is absent, dashboard verification metrics are hidden. The app returns 404 for unknown/unauthorized server IDs and no-store headers for authenticated routes and APIs.
