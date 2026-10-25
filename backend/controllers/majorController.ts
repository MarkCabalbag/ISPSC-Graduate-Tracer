/**
 * Major API controller for the Graduate Tracer module.
 *
 * @remarks
 * Lets the application add, rename, remove and list majors, and list the
 * majors that belong to one program. Every major belongs to exactly one
 * program.
 *
 * **Endpoints**
 *
 * Every path starts with `/api/graduateTracer/major`. The HTTP methods below
 * match the original route comments. The handlers themselves do not depend on
 * the method, so they work with whatever your router registers.
 *
 * | Handler           | Method and path          |
 * | ----------------- | ------------------------ |
 * | `addMajor`        | `POST /add/:programId`   |
 * | `editMajor`       | `POST /edit/:majorId`    |
 * | `removeMajor`     | `POST /remove/:majorId`  |
 * | `listMajor`       | `GET /list`              |
 * | `getRelatedMajor` | `POST /:programId`       |
 *
 * **How every handler is built**
 *
 * 1. Validate the input. Answer `400` if it is invalid.
 * 2. Read or write the database with Prisma.
 * 3. Answer with JSON.
 * 4. If something fails, `handleError` maps known database errors to a clear
 *    status code (`404` or `409`). Anything else is logged and answered with a
 *    generic `500`, so internal details are never sent to clients.
 *
 * **Naming rule**
 *
 * Major names are trimmed and saved in upper case. A name must be unique inside
 * its program: two different programs may each have a major with the same
 * name. To make names unique across all programs instead, remove `programId`
 * from the duplicate checks in `addMajor` and `editMajor`.
 *
 * **Debugging guide**
 *
 * - A `400` response: check `parseMajorName` or `parseId`.
 * - A `404` or `409` response: it comes from an explicit check in the handler
 *   or from `handleError` (Prisma codes `P2025`, `P2002` and `P2003`).
 * - A `500` response: search the server log for `[major.controller]`. The line
 *   contains the handler name and the original error.
 *
 * **Security note**
 *
 * The original route comments mark the write endpoints (`add`, `edit`,
 * `remove`) as public. Anyone who can reach them can change or delete majors.
 * Mount them behind your admin authentication middleware. Authentication is
 * not handled in this file.
 *
 * @packageDocumentation
 */

import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Prisma } from "../src/generated/prisma/client.js";
import prisma from "../lib/prisma.js";


/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** Longest major name that is accepted. */
const MAX_MAJOR_NAME_LENGTH = 100;

/** Message sent with a `400` when the major name is missing or invalid. */
const INVALID_NAME_MESSAGE = `Please provide a major name (1 to ${MAX_MAJOR_NAME_LENGTH} characters)`;

/** Message sent with a `400` when an id in the URL is not valid. */
const INVALID_ID_MESSAGE = "A valid id is required";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * Request body used by `addMajor` and `editMajor`.
 *
 * @remarks
 * The value is typed as `unknown` on purpose: clients can send anything, so it
 * is checked by `parseMajorName` before it is used.
 */
type MajorBody = {
  major?: unknown;
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Converts a URL parameter to a positive whole number.
 *
 * @param value - The raw URL parameter, for example `"12"`.
 * @returns The number, or `null` if it is missing or not a positive integer.
 */
const parseId = (value: string | undefined): number | null => {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

/**
 * Validates a major name and normalizes it.
 *
 * @remarks
 * Names are trimmed and converted to upper case, so `" networking "` and
 * `"NETWORKING"` are the same major.
 *
 * @param value - The raw value from the request body.
 * @returns The normalized name, or `null` if it is not a non-empty string of at
 * most `MAX_MAJOR_NAME_LENGTH` characters.
 */
const parseMajorName = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim().toUpperCase();
  if (name === "" || name.length > MAX_MAJOR_NAME_LENGTH) {
    return null;
  }

  return name;
};

/**
 * Answers with the right error for a failed request.
 *
 * @remarks
 * Known Prisma error codes become clear client errors:
 *
 * - `P2025`: the record does not exist, answer `404`.
 * - `P2002`: the major name is already used, answer `409`.
 * - `P2003`: a related record is missing or still in use, answer `409`.
 *
 * Every other error is logged on the server and answered with a generic `500`.
 *
 * @param res - The Express response.
 * @param handlerName - Name of the failing handler, used to find it in logs.
 * @param error - The caught error.
 */
const handleError = (
  res: Response,
  handlerName: string,
  error: unknown,
): void => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Major not found" });
      return;
    }

    if (error.code === "P2002") {
      res
        .status(409)
        .json({ message: "A major with that name already exists" });
      return;
    }

    if (error.code === "P2003") {
      res.status(409).json({
        message:
          "The related program does not exist, or this major is still used by other records",
      });
      return;
    }
  }

  // Replace with your logger (pino, winston) if the project has one.
  console.error(`[major.controller] ${handlerName} failed:`, error);
  res
    .status(500)
    .json({ message: "An unexpected error occurred. Please try again later." });
};

