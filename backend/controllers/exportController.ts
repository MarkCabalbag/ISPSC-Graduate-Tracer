/**
 * CSV export of survey responses for reports.
 *
 * @remarks
 * `GET /api/graduateTracer/admin/responses/export` with the optional query
 * parameters `yearOfGraduation` (4 digits), `program` and `department`.
 * Admin only (the router applies `requireAdmin`).
 *
 * Spreadsheet programs run text that starts with `=`, `+`, `-` or `@` as a
 * formula. A graduate could type such text in the survey, so `toCsvCell`
 * prefixes those cells with an apostrophe (CSV injection protection).
 */

import type { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import prisma from "../lib/prisma.js";
import { sendServerError } from "../utils/httpErrors.js";
import { toCsvCell } from "../utils/csv.js";

const MAX_FILTER_LENGTH = 150;

/** Byte order mark: makes Excel read the file as UTF-8. */
const BOM = String.fromCharCode(0xfeff);

const COLUMNS = [
  "id",
  "fullName",
  "email",
  "yearOfGraduation",
  "yearOfSurvey",
  "department",
  "program",
  "major",
  "isEmployed",
  "isJobAligned",
  "isSelfEmployed",
  "isFurtherStudies",
  "typeOfOrganization",
  "currentJobLocated",
] as const;

/** Reads an optional text filter: `undefined` if absent, `null` if invalid. */
const readFilter = (value: unknown): string | null | undefined => {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" || value.length > MAX_FILTER_LENGTH) {
    return null;
  }
  return value.trim();
};

const exportResponses = asyncHandler(async (req: Request, res: Response) => {
  const program = readFilter(req.query.program);
  const department = readFilter(req.query.department);
  const yearText = readFilter(req.query.yearOfGraduation);

  if (
    program === null ||
    department === null ||
    yearText === null ||
    (yearText !== undefined && !/^\d{4}$/.test(yearText))
  ) {
    res.status(400).json({ message: "Invalid export filter" });
    return;
  }

  try {
    const rows = await prisma.responses.findMany({
      where: {
        ...(program ? { program } : {}),
        ...(department ? { department } : {}),
        ...(yearText ? { yearOfGraduation: Number(yearText) } : {}),
      },
      orderBy: { id: "asc" },
    });

    const lines = [
      COLUMNS.join(","),
      ...rows.map((row) =>
        COLUMNS.map((column) => toCsvCell(row[column])).join(","),
      ),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="graduate-responses.csv"',
    );
    // The leading BOM makes Excel read the file as UTF-8.
    res.status(200).send(`${BOM}${lines.join("\r\n")}\r\n`);
  } catch (error) {
    sendServerError(res, "export.controller exportResponses", error);
  }
});

export default { exportResponses };
