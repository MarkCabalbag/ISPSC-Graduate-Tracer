/**
 * Department API controller for the Graduate Tracer module.
 *
 * @remarks
 * Lets the application add, rename, remove and list departments (colleges),
 * and list the programs that belong to a department.
 *
 * **Endpoints**
 *
 * Every path starts with `/api/graduateTracer/department`. The HTTP methods
 * below match the original route comments. The handlers themselves do not
 * depend on the method, so they work with whatever your router registers.
 *
 * | Handler             | Method and path                |
 * | ------------------- | ------------------------------ |
 * | `addDepartment`     | `POST /add`                    |
 * | `editDepartment`    | `POST /edit/:id`               |
 * | `removeDepartment`  | `POST /remove/:id`             |
 * | `departmentList`    | `GET /list`                    |
 * | `getRelatedProgram` | `POST /program/:departmentId`  |
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
 * **Debugging guide**
 *
 * - A `400` response: check `parseDepartmentName` or `parseId`.
 * - A `404` or `409` response: it comes from an explicit check in the handler
 *   or from `handleError` (Prisma codes `P2025`, `P2002` and `P2003`).
 * - A `500` response: search the server log for `[department.controller]`. The
 *   line contains the handler name and the original error.
 *
 * **Security note**
 *
 * Anyone who can reach the write endpoints (`add`, `edit`, `remove`) can change
 * or delete departments. `departmentRouter` puts `requireAdmin` in front of
 * them. Authentication is not handled in this file.
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

/** Longest department name that is accepted. */
const MAX_DEPARTMENT_NAME_LENGTH = 100;

/** Message sent with a `400` when the department name is missing or invalid. */
const INVALID_NAME_MESSAGE = `Please provide a department name (1 to ${MAX_DEPARTMENT_NAME_LENGTH} characters)`;

/** Message sent with a `400` when the id in the URL is not valid. */
const INVALID_ID_MESSAGE = "A valid department id is required";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * Request body used by `addDepartment` and `editDepartment`.
 *
 * @remarks
 * The value is typed as `unknown` on purpose: clients can send anything, so it
 * is checked by `parseDepartmentName` before it is used.
 */
type DepartmentBody = {
  department?: unknown;
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
 * Validates a department name and normalizes it.
 *
 * @remarks
 * Names are trimmed and converted to upper case, so `" cict "` and `"CICT"`
 * are the same department.
 *
 * @param value - The raw value from the request body.
 * @returns The normalized name, or `null` if it is not a non-empty string of at
 * most `MAX_DEPARTMENT_NAME_LENGTH` characters.
 */
const parseDepartmentName = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim().toUpperCase();
  if (name === "" || name.length > MAX_DEPARTMENT_NAME_LENGTH) {
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
 * - `P2002`: the department name is already used, answer `409`.
 * - `P2003`: other records (for example programs) still use this department,
 *   answer `409`.
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
      res.status(404).json({ message: "Department not found" });
      return;
    }

    if (error.code === "P2002") {
      res
        .status(409)
        .json({ message: "A department with that name already exists" });
      return;
    }

    if (error.code === "P2003") {
      res.status(409).json({
        message:
          "This department is still used by other records, such as programs, and cannot be removed",
      });
      return;
    }
  }

  // Replace with your logger (pino, winston) if the project has one.
  console.error(`[department.controller] ${handlerName} failed:`, error);
  res
    .status(500)
    .json({ message: "An unexpected error occurred. Please try again later." });
};

/* -------------------------------------------------------------------------- */
/*                                 Controllers                                */
/* -------------------------------------------------------------------------- */

/**
 * Adds a new department.
 *
 * @remarks
 * **Route:** `POST /add`. **Access:** should be admin only (see the security
 * note at the top of this file).
 *
 * The name is trimmed and saved in upper case. The duplicate check uses the
 * normalized name, so `"cict"` is rejected when `"CICT"` already exists. For
 * full protection against two requests arriving at the same time, also add a
 * unique constraint on the department name in `schema.prisma`. This handler
 * already turns that database error into a `409`.
 *
 * **Responses:** `201` with a confirmation message. `400` if the name is
 * missing or invalid. `409` if the department already exists. `500` on
 * unexpected errors.
 *
 * @param req - Expects a JSON body with `department`.
 *
 * @example
 * ```json
 * { "department": "cict" }
 * ```
 * Response `201`:
 * ```json
 * { "message": "Department CICT has been added" }
 * ```
 */
const addDepartment = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, DepartmentBody>,
    res: Response,
  ) => {
    const name = parseDepartmentName(req.body?.department);
    if (!name) {
      res.status(400).json({ message: INVALID_NAME_MESSAGE });
      return;
    }

    try {
      const existing = await prisma.department.findFirst({
        where: { department: name },
      });

      if (existing) {
        res
          .status(409)
          .json({ message: `The department ${name} already exists` });
        return;
      }

      const created = await prisma.department.create({
        data: { department: name },
      });

      res.status(201).json({
        message: `Department ${created.department} has been added`,
      });
    } catch (error) {
      handleError(res, "addDepartment", error);
    }
  },
);

