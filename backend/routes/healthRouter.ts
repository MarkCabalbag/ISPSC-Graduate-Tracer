/**
 * Health endpoints for the host (Render) and uptime monitors.
 *
 * | Method | Path            | Answer                                                    |
 * | ------ | --------------- | --------------------------------------------------------- |
 * | `GET`  | `/health`       | `200 { status: "ok" }`. No database call: the process is up. |
 * | `GET`  | `/health/ready` | `200 { status: "ready" }` if the database answers, else `503`. |
 *
 * Mounted before the rate limiter so a health check never uses up a visitor's
 * quota. Neither answer reveals versions, host names or error details.
 */
import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import noStore from "../middleware/noStore.js";

const healthRouter = Router();

healthRouter.use(noStore);

healthRouter.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

healthRouter.get("/ready", async (req: Request, res: Response) => {
  try {
    // A fixed literal: no input reaches the query.
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready" });
  } catch (error) {
    req.log.error({ err: error }, "[health] database not ready");
    res.status(503).json({ status: "unavailable" });
  }
});

export default healthRouter;
