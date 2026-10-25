import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { 
    // In v7, the CLI uses this url configuration. 
    // Point this to your unpooled direct database connection string (Port 5432).
    url: env("DIRECT_URL"), 
  },
});