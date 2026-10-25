/**
 * User API controller for the Graduate Tracer module.
 *
 * @remarks
 * Lets a graduate submit the tracer survey. Each submission is saved as one
 * response, the graduate totals are kept up to date, and a thank-you email is
 * sent.
 *
 * **Endpoints**
 *
 * Every path starts with `/api/graduateTracer/user`. The original route
 * comments do not state HTTP methods. The handler does not depend on the
 * method, so it works with whatever your router registers (normally `POST`).
 *
 * | Handler       | Path             |
 * | ------------- | ---------------- |
 * | `addResponse` | `/add/response` |
 *
 * **How the handler is built**
 *
 * 1. Validate the input. Answer `400` if it is invalid.
 * 2. Check the email, department, program and major with Prisma.
 * 3. Save the response, then make sure the graduate total exists.
 * 4. Send the thank-you email and answer with JSON.
 * 5. If something fails, `handleError` maps known database errors to a clear
 *    status code (`404` or `409`). Anything else is logged and answered with a
 *    generic `500`, so internal details are never sent to clients.
 *
 * **Important: survey data refers to programs by name**
 *
 * Like the program controller, the response and total records store the
 * department, program and major as plain text names, not as ids. The ids sent
 * by the client are only used to look the names up.
 *
 * **Email is not allowed to break a submission**
 *
 * The response is already saved when the email is sent. If the email fails, the
 * error is logged (`[user.controller]`) and the graduate still gets a success
 * answer. The same applies to updating the graduate totals.
 *
 * **Debugging guide**
 *
 * - A `400` response: check `parseId`, `parseText`, `parseYear` or
 *   `parseEmail`.
 * - A `404` or `409` response: it comes from an explicit check in the handler
 *   or from `handleError` (Prisma codes `P2025`, `P2002` and `P2003`).
 * - A `500` response: search the server log for `[user.controller]`. The line
 *   contains the handler name and the original error.
 *
 * @packageDocumentation
 */

import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import {
  sendGraduateTracerEmail,
  type EmailContext,
} from "../utils/sendGraduateTracerEmail.js";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** Longest value accepted for the free text fields. */
const MAX_TEXT_LENGTH = 150;

/** Longest value accepted for an email address. */
const MAX_EMAIL_LENGTH = 254;

/** Earliest and latest year accepted for the survey and graduation years. */
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

/** Subject of the thank-you email. */
const EMAIL_SUBJECT = "Thank you for being part of the tracer survey";

/** Name of the email template used for the thank-you email. */
const EMAIL_TEMPLATE = "student-completed-form";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/**
 * Request body used by `addResponse`.
 *
 * @remarks
 * Every value is typed as `unknown` on purpose: clients can send anything, so
 * each one is checked by a `parse*` helper before it is used. `majorId` is the
 * only optional field.
 */
type ResponseBody = {
  yearOfSurvey?: unknown;
  email?: unknown;
  fullName?: unknown;
  yearOfGraduation?: unknown;
  departmentId?: unknown;
  programId?: unknown;
  majorId?: unknown;
  isEmployed?: unknown;
  isJobAligned?: unknown;
  isSelfEmployed?: unknown;
  isFurtherStudies?: unknown;
  typeOfOrganization?: unknown;
  currentJobLocated?: unknown;
};

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Converts a body value to a positive whole number.
 *
 * @remarks
 * Accepts a number (`12`) or a string with digits only (`"12"`), because
 * clients send both.
 *
 * @param value - The raw value from the request body.
 * @returns The number, or `null` if it is not a positive integer.
 */
const parseId = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const id = Number(value.trim());
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  return null;
};

/**
 * Converts a body value to a year.
 *
 * @param value - The raw value, for example `2024` or `"2024"`.
 * @returns The year, or `null` if it is not a whole number between `MIN_YEAR`
 * and `MAX_YEAR`.
 */
const parseYear = (value: unknown): number | null => {
  const year = parseId(value);
  return year !== null && year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
};

/**
 * Validates a text field and trims it.
 *
 * @param value - The raw value from the request body.
 * @returns The trimmed text, or `null` if it is not a non-empty string of at
 * most `MAX_TEXT_LENGTH` characters.
 */
const parseText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  if (text === "" || text.length > MAX_TEXT_LENGTH) {
    return null;
  }

  return text;
};

