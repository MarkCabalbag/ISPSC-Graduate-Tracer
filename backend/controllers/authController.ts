/**
 * Auth API controller for the Graduate Tracer module.
 *
 * @remarks
 * Lets an admin sign in, sign out and check the current session. Admin accounts
 * live in the `Admin` table. The first one is seeded from the environment
 * (`prisma/seed.ts`); add or reset more with the admin CLI (`scripts/admin.ts`).
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
 * - `JWT_SECRET`: see `requireAdmin`.
 * - `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`: used only by `prisma/seed.ts` to
 *   create the first admin. Login reads the `Admin` table, not these.
 * - `NODE_ENV`: set to `production` on the live server so the cookie is only
 *   sent over HTTPS.
 *
 * **Logging out and stolen tokens**
 *
 * `logout` removes the cookie in the browser only: a token copied before logout
 * stays valid until it expires or is revoked. To end one admin's sessions at
 * once (after a leak, a password reset or a departure) run
 * `npm run admin:signout-all -- --username x` (or `admin:reset`, which does the
 * same), or delete the admin. To end every admin's sessions, change `JWT_SECRET`
 * and restart.
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
import prisma from "../lib/prisma.js";
import { env } from "../lib/env.js";
import {
  ADMIN_COOKIE_NAME,
  JWT_AUDIENCE,
  JWT_ISSUER,
  getJwtSecret,
} from "../middleware/requireAdmin.js";

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
  secure: env.NODE_ENV === "production",
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
 * A real bcrypt hash, computed once at startup. When the username is unknown,
 * the password is still compared against this, so a wrong username takes the
 * same time as a wrong password and the two cannot be told apart (no account
 * enumeration).
 */
const DUMMY_HASH = bcrypt.hashSync("unused-placeholder", 12);

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
      const admin = await prisma.admin.findUnique({ where: { username } });

      // Always compare against a hash, even when the account does not exist, so
      // the answer takes the same time and never reveals which part was wrong.
      const passwordOk = await bcrypt.compare(
        password,
        admin?.passwordHash ?? DUMMY_HASH,
      );

      if (!admin || !passwordOk) {
        res.status(401).json({ message: "Invalid username or password" });
        return;
      }

      // Record the sign-in. A failure here must not block the login.
      prisma.admin
        .update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
        .catch((error: unknown) =>
          req.log.error({ err: error }, "[auth.controller] lastLoginAt update failed"),
        );

      // `sv` ties the token to the admin's `sessionVersion`: raising it (password
      // reset, sign-out-all) or deleting the admin ends this session at once.
      const token = jwt.sign(
        { role: "admin", username: admin.username, sv: admin.sessionVersion },
        getJwtSecret(),
        {
          algorithm: "HS256",
          expiresIn: SESSION_LIFETIME_SECONDS,
          subject: String(admin.id),
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        },
      );

      res.cookie(ADMIN_COOKIE_NAME, token, {
        ...cookieOptions(),
        maxAge: SESSION_LIFETIME_SECONDS * 1000,
      });

      res
        .status(200)
        .json({ message: "Signed in", expiresIn: SESSION_LIFETIME_SECONDS });
    } catch (error) {
      req.log.error({ err: error }, "[auth.controller] login failed");
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
    username: (res.locals.adminUser as string | undefined) ?? null,
  });
};

export default {
  login,
  logout,
  me,
};