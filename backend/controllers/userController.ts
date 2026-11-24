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
import { Prisma } from "../src/generated/prisma/client.js";
import prisma from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { sendServerError } from "../utils/httpErrors.js";
import { answersAreConsistent } from "../utils/surveyValues.js";
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

/** Earliest graduation year accepted. */
const MIN_YEAR = 1900;

/** Message for a duplicate email, the same on both the pre-check and the database path. */
const ALREADY_TRACED_MESSAGE = "This email is already traced! Thank you";

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
 * @param min - Earliest accepted year.
 * @param max - Latest accepted year.
 * @returns The year, or `null` if it is not a whole number from `min` to `max`.
 */
const parseYear = (value: unknown, min: number, max: number): number | null => {
  const year = parseId(value);
  return year !== null && year >= min && year <= max ? year : null;
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
      // Two submissions with the same email at the same moment: the unique index
      // rejected the second. Same text as the pre-check, so the two cannot be told apart.
      res.status(409).json({ message: ALREADY_TRACED_MESSAGE });
      return;
    }

    if (error.code === "P2003") {
      res.status(409).json({
        message: "The department, program or major does not exist",
      });
      return;
    }
  }

  sendServerError(res, `user.controller ${handlerName}`, error);
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
    // One atomic statement on the unique (year, program) index: two graduates
    // submitting at once cannot create two totals. An existing total is untouched.
    await prisma.total.upsert({
      where: { year_program: { yearOfGraduation, program } },
      update: {},
      create: { yearOfGraduation, program, department },
    });
  } catch (error) {
    logger.error({ err: error }, "[user.controller] ensureTotalExists failed");
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
 * program is created if it does not exist yet (one `upsert` on the unique year +
 * program index), the `201` answer is sent, and only then the thank-you email is
 * sent in the background. Problems with the total or the email are logged but do
 * not change the answer. Two submissions with the same email at the same moment
 * are stopped by the unique index on `Responses.email`; that database error is
 * answered with the same `409` as the pre-check.
 *
 * The answers must be the values the form sends (`utils/surveyValues.ts`), the
 * program must belong to the department and the major to the program.
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

    // The form sends this year as the survey year and offers 1980 to this year.
    const thisYear = new Date().getFullYear();
    const yearOfSurvey = parseYear(body.yearOfSurvey, thisYear - 1, thisYear + 1);
    const yearOfGraduation = parseYear(body.yearOfGraduation, MIN_YEAR, thisYear);
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
      currentJobLocated === null ||
      // Only the values the form sends, consistent with each other (see surveyValues.ts).
      !answersAreConsistent({
        isEmployed,
        isJobAligned,
        isSelfEmployed,
        isFurtherStudies,
        typeOfOrganization,
        currentJobLocated,
      })
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
        res.status(409).json({ message: ALREADY_TRACED_MESSAGE });
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

      // The form's lists only offer the programs of the chosen college; a
      // different combination can only come from a forged request.
      if (program.departmentId !== department.id) {
        res.status(400).json({
          message: "The program does not belong to the selected department",
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

        if (major.programId !== program.id) {
          res.status(400).json({
            message: "The major does not belong to the selected program",
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

      res.status(201).json({
        message: `Thank you ${newResponse.fullName} for being part of this tracing!`,
      });

      // The response is saved and answered: the graduate does not wait for the mail
      // server, and an email failure cannot undo or delay it. sendGraduateTracerEmail
      // never throws; it reports failure in its result.
      const context: EmailContext = {
        fullName: fullName.toUpperCase(),
        date: new Date().getFullYear(),
      };

      void sendGraduateTracerEmail(email, context, EMAIL_SUBJECT, EMAIL_TEMPLATE).then(
        (emailResult) => {
          if (!emailResult.success) {
            req.log.warn(
              { reason: emailResult.message },
              "[user.controller] addResponse confirmation email not sent",
            );
          }
        },
      );
    } catch (error) {
      handleError(res, "addResponse", error);
    }
  },
);

export default {
  addResponse,
};