/**
 * Renames an existing department.
 *
 * @remarks
 * **Route:** `POST /edit/:id`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * The new name is normalized the same way as in `addDepartment` (trimmed, upper
 * case). Renaming a department to its current name is allowed. Renaming it to
 * the name of a different department is rejected.
 *
 * **Responses:** `200` with a confirmation message. `400` if the id or the name
 * is invalid. `404` if no department has that id. `409` if another department
 * already uses the name. `500` on unexpected errors.
 *
 * @param req - Expects the department `id` in the URL and a JSON body with the
 * new `department` name.
 *
 * @example
 * ```
 * POST /api/graduateTracer/department/edit/3
 * ```
 * ```json
 * { "department": "College of Engineering" }
 * ```
 */
const editDepartment = asyncHandler(
  async (
    req: Request<{ id: string }, unknown, DepartmentBody>,
    res: Response,
  ) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    const name = parseDepartmentName(req.body?.department);
    if (!name) {
      res.status(400).json({ message: INVALID_NAME_MESSAGE });
      return;
    }

    try {
      // Another department (any id except this one) must not use the name.
      const nameTaken = await prisma.department.findFirst({
        where: { department: name, NOT: { id } },
      });

      if (nameTaken) {
        res
          .status(409)
          .json({ message: `The department ${name} already exists` });
        return;
      }

      // update() throws P2025 when the id does not exist: handleError sends 404.
      const updated = await prisma.department.update({
        where: { id },
        data: { department: name },
      });

      res.status(200).json({
        message: `The ${updated.department} is successfully updated!`,
      });
    } catch (error) {
      handleError(res, "editDepartment", error);
    }
  },
);

/**
 * Permanently deletes a department.
 *
 * @remarks
 * **Route:** `POST /remove/:id`. **Access:** should be admin only (see the
 * security note at the top of this file).
 *
 * This cannot be undone. What happens to the programs of the department depends
 * on the relation in `schema.prisma`:
 *
 * - Without `onDelete: Cascade`, the database refuses to delete a department
 *   that still has programs, and this handler answers `409`.
 * - With `onDelete: Cascade`, the programs (and anything that depends on them)
 *   are deleted together with the department. Check your schema before using
 *   this endpoint.
 *
 * **Responses:** `200` with a confirmation message. `400` if the id is invalid.
 * `404` if no department has that id. `409` if programs still use the
 * department. `500` on unexpected errors.
 *
 * @param req - Expects the department `id` in the URL.
 *
 * @example
 * ```
 * POST /api/graduateTracer/department/remove/3
 * ```
 */
const removeDepartment = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
      return;
    }

    try {
      // delete() throws P2025 when the id does not exist: handleError sends 404.
      const removed = await prisma.department.delete({ where: { id } });

      res.status(200).json({
        message: `The ${removed.department} is successfully deleted!`,
      });
    } catch (error) {
      handleError(res, "removeDepartment", error);
    }
  },
);

/**
 * Lists all departments, sorted by name.
 *
 * @remarks
 * **Route:** `GET /list`. **Access:** public.
 *
 * Always answers with a JSON array. When there are no departments the array is
 * empty. (The original code answered with a plain text message in that case,
 * which forced clients to handle two different response types.)
 *
 * **Responses:** `200` with a list of departments. `500` on unexpected errors.
 *
 * @example
 * ```json
 * [
 *   { "id": 1, "department": "CICT" },
 *   { "id": 2, "department": "COLLEGE OF ENGINEERING" }
 * ]
 * ```
 */
const departmentList = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { department: "asc" },
    });

    res.status(200).json(departments);
  } catch (error) {
    handleError(res, "departmentList", error);
  }
});

/**
 * Lists the programs that belong to a department.
 *
 * @remarks
 * **Route:** `POST /program/:departmentId`. **Access:** public. This handler
 * only reads data.
 *
 * First checks that the department exists, so an unknown id gets a clear `404`
 * instead of an empty list. A department without programs returns an empty
 * array.
 *
 * **Responses:** `200` with a list of programs. `400` if the id is invalid.
 * `404` if no department has that id. `500` on unexpected errors.
 *
 * @param req - Expects `departmentId` in the URL.
 *
 * @example
 * ```
 * POST /api/graduateTracer/department/program/1
 * ```
 * Response `200`:
 * ```json
 * [{ "id": 4, "program": "BSIT", "departmentId": 1 }]
 * ```
 */
const getRelatedProgram = asyncHandler(
  async (req: Request<{ departmentId: string }>, res: Response) => {
    const departmentId = parseId(req.params.departmentId);
    if (departmentId === null) {
      res.status(400).json({ message: INVALID_ID_MESSAGE });
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

      const programs = await prisma.program.findMany({
        where: { departmentId },
      });

      res.status(200).json(programs);
    } catch (error) {
      handleError(res, "getRelatedProgram", error);
    }
  },
);

export default {
  addDepartment,
  editDepartment,
  removeDepartment,
  departmentList,
  getRelatedProgram,
};