/**
 * Validates a survey answer and normalizes it.
 *
 * @remarks
 * Answers are trimmed and saved in lower case, because the admin statistics
 * count them by exact value (`"yes"`, `"no"`, `"government"`, `"locally"` and
 * so on). Without this, an answer sent as `"Yes"` would never be counted.
 *
 * @param value - The raw value from the request body.
 * @returns The normalized answer, or `null` if it is not a non-empty string of
 * at most `MAX_TEXT_LENGTH` characters.
 */
const parseAnswer = (value: unknown): string | null => {
  const text = parseText(value);
  return text === null ? null : text.toLowerCase();
};

/**
 * Validates an email address and normalizes it.
 *
 * @remarks
 * The address is trimmed and converted to lower case, so `" Ana@Mail.com "` and
 * `"ana@mail.com"` count as the same graduate.
 *
 * @param value - The raw value from the request body.
 * @returns The normalized email, or `null` if it does not look like an email.
 */
const parseEmail = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  return email;
};

/**
 * Answers with the right error for a failed request.
 *
 * @remarks
 * Known Prisma error codes become clear client errors:
 *
 * - `P2025`: a record does not exist, answer `404`.
 * - `P2002`: the email is already used, answer `409`.
 * - `P2003`: a related record is missing, answer `409`.
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
      res.status(404).json({ message: "Record not found" });
      return;
    }

    if (error.code === "P2002") {
      res.status(409).json({ message: "This graduate is already traced" });
      return;
    }

    if (error.code === "P2003") {
      res.status(409).json({
        message: "The department, program or major does not exist",
      });
      return;
    }
  }

  // Replace with your logger (pino, winston) if the project has one.
  console.error(`[user.controller] ${handlerName} failed:`, error);
  res
    .status(500)
    .json({ message: "An unexpected error occurred. Please try again later." });
};

/**
 * Makes sure a graduate total exists for a year and program.
 *
 * @remarks
 * Creates the total only when there is none yet. This runs after the response
 * is saved, so a failure here is logged and ignored: the graduate's submission
 * must not be reported as failed because of it.
 *
 * @param yearOfGraduation - The graduation year of the response.
 * @param program - The program name.
 * @param department - The department name.
 */
const ensureTotalExists = async (
  yearOfGraduation: number,
  program: string,
  department: string,
): Promise<void> => {
  try {
    const existing = await prisma.total.findFirst({
      where: { yearOfGraduation, program },
      select: { id: true },
    });

    if (!existing) {
      await prisma.total.create({
        data: { yearOfGraduation, program, department },
      });
    }
  } catch (error) {
    console.error("[user.controller] ensureTotalExists failed:", error);
  }
};

/* -------------------------------------------------------------------------- */
/*                                 Controllers                                */
/* -------------------------------------------------------------------------- */

/**
 * Saves a graduate's tracer survey response.
 *
 * @remarks
 * **Route:** `/add/response`. **Access:** public.
 *
 * All fields are required except `majorId`. The name is trimmed, and the email
 * and the six survey answers are trimmed and saved in lower case, so they match
 * the values the admin statistics count. Each graduate can answer only once: a second
 * submission with the same email is rejected. The department and program must
 * exist, and the major must exist when `majorId` is sent.
 *
 * After the response is saved, the graduate total for the graduation year and
 * program is created if it does not exist yet, and a thank-you email is sent.
 * Problems with the total or the email are logged but do not change the answer.
 * For full protection against two submissions arriving at the same time, also
 * add a unique constraint on the email in `schema.prisma`. This handler already
 * turns that database error into a `409`.
 *
 * **Responses:** `201` with a thank-you message. `400` if a field is missing or
 * invalid. `404` if the department, program or major does not exist. `409` if
 * the email was already used. `500` on unexpected errors.
 *
 * @param req - Expects a JSON body with the fields of `ResponseBody`.
 *
 * @example
 * ```
 * /api/graduateTracer/user/add/response
 * ```
 * ```json
 * {
 *   "yearOfSurvey": 2026,
 *   "email": "ana@mail.com",
 *   "fullName": "Ana Cruz",
 *   "yearOfGraduation": 2024,
 *   "departmentId": 1,
 *   "programId": 4,
 *   "majorId": 2,
 *   "isEmployed": "yes",
 *   "isJobAligned": "yes",
 *   "isSelfEmployed": "no",
 *   "isFurtherStudies": "no",
 *   "typeOfOrganization": "private institution",
 *   "currentJobLocated": "locally"
 * }
 * ```
 */