/* -------------------------------------------------------------------------- */
/*                                 Controllers                                */
/* -------------------------------------------------------------------------- */

/**
 * Adds a new major to a program.
 *
 * @remarks
 * **Route:** `POST /add/:programId`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * The name is trimmed and saved in upper case. The program must exist, and it
 * must not already have a major with the same name. For full protection
 * against two requests arriving at the same time, also add a unique constraint
 * on the major name and program in `schema.prisma`. This handler already turns
 * that database error into a `409`.
 *
 * **Responses:** `201` with a confirmation message. `400` if the program id or
 * the name is invalid. `404` if the program does not exist. `409` if the
 * program already has a major with that name. `500` on unexpected errors.
 *
 * @param req - Expects the `programId` in the URL and a JSON body with
 * `major`.
 *
 * @example
 * ```
 * POST /api/graduateTracer/major/add/4
 * ```
 * ```json
 * { "major": "networking" }
 * ```
 * Response `201`:
 * ```json
 * { "message": "The NETWORKING is successfully added" }
 * ```
 */
const addMajor = asyncHandler(
  async (
    req: Request<{ programId: string }, unknown, MajorBody>,
    res: Response,
  ) => {
    const programId = parseId(req.params.programId);
    if (programId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    const name = parseMajorName(req.body?.major);
    if (!name) {
      res.status(400).json({ message: INVALID_NAME_MESSAGE });
      return;
    }

    try {
      const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { id: true },
      });

      if (!program) {
        res.status(404).json({
          message: `The program with id ${programId} does not exist`,
        });
        return;
      }

      const existing = await prisma.major.findFirst({
        where: { major: name, programId },
      });

      if (existing) {
        res.status(409).json({
          message: `The major ${name} already exists in this program`,
        });
        return;
      }

      const created = await prisma.major.create({
        data: { major: name, programId },
      });

      res
        .status(201)
        .json({ message: `The ${created.major} is successfully added` });
    } catch (error) {
      handleError(res, "addMajor", error);
    }
  },
);

/**
 * Renames an existing major.
 *
 * @remarks
 * **Route:** `POST /edit/:majorId`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * The new name is normalized the same way as in `addMajor` (trimmed, upper
 * case). Renaming a major to its current name is allowed. Renaming it to the
 * name of another major in the same program is rejected.
 *
 * Survey responses may store the major name as plain text. If they do,
 * renaming a major does not update the responses that were already saved, and
 * they keep the old name.
 *
 * **Responses:** `200` with a confirmation message. `400` if the id or the name
 * is invalid. `404` if no major has that id. `409` if the program already has
 * another major with that name. `500` on unexpected errors.
 *
 * @param req - Expects the `majorId` in the URL and a JSON body with the new
 * `major` name.
 *
 * @example
 * ```
 * POST /api/graduateTracer/major/edit/7
 * ```
 * ```json
 * { "major": "Network Administration" }
 * ```
 */
