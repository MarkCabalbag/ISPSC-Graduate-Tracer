import jwt from "jsonwebtoken";
import { TEST_JWT_SECRET } from "./setup.js";

/** Header the API requires on data-changing requests (CSRF protection). */
export const CSRF = { "X-Requested-With": "XMLHttpRequest" };

/** Claims a real session token carries (see `authController.login`). */
export const TEST_ADMIN_ID = 1;
export const TEST_ISSUER = "ispsc-graduate-tracer";
export const TEST_AUDIENCE = "ispsc-graduate-tracer-admin";

/**
 * Builds the `Cookie` header of a signed-in admin. The default token matches
 * what `login` issues: admin id as subject, `sv` 0, issuer and audience.
 */
export const adminCookie = (
  claims: Record<string, unknown> = { role: "admin", sv: 0 },
  secret: string = TEST_JWT_SECRET,
  expiresIn: number = 60,
  options: { audience?: string | false; issuer?: string } = {},
): string[] => {
  const token = jwt.sign(claims, secret, {
    algorithm: "HS256",
    subject: String(TEST_ADMIN_ID),
    expiresIn,
    issuer: options.issuer ?? TEST_ISSUER,
    ...(options.audience === false
      ? {}
      : { audience: options.audience ?? TEST_AUDIENCE }),
  });
  return [`gt_admin=${token}`];
};
