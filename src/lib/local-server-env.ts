const localServerEnvironmentKeys = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "DISCORD_CLIENT_ID",
  "DISCORD_CLIENT_SECRET",
  "DISCORD_REDIRECT_URI",
  "BOT_INVITE_URL",
  "AXEX_BOT_HEALTH_URL",
  "PUBLIC_URL",
] as const;

export function applyLocalServerEnv(
  fileEnvironment: Record<string, string | undefined>,
  targetEnvironment: NodeJS.ProcessEnv = process.env,
): void {
  for (const key of localServerEnvironmentKeys) {
    const current = targetEnvironment[key];
    const fromFile = fileEnvironment[key];
    if ((!current || !current.trim()) && fromFile?.trim()) targetEnvironment[key] = fromFile;
  }
}
