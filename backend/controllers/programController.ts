/**
 * Program API controller for the Graduate Tracer module.
 *
 * @remarks
 * Lets the application add, rename, remove and list programs (courses). Every
 * program belongs to exactly one department and can have many majors.
 *
 * **Endpoints**
 *
 * Every path starts with `/api/graduateTracer/program`. The original route
 * comments do not state HTTP methods. The handlers do not depend on the
 * method, so they work with whatever your router registers.
 *
 * | Handler         | Path                    |
 * | --------------- | ----------------------- |
 * | `addProgram`    | `/add/:departmentId`    |
 * | `editProgram`   | `/edit/:programId`      |
 * | `removeProgram` | `/remove/:programId`    |
 * | `listProgram`   | `/list`                 |
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
 * Program names are trimmed and saved in upper case, and must be unique across
 * all departments. (The original code saved the name as typed when adding but
 * in upper case when editing. Both now use upper case.)
 *
 * **Important: survey data refers to programs by name**
 *
 * Survey responses and graduate totals appear to store the program name as
 * plain text (the admin statistics code filters them with the program name).
 * Renaming or removing a program does NOT update or delete those existing
 * records. They keep the old name and stop matching any program in the list.
 *
 * **Debugging guide**
 *
 * - A `400` response: check `parseProgramName` or `parseId`.
 * - A `404` or `409` response: it comes from an explicit check in the handler
 *   or from `handleError` (Prisma codes `P2025`, `P2002` and `P2003`).
 * - A `500` response: search the server log for `[program.controller]`. The
 *   line contains the handler name and the original error.
 *
 * **Security note**
 *
 * The original route comments mark these endpoints as public. Anyone who can
 * reach the write endpoints (`add`, `edit`, `remove`) can change or delete
 * programs. Mount them behind your admin authentication middleware.
 * Authentication is not handled in this file.
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

/** Longest program name that is accepted. */
const MAX_PROGRAM_NAME_LENGTH = 150;

/** Message sent with a `400` when the program name is missing or invalid. */
const INVALID_NAME_MESSAGE = `Please provide a program name (1 to ${MAX_PROGRAM_NAME_LENGTH} characters)`;

/** Message sent with a `400` when an id in the URL is not valid. */
const INVALID_ID_MESSAGE = "A valid id is required";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * Request body used by `addProgram` and `editProgram`.
 *
 * @remarks
 * The value is typed as `unknown` on purpose: clients can send anything, so it
 * is checked by `parseProgramName` before it is used.
 */
type ProgramBody = {
  program?: unknown;
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
 * Validates a program name and normalizes it.
 *
 * @remarks
 * Names are trimmed and converted to upper case, so `" bsit "` and `"BSIT"` are
 * the same program.
 *
 * @param value - The raw value from the request body.
 * @returns The normalized name, or `null` if it is not a non-empty string of at
 * most `MAX_PROGRAM_NAME_LENGTH` characters.
 */
const parseProgramName = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim().toUpperCase();
  if (name === "" || name.length > MAX_PROGRAM_NAME_LENGTH) {
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
 * - `P2002`: the program name is already used, answer `409`.
 * - `P2003`: a related record is missing or still in use (for example majors
 *   that belong to the program), answer `409`.
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
      res.status(404).json({ message: "Program not found" });
      return;
    }

    if (error.code === "P2002") {
      res
        .status(409)
        .json({ message: "A program with that name already exists" });
      return;
    }

    if (error.code === "P2003") {
      res.status(409).json({
        message:
          "The department does not exist, or this program is still used by other records, such as majors",
      });
      return;
    }
  }

  // Replace with your logger (pino, winston) if the project has one.
  console.error(`[program.controller] ${handlerName} failed:`, error);
  res
    .status(500)
    .json({ message: "An unexpected error occurred. Please try again later." });
};

/* -------------------------------------------------------------------------- */
/*                                 Controllers                                */
/* -------------------------------------------------------------------------- */

/**
 * Adds a new program to a department.
 *
 * @remarks
 * **Route:** `/add/:departmentId`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * The name is trimmed and saved in upper case. The department must exist, and
 * no program may already use the name. For full protection against two
 * requests arriving at the same time, also add a unique constraint on the
 * program name in `schema.prisma`. This handler already turns that database
 * error into a `409`.
 *
 * **Responses:** `201` with a confirmation message. `400` if the department id
 * or the name is invalid. `404` if the department does not exist. `409` if the
 * program name is already used. `500` on unexpected errors.
 *
 * @param req - Expects the `departmentId` in the URL and a JSON body with
 * `program`.
 *
 * @example
 * ```
 * /api/graduateTracer/program/add/1
 * ```
 * ```json
 * { "program": "bsit" }
 * ```
 * Response `201`:
 * ```json
 * { "message": "BSIT is successfully created" }
 * ```
 */
