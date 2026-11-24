/**
 * Audit log of admin actions.
 *
 * @remarks
 * Writes one JSON line to the server log when a request finishes, for:
 *
 * - every request that changes data (`POST`, `PUT`, `PATCH`, `DELETE`) made with
 *   a valid admin session, and
 * - every sign-in attempt (`POST /auth/login`), successful or not.
 *
 * It records who (admin username), what (method and path), the result (status),
 * the client IP, the request id (`X-Request-Id`, to match the request's other
 * log lines) and when (pino adds `time`). It never records request bodies, query
 * strings or response data, so graduates' personal data does not end up in the
 * logs. Paths contain record ids only.
 *
 * This is a log-based audit trail: it lives in the hosting platform's logs
 * (for example the Render log stream), not in the database. Search for
 * `"event":"audit"`.
 */

import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const auditLog = (req: Request, res: Response, next: NextFunction): void => {
  // Read the path now: routers change `req.path` while the request is handled.
  const path = req.originalUrl.split("?")[0];

  res.on("finish", () => {
    const isLogin = req.method === "POST" && path.endsWith("/auth/login");
    const adminUser = res.locals.adminUser as string | undefined;
    const isAdminWrite = WRITE_METHODS.has(req.method) && adminUser !== undefined;

    if (!isLogin && !isAdminWrite) {
      return;
    }

    logger.info({
      event: "audit",
      actor: adminUser ?? null,
      method: req.method,
      path,
      status: res.statusCode,
      ip: req.ip,
      requestId: req.id,
    });
  });

  next();
};

export default auditLog;
