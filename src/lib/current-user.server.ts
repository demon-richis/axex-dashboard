import { notFound, redirect } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { ensureDashboardSchema, getDb } from "./db/client.server.ts";
import { users } from "./db/schema.ts";
import { getSession } from "./session.server.ts";

export async function requireUser(request: Request) {
  const session = getSession(request);
  if (!session) {
    throw redirect({
      to: "/",
      search: { next: new URL(request.url).pathname },
      statusCode: 302,
      headers: { "Cache-Control": "no-store" },
    });
  }

  await ensureDashboardSchema();
  const [user] = await getDb()
    .select({
      userId: users.userId,
      username: users.username,
      globalName: users.globalName,
      avatar: users.avatar,
    })
    .from(users)
    .where(eq(users.userId, session.userId))
    .limit(1);

  if (!user) {
    throw redirect({
      to: "/",
      statusCode: 302,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return user;
}
