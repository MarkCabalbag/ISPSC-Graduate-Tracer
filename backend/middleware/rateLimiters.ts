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
 * | `loginLimiter`   | admin login, per IP         | 5 failures / 15 min   |
 * | `loginAccountLimiter` | admin login, per username | 10 failures / 15 min |
 * | `surveyLimiter`  | survey submission           | 30 requests / hour    |
 *
 * `surveyLimiter` is generous on purpose: many graduates on a school network
 * share one IP address. Lower it only if you see abuse.
 *
 * **Behind a proxy**
 *
 * Set `TRUST_PROXY` to the number of proxies in front of the API: 2 on Render
 * behind the Vercel `/api` rewrite, 1 on Render alone. A wrong number makes
 * every visitor look like the same IP (too low) or lets a caller forge their
 * address (too high). `loginAccountLimiter` also limits failures per username,
 * so a forged address cannot be used to guess one account's password.
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

/**
 * Limits failed logins per username, whatever the IP address. The per-IP limit
 * alone can be sidestepped by changing the (forwarded) address, so one account
 * could still be guessed at without end. Anyone can lock a username for 15
 * minutes by failing 10 times; that is the accepted cost of bounding guessing.
 */
export const loginAccountLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const body = req.body as { username?: unknown } | undefined;
    const name =
      typeof body?.username === "string"
        ? body.username.trim().toLowerCase().slice(0, 200)
        : "";
    return `login:${name}`;
  },
  // The key is the username, not an IP address.
  validate: { keyGeneratorIpFallback: false },
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