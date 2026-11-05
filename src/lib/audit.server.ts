import { and, desc, eq, gte, lte } from "drizzle-orm";
import { getDb, type DashboardDb } from "./db/client.server.ts";
import { auditLog } from "./db/schema.ts";

export async function writeAudit(
  input: {
    guildId: string;
    actorId: string;
    action: string;
    targetId?: string | null;
    details?: Record<string, unknown>;
  },
  db: DashboardDb = getDb(),
): Promise<void> {
  await db.insert(auditLog).values({
    guildId: input.guildId,
    actorId: input.actorId,
    action: input.action,
    targetId: input.targetId ?? null,
    details: input.details ?? {},
  });
}

export async function listAudit(
  input: {
    guildId: string;
    actor?: string;
    action?: string;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  },
  db: DashboardDb = getDb(),
) {
  const clauses = [eq(auditLog.guildId, input.guildId)];
  if (input.actor) clauses.push(eq(auditLog.actorId, input.actor));
  if (input.action) clauses.push(eq(auditLog.action, input.action));
  if (input.from) clauses.push(gte(auditLog.createdAt, input.from));
  if (input.to) clauses.push(lte(auditLog.createdAt, input.to));
  return db
    .select()
    .from(auditLog)
    .where(and(...clauses))
    .orderBy(desc(auditLog.createdAt))
    .limit(input.pageSize)
    .offset((input.page - 1) * input.pageSize);
}