const editMajor = asyncHandler(
  async (
    req: Request<{ majorId: string }, unknown, MajorBody>,
    res: Response,
  ) => {
    const majorId = parseId(req.params.majorId);
    if (majorId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    const name = parseMajorName(req.body?.major);
    if (!name) {
      res.status(400).json({ message: INVALID_NAME_MESSAGE });
      return;
    }

    try {
      // We need the program of this major to check for duplicate names in it.
      const current = await prisma.major.findUnique({
        where: { id: majorId },
        select: { id: true, programId: true },
      });

      if (!current) {
        res
          .status(404)
          .json({ message: `The major with id ${majorId} does not exist` });
        return;
      }

      // Another major (any id except this one) must not use the name.
      const nameTaken = await prisma.major.findFirst({
        where: {
          major: name,
          programId: current.programId,
          NOT: { id: majorId },
        },
      });

      if (nameTaken) {
        res.status(409).json({
          message: `The major ${name} already exists in this program`,
        });
        return;
      }

      const updated = await prisma.major.update({
        where: { id: majorId },
        data: { major: name },
      });

      res
        .status(200)
        .json({ message: `The ${updated.major} is successfully updated` });
    } catch (error) {
      handleError(res, "editMajor", error);
    }
  },
);

/**
 * Permanently deletes a major.
 *
 * @remarks
 * **Route:** `POST /remove/:majorId`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * This cannot be undone. Survey responses that already use this major name are
 * not deleted, but they will no longer match a major in the list.
 *
 * **Responses:** `200` with a confirmation message. `400` if the id is invalid.
 * `404` if no major has that id. `409` if other records still use the major.
 * `500` on unexpected errors.
 *
 * @param req - Expects the `majorId` in the URL.
 *
 * @example
 * ```
 * POST /api/graduateTracer/major/remove/7
 * ```
 */
const removeMajor = asyncHandler(
  async (req: Request<{ majorId: string }>, res: Response) => {
    const majorId = parseId(req.params.majorId);
    if (majorId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    try {
      // delete() throws P2025 when the id does not exist: handleError sends 404.
      const removed = await prisma.major.delete({ where: { id: majorId } });

      res
        .status(200)
        .json({ message: `The ${removed.major} is successfully removed` });
    } catch (error) {
      handleError(res, "removeMajor", error);
    }
  },
);

/**
 * Lists all majors, newest first.
 *
 * @remarks
 * **Route:** `GET /list`. **Access:** public.
 *
 * "Newest first" means the highest id first. The original code reversed the
 * database order in memory, which depended on the database returning rows in
 * insertion order. Sorting by id in the query makes the order explicit.
 *
 * **Responses:** `200` with a list of majors (an empty list when there are
 * none). `500` on unexpected errors.
 *
 * @example
 * ```json
 * [
 *   { "id": 7, "major": "NETWORKING", "programId": 4 },
 *   { "id": 6, "major": "WEB DEVELOPMENT", "programId": 4 }
 * ]
 * ```
 */
const listMajor = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const majors = await prisma.major.findMany({ orderBy: { id: "desc" } });

    res.status(200).json(majors);
  } catch (error) {
    handleError(res, "listMajor", error);
  }
});

/**
 * Lists the majors that belong to one program, sorted by name.
 *
 * @remarks
 * **Route:** `POST /:programId`. **Access:** public. This handler only reads
 * data.
 *
 * First checks that the program exists, so an unknown id gets a clear `404`
 * instead of an empty list. A program without majors returns an empty array.
 *
 * **Responses:** `200` with a list of majors. `400` if the id is invalid. `404`
 * if no program has that id. `500` on unexpected errors.
 *
 * @param req - Expects `programId` in the URL.
 *
 * @example
 * ```
 * POST /api/graduateTracer/major/4
 * ```
 * Response `200`:
 * ```json
 * [{ "id": 7, "major": "NETWORKING", "programId": 4 }]
 * ```
 */
const getRelatedMajor = asyncHandler(
  async (req: Request<{ programId: string }>, res: Response) => {
    const programId = parseId(req.params.programId);
    if (programId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    try {
      const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { id: true },
      });

      if (!program) {
        res.status(404).json({
          message: `The program with id ${programId} does not exist`,
        });
        return;
      }

      const majors = await prisma.major.findMany({
        where: { programId },
        orderBy: { major: "asc" },
      });

      res.status(200).json(majors);
    } catch (error) {
      handleError(res, "getRelatedMajor", error);
    }
  },
);

export default {
  addMajor,
  editMajor,
  removeMajor,
  listMajor,
  getRelatedMajor,
};