const addProgram = asyncHandler(
  async (
    req: Request<{ departmentId: string }, unknown, ProgramBody>,
    res: Response,
  ) => {
    const departmentId = parseId(req.params.departmentId);
    if (departmentId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    const name = parseProgramName(req.body?.program);
    if (!name) {
      res.status(400).json({ message: INVALID_NAME_MESSAGE });
      return;
    }

    try {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });

      if (!department) {
        res.status(404).json({
          message: `The department with id ${departmentId} does not exist`,
        });
        return;
      }

      const existing = await prisma.program.findFirst({
        where: { program: name },
      });

      if (existing) {
        res.status(409).json({ message: `The program ${name} already exists` });
        return;
      }

      const created = await prisma.program.create({
        data: { program: name, departmentId },
      });

      res
        .status(201)
        .json({ message: `${created.program} is successfully created` });
    } catch (error) {
      handleError(res, "addProgram", error);
    }
  },
);

/**
 * Renames an existing program.
 *
 * @remarks
 * **Route:** `/edit/:programId`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * The new name is normalized the same way as in `addProgram` (trimmed, upper
 * case). Renaming a program to its current name is allowed. Renaming it to the
 * name of a different program is rejected. The department of the program
 * cannot be changed here.
 *
 * Survey responses and graduate totals that already use the old name are not
 * updated (see "Important: survey data refers to programs by name" at the top
 * of this file).
 *
 * **Responses:** `200` with a confirmation message. `400` if the id or the name
 * is invalid. `404` if no program has that id. `409` if another program already
 * uses the name. `500` on unexpected errors.
 *
 * @param req - Expects the `programId` in the URL and a JSON body with the new
 * `program` name.
 *
 * @example
 * ```
 * /api/graduateTracer/program/edit/4
 * ```
 * ```json
 * { "program": "BS Information Technology" }
 * ```
 */
const editProgram = asyncHandler(
  async (
    req: Request<{ programId: string }, unknown, ProgramBody>,
    res: Response,
  ) => {
    const programId = parseId(req.params.programId);
    if (programId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    const name = parseProgramName(req.body?.program);
    if (!name) {
      res.status(400).json({ message: INVALID_NAME_MESSAGE });
      return;
    }

    try {
      // Another program (any id except this one) must not use the name.
      const nameTaken = await prisma.program.findFirst({
        where: { program: name, NOT: { id: programId } },
      });

      if (nameTaken) {
        res.status(409).json({ message: `The program ${name} already exists` });
        return;
      }

      // update() throws P2025 when the id does not exist: handleError sends 404.
      const updated = await prisma.program.update({
        where: { id: programId },
        data: { program: name },
      });

      res
        .status(200)
        .json({ message: `${updated.program} is successfully updated` });
    } catch (error) {
      handleError(res, "editProgram", error);
    }
  },
);

/**
 * Permanently deletes a program.
 *
 * @remarks
 * **Route:** `/remove/:programId`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * This cannot be undone. What happens to the majors of the program depends on
 * the relation in `schema.prisma`:
 *
 * - Without `onDelete: Cascade`, the database refuses to delete a program that
 *   still has majors, and this handler answers `409`.
 * - With `onDelete: Cascade`, the majors are deleted together with the program.
 *   Check your schema before using this endpoint.
 *
 * Survey responses and graduate totals that already use the program name are
 * not deleted (see "Important: survey data refers to programs by name" at the
 * top of this file).
 *
 * **Responses:** `200` with a confirmation message. `400` if the id is invalid.
 * `404` if no program has that id. `409` if other records still use the
 * program. `500` on unexpected errors.
 *
 * @param req - Expects the `programId` in the URL.
 *
 * @example
 * ```
 * /api/graduateTracer/program/remove/4
 * ```
 */
const removeProgram = asyncHandler(
  async (req: Request<{ programId: string }>, res: Response) => {
    const programId = parseId(req.params.programId);
    if (programId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    try {
      // delete() throws P2025 when the id does not exist: handleError sends 404.
      const removed = await prisma.program.delete({ where: { id: programId } });

      res
        .status(200)
        .json({ message: `${removed.program} is successfully deleted` });
    } catch (error) {
      handleError(res, "removeProgram", error);
    }
  },
);

/**
 * Lists all programs, sorted by name.
 *
 * @remarks
 * **Route:** `/list`. **Access:** public.
 *
 * Always answers with a JSON array. When there are no programs the array is
 * empty. (The original code answered with a plain text message in that case,
 * which forced clients to handle two different response types.)
 *
 * **Responses:** `200` with a list of programs. `500` on unexpected errors.
 *
 * @example
 * ```json
 * [
 *   { "id": 5, "program": "BSCS", "departmentId": 1 },
 *   { "id": 4, "program": "BSIT", "departmentId": 1 }
 * ]
 * ```
 */
const listProgram = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const programs = await prisma.program.findMany({
      orderBy: { program: "asc" },
    });

    res.status(200).json(programs);
  } catch (error) {
    handleError(res, "listProgram", error);
  }
});

export default {
  addProgram,
  editProgram,
  removeProgram,
  listProgram,
};