/**
 * Admin API controller for the Graduate Tracer module.
 *
 * @remarks
 * Serves the admin dashboard with traced-graduate summaries, employment
 * statistics and survey breakdowns, plus two write operations (edit the total
 * number of graduates, delete a survey response).
 *
 * **Endpoints**
 *
 * Every path starts with `/api/graduateTracer/admin`.
 *
 * | Handler                   | Method and path                                       |
 * | ------------------------- | ----------------------------------------------------- |
 * | `getSummaryData`          | `GET /getAllData`                                     |
 * | `overviewTracedStudents`  | `GET /overviewStudents`                               |
 * | `listOfPrograms`          | `GET /listOfPrograms`                                 |
 * | `OverviewRowGaduates`     | `GET /graduates/:yearOfGraduation/:program`           |
 * | `getTotalGraduates`       | `GET /graduates/total/:yearOfGraduation/:program`     |
 * | `editTotalGraduates`      | `POST /graduates/total/:yearOfGraduation/:program`    |
 * | `getEmploymentStatistics` | `GET /employmentStatistics/:yearOfGraduation/:program`|
 * | `getQuestions`            | `GET /questions/:yearOfGraduation/:program`           |
 * | `tracedPercentage`        | `GET /percentage/:yearOfGraduation/:program`          |
 * | `getTypeOfOrganisation`   | `GET /organization/:yearOfGraduation/:program`        |
 * | `getCurrentJobLocation`   | `GET /jobLocation/:yearOfGraduation/:program`         |
 * | `getDepartmentDetails`    | `GET /department/details`                             |
 * | `deleteStudentById`       | `DELETE /student/response/:id`                        |
 *
 * **How every handler is built**
 *
 * 1. Validate the input. Answer `400` if it is invalid.
 * 2. Read or write the database with Prisma.
 * 3. Shape the result and answer with JSON.
 * 4. If anything unexpected fails, log the real error on the server and answer
 *    `500` with a generic message (internal details are never sent to clients).
 *
 * **Debugging guide**
 *
 * - A `400` response: check the matching validation helper
 *   (`parseGraduateParams` or `parseInteger`).
 * - A `500` response: search the server log for `[admin.controller]`. The line
 *   contains the handler name and the original error.
 * - Columns such as `program`, `major` and `totalGraduates` can be `null` in
 *   the database. The code handles this: a `null` program or major stays
 *   `null` in the JSON, a `null` `totalGraduates` counts as `0`.
 * - Counts look wrong: compare the values in the constants section with what
 *   is stored in the database (`yes`/`no`, organization types, job locations).
 * - Handlers that tally in memory (`getSummaryData`, `getQuestions`,
 *   `getEmploymentStatistics`) only use plain `filter` and `for` loops. Log the
 *   fetched rows with `console.log` to see exactly what is being counted.
 *
 * Authentication and authorization are NOT handled here. Mount these handlers
 * behind your admin auth middleware.
 *
 * @packageDocumentation
 */

import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../lib/prisma";


/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

/** Stored value of an affirmative survey answer. */
const YES = "yes";

/** Stored value of a negative survey answer. */
const NO = "no";

/**
 * Stored values of the `typeOfOrganization` column.
 *
 * @remarks
 * Defined once so every endpoint filters on the same spelling. If a count for
 * an organization type is always `0`, check these values against the database.
 */
const ORGANIZATION_TYPE = {
  GOVERNMENT: "government",
  PRIVATE: "private institution",
  FREELANCE: "entrepreneurial / freelance",
} as const;

/** Stored values of the `currentJobLocated` column. */
const JOB_LOCATION = {
  LOCAL: "locally",
  ABROAD: "abroad",
} as const;

/** Display label used when a response has no major saved. */
const UNSPECIFIED_MAJOR = "Unspecified";

/** A graduation year is exactly four digits, for example `2024`. */
const YEAR_PATTERN = /^\d{4}$/;

/** Message sent with a `400` when the year or program in the URL is invalid. */
const INVALID_PARAMS_MESSAGE =
  "Please provide a valid year of graduation (YYYY) and program";

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

/** URL parameters shared by every `/:yearOfGraduation/:program` endpoint. */
type GraduateParams = {
  yearOfGraduation: string;
  program: string;
};

