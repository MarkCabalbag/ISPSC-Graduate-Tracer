/**
 * =============================================================================
 * columns.tsx: table column definitions for the admin side
 * =============================================================================
 *
 * PURPOSE
 * -------
 * Defines the columns of two TanStack Table (@tanstack/react-table v8) tables:
 *
 *   1. `columns`                 Summary table: one row per year + program,
 *                                with employment totals.
 *   2. `graduatesRowColumnDef`   Detail table: one row per surveyed graduate,
 *                                with Delete / Update buttons.
 *
 * This file only DESCRIBES the columns. It does not fetch data and does not
 * create the table. The page does that.
 *
 * EXPORTS
 * -------
 *   AdminColumnDef          Type of one row of the summary table.
 *   GraduateRow             Type of one row of the detail table.
 *   columns                 Column definitions for AdminColumnDef rows.
 *   graduatesRowColumnDef   Column definitions for GraduateRow rows.
 *
 * USAGE
 * -----
 *   const table = useReactTable({
 *     data,                                  // AdminColumnDef[]
 *     columns,
 *     getCoreRowModel: getCoreRowModel(),
 *     getSortedRowModel: getSortedRowModel(), // needed for sorting
 *   });
 *
 *   // Detail table: same, with `data` as GraduateRow[] and
 *   // `columns: graduatesRowColumnDef`.
 *
 * DATA REQUIREMENTS
 * -----------------
 *   - Every row must have the fields of its type (see the types below).
 *     A missing field renders an empty cell.
 *   - GraduateRow.id is REQUIRED: the Delete / Update buttons use it to
 *     tell AppModal which record to act on.
 *
 * SORTING
 * -------
 *   Columns are sortable by default. In the detail table only Full Name and
 *   Year of Survey are sortable; every other column has `enableSorting: false`.
 *
 * ACTIONS COLUMN (detail table)
 * -----------------------------
 *   Each row renders <RowActions />, which opens <AppModal /> with:
 *     Delete -> { type: "deleteStudent", id }
 *     Update -> { type: "updateStudent", id }   (updateStudent is unfinished,
 *                                                see the TODO in AppModal)
 *   Needs: ../modal/AppDialog (AppModal), ../ui/button.
 *
 * HOW TO ADD A COLUMN
 * -------------------
 *   1. Add the field to the row type (AdminColumnDef or GraduateRow).
 *   2. Add one columnHelper.accessor("<field>", { ... }) entry to the array.
 *      TypeScript errors if the field name is not in the row type.
 * =============================================================================
 */

import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "../ui/button";
import AppModal, { type ModalState } from "../modal/AppDialog";
// Adjust this path if ProgramSummary lives in another file.



/**
 * One row of the detail table (one surveyed graduate).
 * One field per column of `graduatesRowColumnDef`, plus `id`.
 * Fields a graduate may leave empty (for example a major, or the job
 * questions when unemployed) are `string | null`; an empty cell renders blank.
 */
export type GraduateRow = {
  /** Record id. Not a column: the Delete / Update buttons use it. */
  id: number;
  fullName: string;
  email: string;
  yearOfGraduation: number;
  yearOfSurvey: number;
  department: string | null;
  program: string | null;
  major: string | null;
  /** "Are you currently employed?" */
  isEmployed: string | null;
  /** "Is your job aligned with your program?" */
  isJobAligned: string | null;
  /** "Are you self-employed?" */
  isSelfEmployed: string | null;
  /** "Are you currently enrolled in further studies?" */
  isFurtherStudies: string | null;
  /** "What type of organization do you work for?" */
  typeOfOrganization: string | null;
  /** "Where is your current job located?" */
  currentJobLocated: string | null;
};

export type AdminColumnDef = {
  yearOfGraduation: string;
  program: string;
  totalGraduates: number;
  totalTracedStudents: number;
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
};

/* -----------------------------------------------------------------------------
 * Summary table
 * ---------------------------------------------------------------------------*/

const summaryColumn = createColumnHelper<AdminColumnDef>();

