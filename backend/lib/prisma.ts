/**
 * Shared Prisma client for the Graduate Tracer module.
 *
 * @remarks
 * Every controller imports this one client, so the whole application shares a
 * single database connection pool. Put this file at `lib/prisma.ts`.
 *
 * Prisma 7 does not connect by itself: the client must be given a driver
 * adapter. This file uses the PostgreSQL adapter (`@prisma/adapter-pg`) and the
 * `DATABASE_URL` environment variable.
 *
 * **Setup**
 *
 * ```
 * npm i @prisma/adapter-pg pg
 * npm i -D @types/pg
 * ```
 *
 * **Environment variables**
 *
 * - `DATABASE_URL`: the direct PostgreSQL connection string, for example
 *   `postgresql://user:password@host:5432/dbname`. A `prisma://` or
 *   `prisma+postgres://` (Accelerate) address does not work here.
 *
 * `server.ts` imports `dotenv/config` before the controllers, so `.env` is
 * already loaded when this file runs.
 *
 * If your database is not PostgreSQL (MySQL, SQLite), the adapter package and
 * class are different. Check the provider in `prisma/schema.prisma`.
 *
 * @packageDocumentation
 */

import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

export default prisma;