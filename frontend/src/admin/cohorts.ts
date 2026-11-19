/** Aggregation of the per-cohort summary rows (GET /admin/getAllData) for the admin screens. */
import { useSearchParams } from "react-router-dom";
import type { ProgramSummary } from "../types/api";

export type Totals = {
  traced: number;
  employed: number;
  aligned: number;
  notAligned: number;
  government: number;
  privateSector: number;
  ownBusiness: number;
  locally: number;
  abroad: number;
  selfEmployed: number;
  furtherStudies: number;
};

export const emptyTotals = (): Totals => ({
  traced: 0,
  employed: 0,
  aligned: 0,
  notAligned: 0,
  government: 0,
  privateSector: 0,
  ownBusiness: 0,
  locally: 0,
  abroad: 0,
  selfEmployed: 0,
  furtherStudies: 0,
});

export const addRow = (totals: Totals, row: ProgramSummary): Totals => ({
  traced: totals.traced + row.totalTracedGraduates,
  employed: totals.employed + row.totalEmployedStudents,
  aligned: totals.aligned + row.totalEmployedGraduatesAlignedToTheirProgram,
  notAligned: totals.notAligned + row.totalEmployedGraduatesNotAlignedToTheirProgram,
  government: totals.government + row.totalOfGraduatesEmployedInGovernment,
  privateSector: totals.privateSector + row.totalOfGraduatesEmployedInPrivate,
  ownBusiness: totals.ownBusiness + row.totalOfGraduatesFreelance,
  locally: totals.locally + row.totalOfGraduatesEmployedLocally,
  abroad: totals.abroad + row.totalOfGraduatesEmployedAbroad,
  selfEmployed: totals.selfEmployed + row.totalOfSelfEmployed,
  furtherStudies: totals.furtherStudies + row.totalOfGraduatesEnrolledInFurtherStudies,
});

export const sumRows = (rows: ProgramSummary[]) => rows.reduce(addRow, emptyTotals());

/** A share as a percentage, or null when there is nothing to divide by. */
export const rate = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);

export const employmentRate = (t: Totals) => rate(t.employed, t.traced);
export const alignmentRate = (t: Totals) => rate(t.aligned, t.aligned + t.notAligned);

export const formatRate = (value: number | null) => (value === null ? "–" : `${Math.round(value)}%`);

export const yearsOf = (rows: ProgramSummary[]) =>
  [...new Set(rows.map((r) => r.yearOfGraduation))].sort((a, b) => Number(b) - Number(a));

export const programsOf = (rows: ProgramSummary[]) =>
  [...new Set(rows.map((r) => r.program ?? "Unspecified"))].sort((a, b) => a.localeCompare(b));

/** The year and program filters, kept in the URL so a view can be shared by link. */
export const useCohortFilters = () => {
  const [params, setParams] = useSearchParams();
  const year = params.get("year") ?? "";
  const program = params.get("program") ?? "";
  const set = (next: { year?: string; program?: string }) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value) merged.set(key, value);
      else merged.delete(key);
    }
    setParams(merged, { replace: true });
  };
  return { year, program, set };
};

export const matches = (row: ProgramSummary, year: string, program: string) =>
  (!year || row.yearOfGraduation === year) && (!program || (row.program ?? "Unspecified") === program);

/** Starts a file download from a Blob without leaving the page. */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