/** Columns of the summary table. Rows are {@link AdminColumnDef}. */
export const columns = [
  summaryColumn.accessor("yearOfGraduation", {
    id: "yearOfGraduation",
    header: () => "Year Graduated",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("program", {
    id: "program",
    header: () => "Program",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalGraduates", {
    id: "totalTracedGraduates",
    header: () => "Total Traced Graduates",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalEmployedStudents", {
    id: "totalEmployedStudents",
    header: () => "Total Employed Students",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalEmployedGraduatesAlignedToTheirProgram", {
    id: "totalEmployedGraduatesAlignedToTheirProgram",
    header: () => "Total Employed Graduates Aligned To Their Program",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalEmployedGraduatesNotAlignedToTheirProgram", {
    id: "totalEmployedGraduatesNotAlignedToTheirProgram",
    header: () => "Total Employed Graduates Not Aligned To Their Program",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalOfSelfEmployed", {
    id: "totalOfSelfEmployed",
    header: () => "Total of Self Employed",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalOfGraduatesEnrolledInFurtherStudies", {
    id: "totalOfGraduatesEnrolledInFurtherStudies",
    header: () => "Total of Graduates Enrolled In Further Studies",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalOfGraduatesEmployedInGovernment", {
    id: "totalOfGraduatesEmployedInGovernment",
    header: () => "Total of Graduates Employed In Government",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalOfGraduatesEmployedInPrivate", {
    id: "totalOfGraduatesEmployedInPrivate",
    header: () => "Total of Graduates Employed In Private Institutions",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalOfGraduatesFreelance", {
    id: "totalOfGraduatesFreelance",
    header: () => "Total of Graduates Engaged in Freelance / Entrepreneurial",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalOfGraduatesEmployedLocally", {
    id: "totalOfGraduatesEmployedLocally",
    header: () => "Total of Graduates Employed Locally",
    cell: (info) => info.getValue(),
  }),
  summaryColumn.accessor("totalOfGraduatesEmployedAbroad", {
    id: "totalOfGraduatesEmployedAbroad",
    header: () => "Total of Graduates Employed Abroad",
    cell: (info) => info.getValue(),
  }),
];

/* -----------------------------------------------------------------------------
 * Detail table
 * ---------------------------------------------------------------------------*/

/**
 * Delete / Update buttons for one row.
 *
 * @param id REQUIRED. Record id of the row. It is passed to AppModal.
 * @returns A `<div>` with the two buttons. The modal is only rendered while
 *   open (AppModal returns null when closed).
 */
const RowActions = ({ id }: { id: number }) => {
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <div className="flex gap-2">
      <AppModal modal={modal} onClose={() => setModal(null)} />
      <Button onClick={() => setModal({ type: "deleteStudent", id })}>
        Delete
      </Button>
      <Button onClick={() => setModal({ type: "updateStudent", id })}>
        Update
      </Button>
    </div>
  );
};

const detailColumn = createColumnHelper<GraduateRow>();

/** Shared option for columns that must not be sortable. */
const notSortable = { enableSorting: false } as const;

/** Columns of the detail table. Rows are {@link GraduateRow}. */
export const graduatesRowColumnDef = [
  detailColumn.accessor("fullName", {
    id: "fullName",
    header: () => "Full Name",
    cell: (info) => info.getValue(),
  }),
  detailColumn.accessor("email", {
    id: "email",
    header: () => "Email",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("yearOfGraduation", {
    id: "yearOfGraduation",
    header: () => "Year of Graduation",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("yearOfSurvey", {
    id: "yearOfSurvey",
    header: () => "Year of Survey",
    cell: (info) => info.getValue(),
  }),
  detailColumn.accessor("department", {
    id: "department",
    header: () => "Department",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("program", {
    id: "program",
    header: () => "Program",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("major", {
    id: "major",
    header: () => "Major",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("isEmployed", {
    id: "isEmployed",
    header: () => "Are you currently employed?",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("isJobAligned", {
    id: "isJobAligned",
    header: () => "Is your job aligned with your program?",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("isSelfEmployed", {
    id: "isSelfEmployed",
    header: () => "Are you self-employed?",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("isFurtherStudies", {
    id: "isFurtherStudies",
    header: () => "Are you currently enrolled in further studies?",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("typeOfOrganization", {
    id: "typeOfOrganization",
    header: () => "What type of organization do you work for?",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  detailColumn.accessor("currentJobLocated", {
    id: "currentJobLocated",
    header: () => "Where is your current job located?",
    cell: (info) => info.getValue(),
    ...notSortable,
  }),
  // `display` is for columns that are not backed by a data field.
  detailColumn.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <RowActions id={row.original.id} />,
  }),
];