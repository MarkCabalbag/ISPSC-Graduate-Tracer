/**
 * The Express app for the Graduate Tracer API (`server.ts` starts it on a port;
 * tests import it without opening one).
 *
 * @remarks
 * Creates the Express app, registers the middleware and the routers.
 *
 * **Routes**
 *
 * Every router is mounted under `/api/graduateTracer`.
 *
 * | Router             | Path                           |
 * | ------------------ | ------------------------------ |
 * | `healthRouter`     | `/api/graduateTracer/health`     |
 * | `authRouter`       | `/api/graduateTracer/auth`       |
 * | `departmentRouter` | `/api/graduateTracer/department` |
 * | `programRouter`    | `/api/graduateTracer/program`    |
 * | `majorRouter`      | `/api/graduateTracer/major`      |
 * | `userRouter`       | `/api/graduateTracer/user`       |
 * | `adminRouter`      | `/api/graduateTracer/admin`      |
 *
 * **Configuration**
 *
 * All settings come from `lib/env.ts`, which validates them once at startup and
 * stops the server with a clear message (names only, never values) if one is
 * missing or unsafe. `dotenv/config` must be imported before it, which this file does.
 *
 * **Errors**
 *
 * Unknown paths answer `404` and uncaught errors answer `500`, both as JSON, so
 * clients never receive an HTML error page or a stack trace. A body over 100 KB
 * answers `413`, and a body that is not valid JSON answers `400`.
 *
 * **Logging**
 *
 * One JSON line per request (pino), with a request id that is also sent back in
 * the `X-Request-Id` header. Query strings, cookies and personal data are never
 * logged (see `lib/logger.ts`).
 *
 * **Security**
 *
 * - `helmet()` adds the protective HTTP headers, with a CSP that allows nothing
 *   (this API only returns JSON and CSV).
 * - CORS only allows the frontend addresses in `CLIENT_URL` (comma separated).
 * - Request bodies are limited to 100 KB.
 * - `generalLimiter` limits every API route per IP address (behind the Vercel
 *   rewrite and Render, `TRUST_PROXY=2` makes that the visitor's real address).
 * - Admin routes and the write routes need the session cookie set by
 *   `/auth/login` (see `requireAdmin`). The cookie is `HttpOnly` and
 *   `SameSite=Strict`, and data-changing requests must also carry the
 *   `X-Requested-With` header. CORS allows credentials only for the origins in
 *   `CLIENT_URL`.
 *
 * @packageDocumentation
 */

import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import authRouter from "./routes/authRouter.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { getJwtSecret } from "./middleware/requireAdmin.js";
import noStore from "./middleware/noStore.js";
import auditLog from "./middleware/auditLog.js";
import { SERVER_ERROR_MESSAGE } from "./utils/httpErrors.js";
import healthRouter from "./routes/healthRouter.js";
import departmentRouter from "./routes/departmentRouter.js";
import programRouter from "./routes/programRouter.js";
import majorRouter from "./routes/majorRouter.js";
import userRouter from "./routes/userRouter.js";
import adminRouter from "./routes/adminRouter.js";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** Start of every API path. */
const BASE_URL = "/api/graduateTracer";

/** A request id sent by a proxy is only trusted if it is short and plain. */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,64}$/;

/* -------------------------------------------------------------------------- */
/*                                     App                                    */
/* -------------------------------------------------------------------------- */

// `lib/env.ts` already validated every setting when it was imported. This also
// stops the server at startup if the signing secret is unusable.
getJwtSecret();

const app = express();

// How many proxies sit in front of the API: 2 on Render behind the Vercel
// rewrite (Vercel, then Render's load balancer), 1 on Render alone. Too low and
// every visitor shares one rate limit; too high and a caller can forge an IP.
if (env.TRUST_PROXY !== undefined) {
  app.set("trust proxy", env.TRUST_PROXY);
}

app.use(
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const incoming = req.headers["x-request-id"];
      const id =
        typeof incoming === "string" && SAFE_REQUEST_ID.test(incoming)
          ? incoming
          : randomUUID();
      res.setHeader("X-Request-Id", id);
      return id;
    },
    // Health checks run every few seconds; they would drown the log.
    autoLogging: { ignore: (req) => (req.url ?? "").includes("/health") },
    serializers: {
      // Never log the query string or the headers.
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: (req.url as string).split("?")[0],
      }),
    },
  }),
);

app.use(
  helmet({
    // This API returns JSON and CSV only: nothing may load or frame anything.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" },
  }),
);
app.use(
  cors({
    origin: env.CLIENT_URL,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "X-Requested-With"],
    // Lets the browser send the admin session cookie. This is safe only because
    // the origins above are an explicit list, never "*".
    credentials: true,
    // Browsers may cache the preflight answer for 10 minutes.
    maxAge: 600,
  }),
);

// Before the rate limiter: a health check must never use up anyone's quota.
app.use(`${BASE_URL}/health`, healthRouter);

app.use(express.json({ limit: "100kb", strict: true }));
app.use(cookieParser());
app.use(BASE_URL, generalLimiter);
app.use(BASE_URL, auditLog);

// Admin and session responses carry personal data: never cache them.
app.use(`${BASE_URL}/auth`, noStore);
app.use(`${BASE_URL}/admin`, noStore);

app.use(`${BASE_URL}/auth`, authRouter);
app.use(`${BASE_URL}/department`, departmentRouter);
app.use(`${BASE_URL}/program`, programRouter);
app.use(`${BASE_URL}/major`, majorRouter);
app.use(`${BASE_URL}/user`, userRouter);
app.use(`${BASE_URL}/admin`, adminRouter);

/** Answers `404` for every path that no router handled. */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

/**
 * Answers for every error that reached Express: a body that is too large
 * (`413`), a body that is not valid JSON (`400`), or an error thrown outside a
 * controller's own `try/catch` (`500`).
 *
 * @remarks
 * Express recognizes an error handler by its four parameters, so `_next` must
 * stay even though it is not used. Search the log for `[server]` to find the
 * original error; `requestId` matches it to the request.
 */
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 500;

  if (status === 413) {
    res.status(413).json({ message: "The request body is too large" });
    return;
  }

  if (status >= 400 && status < 500) {
    res.status(400).json({ message: "The request body is not valid" });
    return;
  }

  req.log.error({ err: error }, "[server] Unhandled error");
  res.status(500).json({ message: SERVER_ERROR_MESSAGE });
});

export default app;
