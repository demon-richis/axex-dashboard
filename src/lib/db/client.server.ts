import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema.ts";

export function getDb() {
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is required to access dashboard data");
  return drizzle(neon(url), { schema });
}

export type DashboardDb = ReturnType<typeof getDb>;