/** The same parameters after validation: the year is now a number. */
type ValidGraduateParams = {
  yearOfGraduation: number;
  program: string;
};

/** Request body accepted by `editTotalGraduates`. */
type EditTotalBody = {
  id?: number | string;
  totalGraduates?: number | string;
};

/** One row of the summary table: counts for one year and program. */
interface ProgramSummary {
  /** Graduation year as a string (kept as a string for API compatibility). */
  yearOfGraduation: string;
  /** Program name. `null` when the response has no program saved. */
  program: string | null;
  totalTracedGraduates: number;
  totalEmployedStudents: number;
  totalEmployedGraduatesAlignedToTheirProgram: number;
  totalEmployedGraduatesNotAlignedToTheirProgram: number;
  totalOfSelfEmployed: number;
  totalOfGraduatesEnrolledInFurtherStudies: number;
  totalOfGraduatesEmployedInGovernment: number;
  totalOfGraduatesEmployedInPrivate: number;
  totalOfGraduatesFreelance: number;
  totalOfGraduatesEmployedLocally: number;
  totalOfGraduatesEmployedAbroad: number;
}

/** Employed and not-employed counts for one major. */
interface EmploymentStatistic {
  /** Major name. `null` when the response has no major saved. */
  major: string | null;
  totalCount: number;
  totalEmployed: number;
  totalNotEmployed: number;
}

/** Yes and no counts for one survey question. */
interface QuestionResult {
  question: string;
  yes: number;
  no: number;
}

/** Traced and untraced percentage for one major. */
interface TracedPercentageResult {
  /** Display label, for example `PERCENTAGE TRACED IN MAJOR Networking: `. */
  major: string;
  /** Percent of graduates traced, or `null` when no total is configured. */
  tracedPercentage: number | null;
  /** Percent not traced (field name spelling kept for API compatibility). */
  untTracedPercentage: number | null;
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

/**
 * Converts a number or numeric string to an integer.
 *
 * @param value - Any value, usually from the request body or URL.
 * @returns The integer, or `null` if the value is not a whole number.
 */
const parseInteger = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
};

/**
 * Validates the `:yearOfGraduation` and `:program` URL parameters.
 *
 * @param params - The raw `req.params` object.
 * @returns The cleaned parameters, or `null` if either one is missing or
 * invalid.
 */
const parseGraduateParams = (
  params: Partial<GraduateParams>,
): ValidGraduateParams | null => {
  const year = params.yearOfGraduation;
  const program = params.program?.trim();

  if (!year || !YEAR_PATTERN.test(year) || !program) {
    return null;
  }

  return { yearOfGraduation: Number(year), program };
};

/**
 * Logs an unexpected error and answers with a generic `500`.
 *
 * @remarks
 * The full error is only written to the server log. The client never sees it.
 *
 * @param res - The Express response.
 * @param handlerName - Name of the failing handler, used to find it in logs.
 * @param error - The caught error.
 */
const sendServerError = (
  res: Response,
  handlerName: string,
  error: unknown,
): void => {
  // Replace with your logger (pino, winston) if the project has one.
  console.error(`[admin.controller] ${handlerName} failed:`, error);
  res
    .status(500)
    .json({ message: "An unexpected error occurred. Please try again later." });
};

/* -------------------------------------------------------------------------- */
/*                                 Controllers                                */
/* -------------------------------------------------------------------------- */

/**
 * Returns the employment summary of every graduation year and program.
 *
 * @remarks
 * **Route:** `GET /getAllData`. **Access:** admin.
 *
 * Fetches the survey answers once, groups them by year and program, and counts
 * inside each group. The result is sorted by year, then by program name.
 *
 * The counting happens in memory, which is fast and easy to follow for the
 * expected data size (thousands of rows). If the `responses` table grows to
 * hundreds of thousands of rows, replace the in-memory counting with Prisma
 * `groupBy`.
 *
 * **Responses:** `200` with a list of `ProgramSummary`. `500` on unexpected
 * errors.
 *
 * @example
 * ```
 * GET /api/graduateTracer/admin/getAllData
 * ```
 * Response `200` (only some counters shown):
 * ```json
 * [
 *   {
 *     "yearOfGraduation": "2024",
 *     "program": "BSIT",
 *     "totalTracedGraduates": 120,
 *     "totalEmployedStudents": 98
 *   }
 * ]
 * ```
 */
