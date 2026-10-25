/**
 * Auth API controller for the Graduate Tracer module.
 *
 * @remarks
 * Lets the admin sign in, sign out and check the current session. There is one
 * admin account, kept in environment variables, so no database table is needed.
 *
 * **Endpoints**
 *
 * Every path starts with `/api/graduateTracer/auth`.
 *
 * | Handler  | Method and path | Access                      |
 * | -------- | --------------- | --------------------------- |
 * | `login`  | `POST /login`   | public, limited by `loginLimiter` |
 * | `logout` | `POST /logout`  | public                      |
 * | `me`     | `GET /me`       | admin                       |
 *
 * **How the session works**
 *
 * `login` does not return the token in the answer. It sets it in an `HttpOnly`
 * cookie, so page scripts can never read it. The cookie is `SameSite=Strict`,
 * limited to the API path, and `Secure` (HTTPS only) when `NODE_ENV` is
 * `production`. The browser sends it automatically; the frontend must send its
 * requests with `credentials: "include"`.
 *
 * **Environment variables**
 *
 * - `ADMIN_USERNAME`: the admin's username.
 * - `ADMIN_PASSWORD_HASH`: the bcrypt hash of the admin's password. Never store
 *   the password itself. Create the hash with
 *   `node -e "console.log(require('bcryptjs').hashSync('your-password', 12))"`
 *   and put it in single quotes in `.env`, because it contains `$` characters:
 *   `ADMIN_PASSWORD_HASH='$2b$12$...'`
 * - `JWT_SECRET`: see `requireAdmin`.
 * - `NODE_ENV`: set to `production` on the live server so the cookie is only
 *   sent over HTTPS.
 *
 * **Logging out and stolen tokens**
 *
 * `logout` removes the cookie in the browser. The server keeps no session list,
 * so a token copied before logout stays valid until it expires. To end every
 * session at once (for example after a leak), change `JWT_SECRET` and restart.
 *
 * **Debugging guide**
 *
 * - A `400` response: the username or password is missing or not text.
 * - A `401` response: wrong username or password. The answer is the same for
 *   both on purpose, so an attacker cannot learn which one was wrong.
 * - A `500` response: search the server log for `[auth.controller]`. The most
 *   common cause is a missing environment variable.
 *
 * @packageDocumentation
 */

import type { CookieOptions, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, timingSafeEqual } from "crypto";
import { ADMIN_COOKIE_NAME, getJwtSecret } from "../middleware/requireAdmin.js";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** How long a session stays valid, in seconds (8 hours). */
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;

/** Longest username or password that is accepted. */
const MAX_CREDENTIAL_LENGTH = 200;

/**
 * Cookie settings. They must be the same when the cookie is set and when it is
 * removed, or the browser keeps the old cookie.
 */
const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/graduateTracer",
});

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/** Request body used by `login`. */
type LoginBody = {
  username?: unknown;
  password?: unknown;
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Compares two texts in constant time.
 *
 * @remarks
 * Both texts are hashed first, so they always have the same length and the
 * comparison time does not reveal how many characters matched.
 *
 * @param a - The first text.
 * @param b - The second text.
 * @returns `true` if both texts are identical.
 */
const safeEqual = (a: string, b: string): boolean => {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
};

/**
 * Checks that a value is a usable username or password.
 *
 * @param value - The raw value from the request body.
 * @returns The value, or `null` if it is not a non-empty string of at most
 * `MAX_CREDENTIAL_LENGTH` characters.
 */
const parseCredential = (value: unknown): string | null => {
  if (
    typeof value !== "string" ||
    value === "" ||
    value.length > MAX_CREDENTIAL_LENGTH
  ) {
    return null;
  }

  return value;
};

/* -------------------------------------------------------------------------- */
/*                                 Controllers                                */
/* -------------------------------------------------------------------------- */

/**
 * Signs the admin in and starts a session.
 *
 * @remarks
 * **Route:** `POST /login`. **Access:** public, limited by `loginLimiter`.
 *
 * The password check always runs, even when the username is wrong, so the
 * answer takes the same time either way. The session lasts 8 hours and is
 * stored in an `HttpOnly` cookie.
 *
 * **Responses:** `200` with the session length. `400` if the body is invalid.
 * `401` if the username or password is wrong. `403` if the CSRF header is
 * missing. `429` if there were too many attempts. `500` on unexpected errors.
 *
 * @param req - Expects a JSON body with `username` and `password`.
 *
 * @example
 * ```json
 * { "username": "admin", "password": "your-password" }
 * ```
 * Response `200` (the token is in the `Set-Cookie` header, not in the body):
 * ```json
 * { "message": "Signed in", "expiresIn": 28800 }
 * ```
 */
const login = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, LoginBody>,
    res: Response,
  ) => {
    const username = parseCredential(req.body?.username);
    const password = parseCredential(req.body?.password);

    if (username === null || password === null) {
      res
        .status(400)
        .json({ message: "Please provide your username and password" });
      return;
    }

    try {
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

      if (!adminUsername || !adminPasswordHash) {
        throw new Error("ADMIN_USERNAME or ADMIN_PASSWORD_HASH is not set");
      }

      // Run both checks every time, so a wrong username is not faster to reject.
      const passwordOk = await bcrypt.compare(password, adminPasswordHash);
      const usernameOk = safeEqual(username, adminUsername);

      if (!usernameOk || !passwordOk) {
        res.status(401).json({ message: "Invalid username or password" });
        return;
      }

      const token = jwt.sign({ role: "admin" }, getJwtSecret(), {
        algorithm: "HS256",
        expiresIn: SESSION_LIFETIME_SECONDS,
        subject: adminUsername,
      });

      res.cookie(ADMIN_COOKIE_NAME, token, {
        ...cookieOptions(),
        maxAge: SESSION_LIFETIME_SECONDS * 1000,
      });

      res
        .status(200)
        .json({ message: "Signed in", expiresIn: SESSION_LIFETIME_SECONDS });
    } catch (error) {
      // Replace with your logger (pino, winston) if the project has one.
      console.error("[auth.controller] login failed:", error);
      res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
      });
    }
  },
);

/**
 * Signs the admin out by removing the session cookie.
 *
 * @remarks
 * **Route:** `POST /logout`. **Access:** public (removing a cookie that is not
 * there does nothing).
 *
 * **Responses:** `200` with a confirmation message. `403` if the CSRF header is
 * missing.
 */
const logout = (_req: Request, res: Response): void => {
  res.clearCookie(ADMIN_COOKIE_NAME, cookieOptions());
  res.status(200).json({ message: "Signed out" });
};

/**
 * Tells the frontend whether the admin is signed in, and until when.
 *
 * @remarks
 * **Route:** `GET /me`. **Access:** admin. The frontend calls it when the page
 * loads, because it cannot read the `HttpOnly` cookie itself.
 *
 * **Responses:** `200` with `authenticated` and `expiresAt` (milliseconds since
 * 1970). `401` if there is no valid session.
 */
const me = (_req: Request, res: Response): void => {
  res.status(200).json({
    authenticated: true,
    expiresAt: res.locals.adminExpiresAt as number,
  });
};

export default {
  login,
  logout,
  me,
};