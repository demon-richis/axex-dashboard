import { eq } from "drizzle-orm";
import { getDb } from "./db/client.server.ts";
import { users } from "./db/schema.ts";
import { getSession } from "./session.server.ts";

export async function requireUser(request: Request) {
  const session = getSession(request);
  if (!session)
    throw new Response(null, {
      status: 302,
      headers: {
        Location: `/?next=${encodeURIComponent(new URL(request.url).pathname)}`,
        "Cache-Control": "no-store",
      },
    });
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
  if (!user)
    throw new Response(null, {
      status: 302,
      headers: { Location: "/", "Cache-Control": "no-store" },
    });
  return user;
}
