/**
 * Auth routes for the Graduate Tracer module.
 *
 * @remarks
 * Mounted in `server.ts` under `/api/graduateTracer/auth`.
 *
 * | Method | Path       | Handler  | Notes                                      |
 * | ------ | ---------- | -------- | ------------------------------------------ |
 * | `POST` | `/login`   | `login`  | public, limited by `loginLimiter`          |
 * | `POST` | `/logout`  | `logout` | public                                     |
 * | `GET`  | `/me`      | `me`     | admin (needs the session cookie)           |
 *
 * `login` and `logout` change the session, so they require the CSRF header
 * (`X-Requested-With: XMLHttpRequest`), like every other data-changing admin
 * route. See `requireAdmin`.
 *
 * @packageDocumentation
 */

import { Router } from "express";
import authController from "../controllers/authController.js";
import { loginLimiter } from "../middleware/rateLimiters.js";
import requireAdmin, { requireCsrfHeader } from "../middleware/requireAdmin.js";

const authRouter = Router();

// Sign the admin in and start a session.
authRouter.post(
  "/login",
  loginLimiter,
  requireCsrfHeader,
  authController.login,
);

// Sign the admin out.
authRouter.post("/logout", requireCsrfHeader, authController.logout);

// Check the current session.
authRouter.get("/me", requireAdmin, authController.me);

export default authRouter;