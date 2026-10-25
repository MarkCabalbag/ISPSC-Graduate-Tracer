/**
 * Server entry point for the Graduate Tracer API.
 *
 * @remarks
 * Creates the Express app, registers the middleware and the routers, and starts
 * listening.
 *
 * **Routes**
 *
 * Every router is mounted under `/api/graduateTracer`.
 *
 * | Router             | Path                           |
 * | ------------------ | ------------------------------ |
 * | `departmentRouter` | `/api/graduateTracer/department` |
 * | `programRouter`    | `/api/graduateTracer/program`    |
 * | `majorRouter`      | `/api/graduateTracer/major`      |
 * | `userRouter`       | `/api/graduateTracer/user`       |
 * | `adminRouter`      | `/api/graduateTracer/admin`      |
 *
 * **Environment variables**
 *
 * - `PORT`: the port to listen on. Defaults to `7000` when it is missing or not
 *   a valid port number. (The original code printed `undefined` in the startup
 *   message when `PORT` was not set. The message now shows the port that is
 *   really used.)
 * - Variables are loaded from the `.env` file by `dotenv/config`, which must be
 *   imported before any file that reads `process.env` (for example the email
 *   helper).
 *
 * **Errors**
 *
 * Unknown paths answer `404` and uncaught errors answer `500`, both as JSON, so
 * clients never receive an HTML error page or a stack trace.
 *
 * **Security**
 *
 * - `helmet()` adds the standard protective HTTP headers.
 * - CORS only allows the frontend addresses in `CLIENT_URL` (comma separated).
 *   If it is not set, only `http://localhost:5173` is allowed.
 * - Request bodies are limited to 100 KB.
 * - `generalLimiter` limits every API route per IP address.
 * - Admin routes and the write routes need the session cookie set by
 *   `/auth/login` (see `requireAdmin`). The cookie is `HttpOnly` and
 *   `SameSite=Strict`, and data-changing requests must also carry the
 *   `X-Requested-With` header. CORS allows credentials only for the origins in
 *   `CLIENT_URL`. The server will not start without a valid `JWT_SECRET`.
 *
 * **Environment variables used for security**
 *
 * `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `CLIENT_URL`,
 * `NODE_ENV` (set to `production` on the live server, so the cookie is sent
 * over HTTPS only) and `TRUST_PROXY` (set to `1` behind a proxy or host).
 *
 * @packageDocumentation
 */

import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRouter.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { getJwtSecret } from "./middleware/requireAdmin.js";
import departmentRouter from "./routes/departmentRouter.js";
import programRouter from "./routes/programRouter.js";
import majorRouter from "./routes/majorRouter.js";
import userRouter from "./routes/userRouter.js";
import adminRouter from "./routes/adminRouter.js";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** Port used when `PORT` is not set or is not valid. */
const DEFAULT_PORT = 7000;

/** Start of every API path. */
const BASE_URL = "/api/graduateTracer";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Reads the allowed frontend addresses from the environment.
 *
 * @param value - The raw `CLIENT_URL` value. Several addresses can be separated
 * by commas, for example `"https://tracer.ispsc.edu.ph,http://localhost:5173"`.
 * @returns The list of allowed origins. When `CLIENT_URL` is not set, only the
 * local Vite address (`http://localhost:5173`) is allowed, so a missing setting
 * never opens the API to every website.
 */
const parseAllowedOrigins = (value: string | undefined): string[] => {
  const origins = (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin !== "");

  return origins.length > 0 ? origins : ["http://localhost:5173"];
};

/**
 * Reads the port from the environment.
 *
 * @param value - The raw `PORT` value, for example `"5000"`.
 * @returns The port, or `DEFAULT_PORT` if it is missing or not a whole number
 * from 1 to 65535.
 */
const parsePort = (value: string | undefined): number => {
  if (!value || !/^\d+$/.test(value)) {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  return port >= 1 && port <= 65535 ? port : DEFAULT_PORT;
};

/* -------------------------------------------------------------------------- */
/*                                     App                                    */
/* -------------------------------------------------------------------------- */

// Stop the server at startup if the token secret is missing or too short.
getJwtSecret();

const app = express();

// Behind a proxy or host (Render, Railway, Nginx), set TRUST_PROXY=1 in .env so
// the rate limits see each visitor's real IP address and not the proxy's.
if (process.env.TRUST_PROXY) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
}

app.use(helmet());
app.use(
  cors({
    origin: parseAllowedOrigins(process.env.CLIENT_URL),
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "X-Requested-With"],
    // Lets the browser send the admin session cookie. This is safe only because
    // the origins above are an explicit list, never "*".
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(BASE_URL, generalLimiter);

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
 * Answers `500` for every error that reached Express (for example a body that
 * is not valid JSON, or an error thrown outside a controller's own `try/catch`).
 *
 * @remarks
 * Express recognizes an error handler by its four parameters, so `_next` must
 * stay even though it is not used. Search the log for `[server]` to find the
 * original error.
 */
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 400
      ? 400
      : 500;

  if (status === 400) {
    res.status(400).json({ message: "The request body is not valid" });
    return;
  }

  // Replace with your logger (pino, winston) if the project has one.
  console.error("[server] Unhandled error:", error);
  res
    .status(500)
    .json({ message: "An unexpected error occurred. Please try again later." });
});

const port = parsePort(process.env.PORT);

app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});