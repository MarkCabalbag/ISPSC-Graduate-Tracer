/**
 * Types of the Graduate Tracer API answers.
 *
 * @remarks
 * **File location:** `src/types/api.ts`, next to your existing `type.ts`.
 *
 * These were written from the backend controllers. Two shapes could not be
 * checked because their controllers were not available: `Major` (assumed to
 * have a `programId`) and the body of `addMajor` / `editMajor` (assumed to be
 * `{ major }`). Adjust them if your `majorController` differs.
 *
 * Survey answers (`isEmployed`, `typeOfOrganization`, ...) are saved by the
 * server in lower case, for example `"yes"` and `"private institution"`.
 */

/** A plain confirmation answer, for example after adding or deleting. */
export type MessageResponse = {
  message: string;
};

/* ---------------------------------- Auth ---------------------------------- */

/** Answer of `POST /auth/login`. The session token is in a cookie, not here. */
export type LoginResult = {
  message: string;
  /** Length of the session, in seconds. */
  expiresIn: number;
};

/** Answer of `GET /auth/me`. */
export type SessionInfo = {
  authenticated: boolean;
  /** End of the session, in milliseconds since 1970. */
  expiresAt: number;
};

/* --------------------------- Departments and more -------------------------- */

export type Department = {
  id: number;
  department: string;
};

export type Program = {
  id: number;
  program: string;
  departmentId: number;
};

/** Assumed shape: check it against your `majorController`. */
export type Major = {
  id: number;
  major: string;
  programId: number;
};

/** A department with its programs and each program's majors. */
export type DepartmentDetails = Department & {
  listOfProgram: {
    id: number;
    program: string;
    listOfMajor: { id: number; major: string }[];
  }[];
};

/* ---------------------------------- Admin ---------------------------------- */

/** One row of the summary table: counts for one year and program. */
export type ProgramSummary = {
  yearOfGraduation: string;
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
};

/** Traced graduates of one department. */
export type OverviewTracedGraduates = {
  id: number;
  department: string;
  totalTracedGraduates: number;
};

/** A program as listed by the admin, without its department id. */
export type AdminProgram = Omit<Program, "departmentId">;

/**
 * A raw survey response. The table may contain extra columns (for example
 * dates), which are not listed here.
 */
export type SurveyResponseRow = {
  id: number;
  fullName: string;
  email: string;
  yearOfGraduation: number;
  yearOfSurvey: number;
  department: string | null;
  program: string | null;
  major: string | null;
  isEmployed: string;
  isJobAligned: string;
  isSelfEmployed: string;
  isFurtherStudies: string;
  typeOfOrganization: string;
  currentJobLocated: string;
};

/** The configured number of graduates of a year and program. */
export type TotalRecord = {
  id: number;
  yearOfGraduation: number;
  program: string;
  department: string | null;
  totalGraduates: number | null;
};

export type EmploymentStatistic = {
  major: string | null;
  totalCount: number;
  totalEmployed: number;
  totalNotEmployed: number;
};

export type QuestionResult = {
  question: string;
  yes: number;
  no: number;
};

export type TracedPercentageResult = {
  major: string;
  /** `null` when no total of graduates is configured. */
  tracedPercentage: number | null;
  untTracedPercentage: number | null;
};

export type OrganizationTotal = {
  organization: string;
  total: number;
};

export type JobLocationTotal = {
  location: string;
  total: number;
};

/**
 * A flat program row, as listed by `/program/list` and
 * `/department/program/:id`. It has no `listOfMajor` (see above).
 */
export type ProgramListItem = {
  id: number;
  program: string;
  departmentId: number;
};