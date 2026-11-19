import type { NextFunction, Request, Response } from "express";

/**
 * Tells browsers and proxies never to cache the response.
 *
 * Use it on routes that return personal data (admin routes) or session state,
 * so graduate details are not left in a shared or browser cache.
 */
const noStore = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader("Cache-Control", "no-store");
  next();
};

export default noStore;
