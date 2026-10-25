/**
 * Rate limiters for the Graduate Tracer module.
 *
 * @remarks
 * Each limiter counts requests per IP address and answers `429` when the limit
 * is passed. The counters live in the server's memory, so they reset when the
 * server restarts and are not shared between several server instances.
 *
 * | Limiter          | Used for                    | Limit                 |
 * | ---------------- | --------------------------- | --------------------- |
 * | `generalLimiter` | every API route             | 300 requests / 15 min |
 * | `loginLimiter`   | admin login                 | 5 failures / 15 min   |
 * | `surveyLimiter`  | survey submission           | 30 requests / hour    |
 *
 * `surveyLimiter` is generous on purpose: many graduates on a school network
 * share one IP address. Lower it only if you see abuse.
 *
 * **Behind a proxy**
 *
 * If the server runs behind a proxy or host (Render, Railway, Nginx), set
 * `app.set("trust proxy", 1)` in `server.ts`. Otherwise every visitor looks
 * like the same IP and shares one limit.
 *
 * @packageDocumentation
 */

import rateLimit from "express-rate-limit";

/** Length of the counting window of the general and login limiters. */
const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** Length of the counting window of the survey limiter. */
const ONE_HOUR = 60 * 60 * 1000;

/** Limits every API route. */
export const generalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

/** Limits admin login attempts. Successful logins are not counted. */
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

/** Limits survey submissions, each of which also sends an email. */
export const surveyLimiter = rateLimit({
  windowMs: ONE_HOUR,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many submissions. Please try again later." },
});