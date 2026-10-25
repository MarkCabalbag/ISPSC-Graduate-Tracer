/**
 * User routes for the Graduate Tracer module.
 *
 * @remarks
 * Mounted in `server.ts` under `/api/graduateTracer/user`. The method and path
 * are the same as in the original JavaScript router. The handler is documented
 * in `userController`.
 *
 * | Method | Path             | Handler       | Access                     |
 * | ------ | ---------------- | ------------- | -------------------------- |
 * | `POST` | `/add/response`  | `addResponse` | public, `surveyLimiter`    |
 *
 * **Access**
 *
 * This route is public on purpose: graduates submit the survey without an
 * account. `surveyLimiter` caps submissions per IP address so the route cannot
 * be flooded with fake responses or used to send many emails.
 *
 * @packageDocumentation
 */

import { Router } from "express";
import userController from "../controllers/userController.js";
import { surveyLimiter } from "../middleware/rateLimiters.js";

const userRouter = Router();

// Save a graduate's survey response.
userRouter.post("/add/response", surveyLimiter, userController.addResponse);

export default userRouter;