const addResponse = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, ResponseBody>,
    res: Response,
  ) => {
    const body = req.body ?? {};

    const yearOfSurvey = parseYear(body.yearOfSurvey);
    const yearOfGraduation = parseYear(body.yearOfGraduation);
    const email = parseEmail(body.email);
    const fullName = parseText(body.fullName);
    const departmentId = parseId(body.departmentId);
    const programId = parseId(body.programId);
    const isEmployed = parseAnswer(body.isEmployed);
    const isJobAligned = parseAnswer(body.isJobAligned);
    const isSelfEmployed = parseAnswer(body.isSelfEmployed);
    const isFurtherStudies = parseAnswer(body.isFurtherStudies);
    const typeOfOrganization = parseAnswer(body.typeOfOrganization);
    const currentJobLocated = parseAnswer(body.currentJobLocated);

    if (
      yearOfSurvey === null ||
      yearOfGraduation === null ||
      email === null ||
      fullName === null ||
      departmentId === null ||
      programId === null ||
      isEmployed === null ||
      isJobAligned === null ||
      isSelfEmployed === null ||
      isFurtherStudies === null ||
      typeOfOrganization === null ||
      currentJobLocated === null
    ) {
      res.status(400).json({ message: "Please fill all fields" });
      return;
    }

    // The major is optional, but when it is sent it must be a valid id.
    const hasMajor =
      body.majorId !== undefined && body.majorId !== null && body.majorId !== "";
    const majorId = hasMajor ? parseId(body.majorId) : null;
    if (hasMajor && majorId === null) {
      res.status(400).json({ message: "A valid major id is required" });
      return;
    }

    try {
      const alreadyTraced = await prisma.responses.findFirst({
        where: { email },
        select: { id: true },
      });

      // Do not show the saved name: this route is public, so anyone could
      // otherwise look up whose name belongs to an email address.
      if (alreadyTraced) {
        res
          .status(409)
          .json({ message: "This email is already traced! Thank you" });
        return;
      }

      const [department, program] = await Promise.all([
        prisma.department.findUnique({ where: { id: departmentId } }),
        prisma.program.findUnique({ where: { id: programId } }),
      ]);

      if (!department) {
        res.status(404).json({
          message: `The department with id ${departmentId} does not exist`,
        });
        return;
      }

      if (!program) {
        res.status(404).json({
          message: `The program with id ${programId} does not exist`,
        });
        return;
      }

      let majorName: string | undefined;
      if (majorId !== null) {
        const major = await prisma.major.findUnique({ where: { id: majorId } });

        if (!major) {
          res.status(404).json({
            message: `The major with id ${majorId} does not exist`,
          });
          return;
        }

        majorName = major.major;
      }

      const newResponse = await prisma.responses.create({
        data: {
          fullName,
          yearOfGraduation,
          yearOfSurvey,
          isEmployed,
          isJobAligned,
          isSelfEmployed,
          isFurtherStudies,
          typeOfOrganization,
          currentJobLocated,
          email,
          department: department.department,
          program: program.program,
          major: majorName,
        },
      });

      await ensureTotalExists(
        yearOfGraduation,
        program.program,
        department.department,
      );

      // The response is already saved: an email failure must not undo it.
      // sendGraduateTracerEmail never throws; it reports failure in its result.
      const context: EmailContext = {
        fullName: fullName.toUpperCase(),
        date: new Date().getFullYear(),
      };

      const emailResult = await sendGraduateTracerEmail(
        email,
        context,
        EMAIL_SUBJECT,
        EMAIL_TEMPLATE,
      );

      if (!emailResult.success) {
        console.error(
          `[user.controller] addResponse email not sent to ${email}: ${emailResult.message}`,
        );
      }

      res.status(201).json({
        message: `Thank you ${newResponse.fullName} for being part of this tracing!`,
      });
    } catch (error) {
      handleError(res, "addResponse", error);
    }
  },
);

export default {
  addResponse,
};