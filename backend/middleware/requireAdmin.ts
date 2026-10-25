/**
 * Admin authentication middleware for the Graduate Tracer module.
 *
 * @remarks
 * Lets a request through only when it carries a valid admin session cookie.
 * The cookie is created by `authController.login`, holds a token signed with
 * `JWT_SECRET`, and is `HttpOnly`: scripts running on the page can never read
 * it, so a cross-site scripting (XSS) bug cannot steal the session.
 *
 * **Protection against cross-site request forgery (CSRF)**
 *
 * Browsers send cookies automatically, so a malicious website could try to make
 * the admin's browser send a request. Three layers stop that:
 *
 * 1. The cookie is `SameSite=Strict`: browsers do not send it from other sites.
 * 2. CORS only allows the origins listed in `CLIENT_URL`.
 * 3. Requests that change data (`POST`, `PUT`, `PATCH`, `DELETE`) must carry the
 *    header `X-Requested-With: XMLHttpRequest`. A website cannot add a custom
 *    header without passing the CORS check first. The frontend `apiClient`
 *    adds this header to every non-`GET` request.
 *
 * **Responses:** `401` if the cookie is missing, invalid or expired. `403` if
 * the session belongs to someone who is not an admin, or the CSRF header is
 * missing. `500` if the server is misconfigured (for example `JWT_SECRET` is
 * missing).
 *
 * **Environment variables**
 *
 * - `JWT_SECRET`: a long random text of at least 32 characters. Generate one
 *   with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
 *
 * @packageDocumentation
 */

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

/** Name of the cookie that holds the admin session. */
export const ADMIN_COOKIE_NAME = "gt_admin";

/** Shortest `JWT_SECRET` that is accepted. */
const MIN_SECRET_LENGTH = 32;

/** Methods that change data and therefore need the CSRF header. */
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Value the frontend sends in the `X-Requested-With` header. */
const CSRF_HEADER_VALUE = "XMLHttpRequest";

/**
 * Reads the token signing secret from the environment.
 *
 * @returns The secret.
 * @throws If `JWT_SECRET` is missing or shorter than `MIN_SECRET_LENGTH`. Call
 * it once when the server starts so a bad setup stops the server immediately.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }

  return secret;
};

/**
 * Checks the CSRF header of a request that changes data.
 *
 * @param req - The Express request.
 * @returns `true` if the request is safe (it only reads data) or carries the
 * expected header.
 */
const passesCsrfCheck = (req: Request): boolean =>
  !UNSAFE_METHODS.has(req.method) ||
  req.get("X-Requested-With") === CSRF_HEADER_VALUE;

/**
 * Express middleware that rejects data-changing requests without the CSRF
 * header. Use it on routes that do not need a session, such as login and
 * logout. `requireAdmin` already includes this check.
 */
export const requireCsrfHeader = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!passesCsrfCheck(req)) {
    res.status(403).json({ message: "Invalid request" });
    return;
  }

  next();
};

/**
 * Express middleware that only lets admins through.
 *
 * @remarks
 * On success, `res.locals.adminExpiresAt` holds the time the session ends, in
 * milliseconds since 1970 (used by `GET /auth/me`).
 *
 * @example
 * ```ts
 * router.post("/add", requireAdmin, controller.add);
 * // or protect every route of a router:
 * router.use(requireAdmin);
 * ```
 */
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!passesCsrfCheck(req)) {
    res.status(403).json({ message: "Invalid request" });
    return;
  }

  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[ADMIN_COOKIE_NAME];

  if (typeof token !== "string" || token === "") {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (typeof payload === "string" || payload.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }

    res.locals.adminExpiresAt = (payload.exp ?? 0) * 1000;
    next();
  } catch (error) {
    // Includes expired tokens (TokenExpiredError extends JsonWebTokenError).
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: "Invalid or expired session" });
      return;
    }

    // Replace with your logger (pino, winston) if the project has one.
    console.error("[auth] requireAdmin failed:", error);
    res.status(500).json({
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};

export default requireAdmin;