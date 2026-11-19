import jwt from "jsonwebtoken";
import { TEST_ADMIN_USERNAME, TEST_JWT_SECRET } from "./setup.js";

/** Header the API requires on data-changing requests (CSRF protection). */
export const CSRF = { "X-Requested-With": "XMLHttpRequest" };

/** Builds the `Cookie` header of a signed-in admin. */
export const adminCookie = (
  claims: Record<string, unknown> = { role: "admin" },
  secret: string = TEST_JWT_SECRET,
  expiresIn: number = 60,
): string[] => {
  const token = jwt.sign(claims, secret, {
    algorithm: "HS256",
    subject: TEST_ADMIN_USERNAME,
    expiresIn,
  });
  return [`gt_admin=${token}`];
};