const getSummaryData = asyncHandler(async (_req: Request, res: Response) => {
  try {
    // Step 1: read only the columns we need to count.
    const responses = await prisma.responses.findMany({
      select: {
        yearOfGraduation: true,
        program: true,
        isEmployed: true,
        isJobAligned: true,
        isSelfEmployed: true,
        isFurtherStudies: true,
        typeOfOrganization: true,
        currentJobLocated: true,
      },
    });

    // Step 2: group the rows by "year|program".
    const groups: Record<string, typeof responses> = {};
    for (const response of responses) {
      const key = `${response.yearOfGraduation}|${response.program}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(response);
    }

    // Step 3: count inside each group.
    const summary: ProgramSummary[] = Object.values(groups).map((group) => ({
      yearOfGraduation: String(group[0].yearOfGraduation),
      program: group[0].program,
      totalTracedGraduates: group.length,
      totalEmployedStudents: group.filter((r) => r.isEmployed === YES).length,
      totalEmployedGraduatesAlignedToTheirProgram: group.filter(
        (r) => r.isJobAligned === YES,
      ).length,
      totalEmployedGraduatesNotAlignedToTheirProgram: group.filter(
        (r) => r.isJobAligned === NO,
      ).length,
      totalOfSelfEmployed: group.filter((r) => r.isSelfEmployed === YES).length,
      totalOfGraduatesEnrolledInFurtherStudies: group.filter(
        (r) => r.isFurtherStudies === YES,
      ).length,
      totalOfGraduatesEmployedInGovernment: group.filter(
        (r) => r.typeOfOrganization === ORGANIZATION_TYPE.GOVERNMENT,
      ).length,
      totalOfGraduatesEmployedInPrivate: group.filter(
        (r) => r.typeOfOrganization === ORGANIZATION_TYPE.PRIVATE,
      ).length,
      totalOfGraduatesFreelance: group.filter(
        (r) => r.typeOfOrganization === ORGANIZATION_TYPE.FREELANCE,
      ).length,
      totalOfGraduatesEmployedLocally: group.filter(
        (r) => r.currentJobLocated === JOB_LOCATION.LOCAL,
      ).length,
      totalOfGraduatesEmployedAbroad: group.filter(
        (r) => r.currentJobLocated === JOB_LOCATION.ABROAD,
      ).length,
    }));

    // Step 4: sort so the output order is always the same.
    summary.sort(
      (a, b) =>
        Number(a.yearOfGraduation) - Number(b.yearOfGraduation) ||
        (a.program ?? "").localeCompare(b.program ?? ""),
    );

    res.status(200).json(summary);
  } catch (error) {
    sendServerError(res, "getSummaryData", error);
  }
});

/**
 * Returns how many graduates were traced in each department.
 *
 * @remarks
 * **Route:** `GET /overviewStudents`. **Access:** admin.
 *
 * Runs one count per department. Departments with no responses are still
 * listed, with a count of `0`.
 *
 * **Responses:** `200` with a list of departments and their counts. `500` on
 * unexpected errors.
 *
 * @example
 * ```json
 * [{ "id": 1, "department": "CICT", "totalTracedGraduates": 240 }]
 * ```
 */
const overviewTracedStudents = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      const departments = await prisma.department.findMany();

      // Departments are few, so one count per department is simple and fast.
      const overview = await Promise.all(
        departments.map(async (department) => ({
          id: department.id,
          department: department.department,
          totalTracedGraduates: await prisma.responses.count({
            where: { department: department.department },
          }),
        })),
      );

      res.status(200).json(overview);
    } catch (error) {
      sendServerError(res, "overviewTracedStudents", error);
    }
  },
);

/**
 * Lists every program, without the internal `departmentId` column.
 *
 * @remarks
 * **Route:** `GET /listOfPrograms`. **Access:** admin.
 *
 * **Responses:** `200` with a list of programs. `500` on unexpected errors.
 */
const listOfPrograms = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const programs = await prisma.program.findMany({
      omit: { departmentId: true },
    });

    res.status(200).json(programs);
  } catch (error) {
    sendServerError(res, "listOfPrograms", error);
  }
});

/**
 * Returns the raw survey responses of one graduation year and program.
 *
 * @remarks
 * **Route:** `GET /graduates/:yearOfGraduation/:program`. **Access:** admin.
 *
 * Returns whole rows for the admin table. Add pagination (`take` and `skip`)
 * if a single cohort can become very large.
 *
 * **Responses:** `200` with a list of responses. `400` if the year or program
 * is invalid. `500` on unexpected errors.
 *
 * @param req - Expects `yearOfGraduation` (four digits) and `program` in the
 * URL.
 *
 * @example
 * ```
 * GET /api/graduateTracer/admin/graduates/2024/BSIT
 * ```
 */
const OverviewRowGaduates = asyncHandler(
  async (req: Request<GraduateParams>, res: Response) => {
    const params = parseGraduateParams(req.params);
    if (!params) {
      res.status(400).json({ message: INVALID_PARAMS_MESSAGE });
      return;
    }

    try {
      const graduates = await prisma.responses.findMany({
        where: {
          yearOfGraduation: params.yearOfGraduation,
          program: params.program,
        },
      });

      res.status(200).json(graduates);
    } catch (error) {
      sendServerError(res, "OverviewRowGaduates", error);
    }
  },
);

/**
 * Returns the configured total number of graduates of a year and program.
 *
 * @remarks
 * **Route:** `GET /graduates/total/:yearOfGraduation/:program`.
 * **Access:** admin.
 *
 * This total is the denominator used by `tracedPercentage`.
 *
 * **Responses:** `200` with the matching `total` records. `400` if the year or
 * program is invalid. `500` on unexpected errors.
 *
 * @param req - Expects `yearOfGraduation` (four digits) and `program` in the
 * URL.
 */
const getTotalGraduates = asyncHandler(
  async (req: Request<GraduateParams>, res: Response) => {
    const params = parseGraduateParams(req.params);
    if (!params) {
      res.status(400).json({ message: INVALID_PARAMS_MESSAGE });
      return;
    }

    try {
      const totals = await prisma.total.findMany({
        where: {
          yearOfGraduation: params.yearOfGraduation,
          program: params.program,
        },
      });

      res.status(200).json(totals);
    } catch (error) {
      sendServerError(res, "getTotalGraduates", error);
    }
  },
);

/**
 * Updates the total number of graduates stored in a `total` record.
 *
 * @remarks
 * **Route:** `POST /graduates/total/:yearOfGraduation/:program`.
 * **Access:** admin.
 *
 * The URL parameters are not used. The record is found by the `id` in the
 * request body. A `totalGraduates` of `0` is valid.
 *
 * **Responses:** `200` with a confirmation message. `400` if `id` is not a
 * positive integer or `totalGraduates` is not a non-negative integer. `404` if
 * no record has that `id`. `500` on unexpected errors.
 *
 * @param req - Expects a body with `id` and `totalGraduates`.
 *
 * @example
 * ```json
 * { "id": 3, "totalGraduates": 150 }
 * ```
 */
const editTotalGraduates = asyncHandler(
  async (
    req: Request<Record<string, string>, unknown, EditTotalBody>,
    res: Response,
  ) => {
    const id = parseInteger(req.body?.id);
    const totalGraduates = parseInteger(req.body?.totalGraduates);

    if (
      id === null ||
      id <= 0 ||
      totalGraduates === null ||
      totalGraduates < 0
    ) {
      res.status(400).json({
        message:
          "Please provide a valid id and a non-negative whole number for totalGraduates",
      });
      return;
    }

    try {
      // updateMany tells us how many rows changed, so we can answer 404.
      const result = await prisma.total.updateMany({
        where: { id },
        data: { totalGraduates },
      });

      if (result.count === 0) {
        res.status(404).json({ message: "Total graduates record not found" });
        return;
      }

      res.status(200).json({
        message: `Successfully added total graduates: ${totalGraduates}`,
      });
    } catch (error) {
      sendServerError(res, "editTotalGraduates", error);
    }
  },
);

/**
 * Returns employed and not-employed counts for each major of a program.
 *
 * @remarks
 * **Route:** `GET /employmentStatistics/:yearOfGraduation/:program`.
 * **Access:** admin.
 *
 * `totalCount` counts every response of the major, so
 * `totalEmployed + totalNotEmployed` can be lower than `totalCount` when some
 * responses have no employment answer. Results are sorted by major name.
 * Responses without a saved major are grouped together with `major: null`.
 *
 * **Responses:** `200` with a list of `EmploymentStatistic`. `400` if the year
 * or program is invalid. `500` on unexpected errors.
 *
 * @param req - Expects `yearOfGraduation` (four digits) and `program` in the
 * URL.
 *
 * @example
 * ```json
 * [{ "major": "Networking", "totalCount": 40, "totalEmployed": 30, "totalNotEmployed": 10 }]
 * ```
 */
const getEmploymentStatistics = asyncHandler(
  async (req: Request<GraduateParams>, res: Response) => {
    const params = parseGraduateParams(req.params);
    if (!params) {
      res.status(400).json({ message: INVALID_PARAMS_MESSAGE });
      return;
    }

    try {
      const responses = await prisma.responses.findMany({
        where: {
          yearOfGraduation: params.yearOfGraduation,
          program: params.program,
        },
        select: { major: true, isEmployed: true },
      });

      // Count every response under its major.
      const statsByMajor: Record<string, EmploymentStatistic> = {};
      for (const response of responses) {
        // Object keys must be text, so a missing major uses an empty key.
        const key = response.major ?? "";

        if (!statsByMajor[key]) {
          statsByMajor[key] = {
            major: response.major,
            totalCount: 0,
            totalEmployed: 0,
            totalNotEmployed: 0,
          };
        }

        const stats = statsByMajor[key];
        stats.totalCount += 1;
        if (response.isEmployed === YES) stats.totalEmployed += 1;
        if (response.isEmployed === NO) stats.totalNotEmployed += 1;
      }

      const result = Object.values(statsByMajor).sort((a, b) =>
        (a.major ?? "").localeCompare(b.major ?? ""),
      );

      res.status(200).json(result);
    } catch (error) {
      sendServerError(res, "getEmploymentStatistics", error);
    }
  },
);

/**
 * Returns the yes and no counts of the four core survey questions.
 *
 * @remarks
 * **Route:** `GET /questions/:yearOfGraduation/:program`. **Access:** admin.
 *
 * The four questions are always returned in this order, with zero counts when
 * the cohort has no responses:
 *
 * 1. Are you currently employed?
 * 2. Is your job aligned with your program?
 * 3. Are you self-employed?
 * 4. Are you currently enrolled in further studies?
 *
 * **Responses:** `200` with a list of `QuestionResult`. `400` if the year or
 * program is invalid. `500` on unexpected errors.
 *
 * @param req - Expects `yearOfGraduation` (four digits) and `program` in the
 * URL.
 *
 * @example
 * ```json
 * [{ "question": "Are you currently employed?", "yes": 98, "no": 22 }]
 * ```
 */
const getQuestions = asyncHandler(
  async (req: Request<GraduateParams>, res: Response) => {
    const params = parseGraduateParams(req.params);
    if (!params) {
      res.status(400).json({ message: INVALID_PARAMS_MESSAGE });
      return;
    }

    try {
      const responses = await prisma.responses.findMany({
        where: {
          yearOfGraduation: params.yearOfGraduation,
          program: params.program,
        },
        select: {
          isEmployed: true,
          isJobAligned: true,
          isSelfEmployed: true,
          isFurtherStudies: true,
        },
      });

      const questions: QuestionResult[] = [
        {
          question: "Are you currently employed?",
          yes: responses.filter((r) => r.isEmployed === YES).length,
          no: responses.filter((r) => r.isEmployed === NO).length,
        },
        {
          question: "Is your job aligned with your program?",
          yes: responses.filter((r) => r.isJobAligned === YES).length,
          no: responses.filter((r) => r.isJobAligned === NO).length,
        },
        {
          question: "Are you self-employed?",
          yes: responses.filter((r) => r.isSelfEmployed === YES).length,
          no: responses.filter((r) => r.isSelfEmployed === NO).length,
        },
        {
          question: "Are you currently enrolled in further studies?",
          yes: responses.filter((r) => r.isFurtherStudies === YES).length,
          no: responses.filter((r) => r.isFurtherStudies === NO).length,
        },
      ];

      res.status(200).json(questions);
    } catch (error) {
      sendServerError(res, "getQuestions", error);
    }
  },
);

/**
 * Returns the traced and untraced percentage for each major of a program.
 *
 * @remarks
 * **Route:** `GET /percentage/:yearOfGraduation/:program`. **Access:** admin.
 *
 * Formula: `traced responses / total graduates * 100`. The total graduates is
 * the sum of `totalGraduates` in the `total` table for the same year and
 * program. When no total is configured (or it is `0`), both percentages are
 * `null` instead of `NaN`. A `null` `totalGraduates` counts as `0`, and a
 * response without a major is labeled "Unspecified".
 *
 * The traced count covers the whole program, so every major shows the same
 * percentage. To get a per-major percentage, the `total` table must store a
 * total for each major, and both counts must then be filtered by major.
 *
 * **Responses:** `200` with a list of `TracedPercentageResult`. `400` if the
 * year or program is invalid. `500` on unexpected errors.
 *
 * @param req - Expects `yearOfGraduation` (four digits) and `program` in the
 * URL.
 *
 * @example
 * ```json
 * [
 *   {
 *     "major": "PERCENTAGE TRACED IN MAJOR Networking: ",
 *     "tracedPercentage": 80,
 *     "untTracedPercentage": 20
 *   }
 * ]
 * ```
 */
const tracedPercentage = asyncHandler(
  async (req: Request<GraduateParams>, res: Response) => {
    const params = parseGraduateParams(req.params);
    if (!params) {
      res.status(400).json({ message: INVALID_PARAMS_MESSAGE });
      return;
    }

    try {
      const where = {
        yearOfGraduation: params.yearOfGraduation,
        program: params.program,
      };

      const majors = await prisma.responses.findMany({
        where,
        select: { major: true },
        distinct: ["major"],
      });
      const tracedCount = await prisma.responses.count({ where });
      const totals = await prisma.total.findMany({ where });

      // Add up every configured total for this year and program.
      const totalGraduates = totals.reduce(
        (sum, total) => sum + (total.totalGraduates ?? 0),
        0,
      );

      const traced =
        totalGraduates > 0 ? (tracedCount / totalGraduates) * 100 : null;
      const untraced = traced === null ? null : 100 - traced;

      const result: TracedPercentageResult[] = majors
        .map((item) => item.major ?? UNSPECIFIED_MAJOR)
        .sort((a, b) => a.localeCompare(b))
        .map((major) => ({
          major: `PERCENTAGE TRACED IN MAJOR ${major}: `,
          tracedPercentage: traced,
          untTracedPercentage: untraced,
        }));

      res.status(200).json(result);
    } catch (error) {
      sendServerError(res, "tracedPercentage", error);
    }
  },
);

/**
 * Returns how many graduates work in each type of organization.
 *
 * @remarks
 * **Route:** `GET /organization/:yearOfGraduation/:program`. **Access:** admin.
 *
 * Always returns three entries (Government, Private, Entrepreneural), so
 * charts have a stable shape. The label "Entrepreneural" keeps its original
 * spelling for API compatibility.
 *
 * **Responses:** `200` with a list of organization totals. `400` if the year or
 * program is invalid. `500` on unexpected errors.
 *
 * @param req - Expects `yearOfGraduation` (four digits) and `program` in the
 * URL.
 *
 * @example
 * ```json
 * [
 *   { "organization": "Government", "total": 12 },
 *   { "organization": "Private", "total": 70 },
 *   { "organization": "Entrepreneural", "total": 5 }
 * ]
 * ```
 */
const getTypeOfOrganisation = asyncHandler(
  async (req: Request<GraduateParams>, res: Response) => {
    const params = parseGraduateParams(req.params);
    if (!params) {
      res.status(400).json({ message: INVALID_PARAMS_MESSAGE });
      return;
    }

    try {
      const where = {
        yearOfGraduation: params.yearOfGraduation,
        program: params.program,
      };

      const [government, privateInstitution, freelance] = await Promise.all([
        prisma.responses.count({
          where: { ...where, typeOfOrganization: ORGANIZATION_TYPE.GOVERNMENT },
        }),
        prisma.responses.count({
          where: { ...where, typeOfOrganization: ORGANIZATION_TYPE.PRIVATE },
        }),
        prisma.responses.count({
          where: { ...where, typeOfOrganization: ORGANIZATION_TYPE.FREELANCE },
        }),
      ]);

      res.status(200).json([
        { organization: "Government", total: government },
        { organization: "Private", total: privateInstitution },
        { organization: "Entrepreneural", total: freelance },
      ]);
    } catch (error) {
      sendServerError(res, "getTypeOfOrganisation", error);
    }
  },
);

/**
 * Returns how many graduates work locally and how many work abroad.
 *
 * @remarks
 * **Route:** `GET /jobLocation/:yearOfGraduation/:program`. **Access:** admin.
 *
 * **Responses:** `200` with two entries, Locally and Abroad. `400` if the year
 * or program is invalid. `500` on unexpected errors.
 *
 * @param req - Expects `yearOfGraduation` (four digits) and `program` in the
 * URL.
 *
 * @example
 * ```json
 * [
 *   { "location": "Locally", "total": 85 },
 *   { "location": "Abroad", "total": 15 }
 * ]
 * ```
 */
const getCurrentJobLocation = asyncHandler(
  async (req: Request<GraduateParams>, res: Response) => {
    const params = parseGraduateParams(req.params);
    if (!params) {
      res.status(400).json({ message: INVALID_PARAMS_MESSAGE });
      return;
    }

    try {
      const where = {
        yearOfGraduation: params.yearOfGraduation,
        program: params.program,
      };

      const [locally, abroad] = await Promise.all([
        prisma.responses.count({
          where: { ...where, currentJobLocated: JOB_LOCATION.LOCAL },
        }),
        prisma.responses.count({
          where: { ...where, currentJobLocated: JOB_LOCATION.ABROAD },
        }),
      ]);

      res.status(200).json([
        { location: "Locally", total: locally },
        { location: "Abroad", total: abroad },
      ]);
    } catch (error) {
      sendServerError(res, "getCurrentJobLocation", error);
    }
  },
);

/**
 * Returns every department with its programs and each program's majors.
 *
 * @remarks
 * **Route:** `GET /department/details`. **Access:** admin.
 *
 * **Responses:** `200` with departments containing `listOfProgram`, where each
 * program contains `listOfMajor`. `500` on unexpected errors.
 */
const getDepartmentDetails = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      const departments = await prisma.department.findMany({
        include: {
          listOfProgram: {
            select: {
              id: true,
              program: true,
              listOfMajor: { select: { id: true, major: true } },
            },
          },
        },
      });

      res.status(200).json(departments);
    } catch (error) {
      sendServerError(res, "getDepartmentDetails", error);
    }
  },
);

/**
 * Permanently deletes one survey response.
 *
 * @remarks
 * **Route:** `DELETE /student/response/:id`. **Access:** admin.
 *
 * This cannot be undone. `deleteMany` is used so a missing record gives a clean
 * `404` without a separate lookup.
 *
 * **Responses:** `200` with a confirmation message. `400` if `id` is not a
 * positive integer. `404` if no response has that `id`. `500` on unexpected
 * errors.
 *
 * @param req - Expects the response `id` in the URL.
 *
 * @example
 * ```
 * DELETE /api/graduateTracer/admin/student/response/42
 * ```
 */
const deleteStudentById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response) => {
    const id = parseInteger(req.params.id);
    if (id === null || id <= 0) {
      res.status(400).json({ message: "A valid id is required" });
      return;
    }

    try {
      const result = await prisma.responses.deleteMany({ where: { id } });

      if (result.count === 0) {
        res.status(404).json({ message: "Student does not exist" });
        return;
      }

      res.status(200).json({ message: "Successfully deleted student record" });
    } catch (error) {
      sendServerError(res, "deleteStudentById", error);
    }
  },
);

export default {
  getSummaryData,
  overviewTracedStudents,
  listOfPrograms,
  getEmploymentStatistics,
  OverviewRowGaduates,
  getTotalGraduates,
  editTotalGraduates,
  getQuestions,
  tracedPercentage,
  getTypeOfOrganisation,
  getCurrentJobLocation,
  getDepartmentDetails,
  deleteStudentById,
};