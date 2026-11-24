/**
 * Structured logger (pino). One JSON line per event, so a production incident can
 * be traced by request id in the Render log stream.
 *
 * Personal data and secrets are redacted by path: a careless `logger.error({ err })`
 * must never print a password, a session cookie, or a graduate's name or email.
 * Request URLs are logged without their query string.
 */
import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.LOG_LEVEL ?? (env.NODE_ENV === "production" ? "info" : env.NODE_ENV === "test" ? "silent" : "debug"),
  base: { service: "graduate-tracer-api" },
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      'res.headers["set-cookie"]',
      "*.password",
      "*.passwordHash",
      "*.email",
      "*.fullName",
    ],
    censor: "[redacted]",
  },
  ...(env.NODE_ENV === "development"
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
});
