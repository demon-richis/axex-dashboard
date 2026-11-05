import "dotenv/config";

import { defineConfig } from "drizzle-kit";
import { env } from "node:process";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env["DATABASE_URL"] ?? "",
  },
  migrations: { schema: "dashboard_meta", table: "__migrations" },
  schemaFilter: ["dashboard"],
});
