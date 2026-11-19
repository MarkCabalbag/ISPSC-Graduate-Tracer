/**
 * Analytics for the admin dashboard.
 *
 * @remarks
 * `GET /api/graduateTracer/admin/analytics` answers with the counts the
 * dashboard charts need: employment rate, job relevance, graduates by
 * graduation year and by program, organization type and job location. The
 * counting is done by the database (`groupBy`), so no rows with personal data
 * are loaded or returned.
 *
 * The answers in `Responses` are stored in lower case (`"yes"`, `"no"`, ...).
 */

import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../lib/prisma.js";
import { sendServerError } from "../utils/httpErrors.js";

const YES = "yes";
const NO = "no";

type CountRow = { _count: { _all: number } } & Record<string, unknown>;

/** Percentage rounded to one decimal, or `null` when there is nothing to divide. */
const percent = (part: number, whole: number): number | null =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;

/** Sum of the counts of the rows whose `field` equals `value`. */
const countOf = (rows: CountRow[], field: string, value: string): number =>
  rows
    .filter((row) => row[field] === value)
    .reduce((sum, row) => sum + row._count._all, 0);

/** Groups `[key, isEmployed]` count rows into `{ key, traced, employed }`. */
type TracedGroup = Record<string, unknown> & {
  traced: number;
  employed: number;
  employmentRate: number | null;
};

const groupTraced = (rows: CountRow[], key: string): TracedGroup[] => {
  const groups = new Map<unknown, { traced: number; employed: number }>();

  for (const row of rows) {
    const group = groups.get(row[key]) ?? { traced: 0, employed: 0 };
    group.traced += row._count._all;
    if (row.isEmployed === YES) group.employed += row._count._all;
    groups.set(row[key], group);
  }

  return [...groups.entries()].map(([name, group]) => ({
    [key]: name,
    ...group,
    employmentRate: percent(group.employed, group.traced),
  }));
};

const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const [
      byEmployment,
      byAlignment,
      byYearEmployment,
      byProgramEmployment,
      byOrganization,
      byLocation,
      byFurther,
      bySelf,
    ] = await Promise.all([
      prisma.responses.groupBy({ by: ["isEmployed"], _count: { _all: true } }),
      prisma.responses.groupBy({
        by: ["isJobAligned"],
        _count: { _all: true },
      }),
      prisma.responses.groupBy({
        by: ["yearOfGraduation", "isEmployed"],
        _count: { _all: true },
      }),
      prisma.responses.groupBy({
        by: ["program", "isEmployed"],
        _count: { _all: true },
      }),
      prisma.responses.groupBy({
        by: ["typeOfOrganization"],
        _count: { _all: true },
      }),
      prisma.responses.groupBy({
        by: ["currentJobLocated"],
        _count: { _all: true },
      }),
      prisma.responses.groupBy({
        by: ["isFurtherStudies"],
        _count: { _all: true },
      }),
      prisma.responses.groupBy({
        by: ["isSelfEmployed"],
        _count: { _all: true },
      }),
    ]);

    const traced = byEmployment.reduce((sum, row) => sum + row._count._all, 0);
    const employed = countOf(byEmployment, "isEmployed", YES);
    const aligned = countOf(byAlignment, "isJobAligned", YES);
    const notAligned = countOf(byAlignment, "isJobAligned", NO);

    const byYear = groupTraced(byYearEmployment, "yearOfGraduation").sort(
      (a, b) => Number(a.yearOfGraduation) - Number(b.yearOfGraduation),
    );
    const byProgram = groupTraced(byProgramEmployment, "program").sort(
      (a, b) => String(a.program ?? "").localeCompare(String(b.program ?? "")),
    );

    res.status(200).json({
      totals: {
        traced,
        employed,
        notEmployed: countOf(byEmployment, "isEmployed", NO),
        employmentRate: percent(employed, traced),
        jobAligned: aligned,
        jobNotAligned: notAligned,
        jobAlignmentRate: percent(aligned, aligned + notAligned),
        selfEmployed: countOf(bySelf, "isSelfEmployed", YES),
        furtherStudies: countOf(byFurther, "isFurtherStudies", YES),
      },
      byYear,
      byProgram,
      organization: [
        {
          organization: "Government",
          total: countOf(byOrganization, "typeOfOrganization", "government"),
        },
        {
          organization: "Private",
          total: countOf(
            byOrganization,
            "typeOfOrganization",
            "private institution",
          ),
        },
        {
          organization: "Entrepreneurial",
          // "entreprenueral" is the spelling older survey forms saved.
          total:
            countOf(
              byOrganization,
              "typeOfOrganization",
              "entrepreneurial / freelance",
            ) +
            countOf(
              byOrganization,
              "typeOfOrganization",
              "entreprenueral / freelance",
            ),
        },
      ],
      location: [
        {
          location: "Locally",
          total: countOf(byLocation, "currentJobLocated", "locally"),
        },
        {
          location: "Abroad",
          total: countOf(byLocation, "currentJobLocated", "abroad"),
        },
      ],
    });
  } catch (error) {
    sendServerError(res, "analytics.controller getAnalytics", error);
  }
});

export default { getAnalytics };
