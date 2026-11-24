import type { Response } from "express";
import { logger } from "../lib/logger.js";

/** Message sent for every unexpected error. It never contains error details. */
export const SERVER_ERROR_MESSAGE =
  "An unexpected error occurred. Please try again later.";

/**
 * Logs an unexpected error on the server and answers `500` with a generic
 * message, so internals (stack traces, SQL, personal data) never reach clients.
 *
 * @param res - The Express response.
 * @param scope - Where it happened, for example `"user.controller addResponse"`.
 * @param error - The caught error.
 */
export const sendServerError = (
  res: Response,
  scope: string,
  error: unknown,
): void => {
  // `res.req.log` carries the request id; fall back for code outside a request.
  (res.req?.log ?? logger).error({ err: error }, `[${scope}] failed`);
  res.status(500).json({ message: SERVER_ERROR_MESSAGE });
};
