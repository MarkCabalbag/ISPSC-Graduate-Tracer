/**
 * Server entry point: starts the Express app from `app.ts` on `PORT`.
 *
 * @remarks
 * `PORT` defaults to `7000` when it is missing or not a valid port number (see
 * `lib/env.ts`). The app itself (middleware and routes) lives in `app.ts` so
 * tests can use it without opening a port.
 *
 * **Timeouts.** A request must finish in 30 s and its headers arrive in 35 s,
 * so a client that dribbles bytes cannot hold a connection open (slowloris).
 * `keepAliveTimeout` is longer than the proxies' idle timeouts, so the proxy
 * closes idle connections first and never reuses one the server just closed.
 *
 * **Shutdown.** On `SIGTERM` (every Render deploy) the server stops accepting
 * connections, lets in-flight requests finish, closes the database pool, and
 * exits. After 10 s it exits regardless. A crash or an unhandled rejection is
 * logged and the process exits, and the host restarts it.
 */

import app from "./app.js";
import prisma from "./lib/prisma.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "App is running");
});

server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 65_000;

const shutdown = (signal: string): void => {
  logger.info({ signal }, "Shutting down");
  server.close(() => {
    prisma
      .$disconnect()
      .catch((err: unknown) => logger.error({ err }, "Prisma disconnect failed"))
      .finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "unhandledRejection");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  process.exit(1);
});
