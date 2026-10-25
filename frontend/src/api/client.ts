/**
 * API client of the Graduate Tracer frontend.
 *
 * @remarks
 * One object, `client`, with every call the frontend makes. The original four
 * methods keep their names and arguments, so existing screens keep working. The
 * new calls are grouped:
 *
 * - `client.auth`: sign in, sign out and check the session.
 * - `client.admin`: the admin dashboard and everything that changes data.
 *
 * The transport rules (cookies, CSRF header, timeouts, retries, errors) are in
 * `http.ts`.
 *
 * **File location:** `src/api/client.ts`.
 *
 * **Which calls need an admin session**
 *
 * | Group                                                | Session      |
 * | ---------------------------------------------------- | ------------ |
 * | `getDepartment`, `getRelatedProgram`, `getRelatedMajor`, `listProgram`, `listMajor`, `addResponse` | none (public) |
 * | `client.auth.login`, `client.auth.logout`            | none         |
 * | `client.auth.getSession`                             | admin        |
 * | everything in `client.admin`                         | admin        |
 *
 * Without a session, admin calls fail with an `ApiError` whose `status` is
 * `401`, and `AuthProvider` returns the admin to the login page.
 *
 * **Environment variables (frontend)**
 *
 * - `VITE_API_URL`: the API address, set at build time. See `http.ts`.
 *
 * **Cookies and domains (read before deploying)**
 *
 * The admin session is a cookie set by the API. Browsers only send it when the
 * frontend and the API count as the same site. If they are on different domains
 * (for example the frontend on Vercel or Netlify and the API on onrender.com),
 * login appears to work and then every admin request gets `401`. Fix it with
 * one of these, best first:
 *
 * 1. **Same site.** Put both under one domain you own, for example
 *    `tracer.ispsc.edu.ph` (frontend) and `api.ispsc.edu.ph` (API). Nothing else
 *    to change.
 * 2. **Forward `/api` through the frontend host.** Add a rewrite on the host,
 *    so the browser only talks to the frontend's own address, then build with
 *    `VITE_API_URL=/api/graduateTracer`.
 *    - Vercel: in `vercel.json`, a rewrite with source `/api/:path*` and
 *      destination `https://ispsc-graduate-tracer.onrender.com/api/:path*`.
 *    - Netlify: in `_redirects`, the line
 *      `/api/*  https://ispsc-graduate-tracer.onrender.com/api/:splat  200`.
 *    - Render static site: a Rewrite rule from `/api/*` to the same address.
 * 3. **Last resort.** Set `COOKIE_SAME_SITE=none` on the backend. This works in
 *    Chrome, Edge and Firefox, but Safari and all iPhone browsers block cookies
 *    from another site, so the admin cannot sign in there.
 *
 * **Deployment checklist**
 *
 * Backend (Render environment): `NODE_ENV=production`, `JWT_SECRET`,
 * `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `DATABASE_URL`, `EMAIL_FROM`,
 * `EMAIL_PASS`, `TRUST_PROXY=1`, and `CLIENT_URL` set to the exact address of
 * the frontend (with `https://`, no trailing slash). `COOKIE_SAME_SITE` only for
 * option 3.
 *
 * Frontend (host environment): `VITE_API_URL` if it is not the default. Rebuild
 * after changing it.
 *
 * Both: HTTPS everywhere. Without it the session cookie is never sent.
 *
 * **Handling errors in a screen**
 *
 * ```ts
 * import { ApiError } from "../api/http";
 *
 * try {
 *   await client.admin.addProgram(departmentId, name);
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 401) return; // signed out
 *   setMessage(error instanceof Error ? error.message : "Unexpected error");
 * }
 * ```
 *
 * Stop a request when a component unmounts by passing a signal:
 *
 * ```ts
 * useEffect(() => {
 *   const controller = new AbortController();
 *   client.admin.getSummary({ signal: controller.signal }).then(setRows);
 *   return () => controller.abort();
 * }, []);
 * ```
 *
 * Calls that load data accept `{ signal }` as their last argument.
 *
 * @packageDocumentation
 */

import { http, segment } from "./http";
import type {
  collegeDepartment,
  DepartmentDetails,
  Graduates,
  Major,
  OverviewTracedGraduates,
  Response as SurveyResponse,
  TotalGraduatesType,
} from "../types/type";
import type {
  AdminProgram,
  JobLocationTotal,
  LoginResult,
  MessageResponse,
  OrganizationTotal,
  ProgramListItem,
  ProgramSummary,
  QuestionResult,
  SessionInfo,
  SurveyResponseRow,
  TracedPercentageResult,
} from "../types/api";
import { AdminColumnDef } from "../components/table/columns";

/** Options of the calls that only read data. */
type ReadOptions = { signal?: AbortSignal };

/** Public call: no admin session, so a `401` must not sign anyone out. */
const PUBLIC = { auth: false } as const;

/** Public read that uses `POST` in this API. Safe to repeat. */
const PUBLIC_READ = { auth: false, idempotent: true } as const;

/** Builds the path of an endpoint that takes a year and a program. */
const cohort = (
  prefix: string,
  yearOfGraduation: number | string,
  program: string,
): string => `${prefix}/${segment(yearOfGraduation)}/${segment(program)}`;

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */

const auth = {
  /**
   * Signs the admin in. The server answers with a session cookie.
   *
   * @throws `ApiError` `401` for a wrong username or password, `429` after too
   * many attempts (five failures in 15 minutes).
   */
  login: (username: string, password: string) =>
    http.post<LoginResult>("/auth/login", { username, password }, PUBLIC),

  /** Signs the admin out by removing the session cookie. */
  logout: () => http.post<MessageResponse>("/auth/logout", undefined, PUBLIC),

  /**
   * Asks the server whether the admin is signed in. The page cannot read the
   * `HttpOnly` cookie itself, so this is the only way to know.
   *
   * @throws `ApiError` `401` when there is no valid session.
   */
  getSession: (options?: ReadOptions) =>
    http.get<SessionInfo>("/auth/me", options),
};

/* -------------------------------------------------------------------------- */
/*                                    Admin                                   */
/* -------------------------------------------------------------------------- */

const admin = {
  /* ------------------------------- Dashboard ------------------------------ */

  /** Employment summary of every graduation year and program. */
  getSummary: (options?: ReadOptions) =>
    http.get<AdminColumnDef[]>("/admin/getAllData", options),

  /** Traced graduates in each department. */
  getDepartmentOverview: (options?: ReadOptions) =>
    http.get<OverviewTracedGraduates[]>("/admin/overviewStudents", options),

  /** Every program, without its department id. */
  listPrograms: (options?: ReadOptions) =>
    http.get<AdminProgram[]>("/admin/listOfPrograms", options),

  /** Every department with its programs and majors. */
  getDepartmentDetails: (options?: ReadOptions) =>
    http.get<DepartmentDetails[]>("/admin/department/details", options),

  /* --------------------------- One year and program ----------------------- */

  /** Raw survey responses of one graduation year and program. */
  getGraduates: (
    yearOfGraduation: number,
    program: string,
    options?: ReadOptions,
  ) =>
    http.get<SurveyResponseRow[]>(
      cohort("/admin/graduates", yearOfGraduation, program),
      options,
    ),

  /** The configured number of graduates (the denominator of the percentage). */
  getTotalGraduates: (
    yearOfGraduation: number | string,
    program: string,
    options?: ReadOptions,
  ) =>
    http.get<TotalGraduatesType[]>(
      cohort("/admin/graduates/total", yearOfGraduation, program),
      options,
    ),

  /**
   * Sets the total number of graduates of a record.
   *
   * @param totalId - The `id` of the record from `getTotalGraduates`.
   * @param totalGraduates - A whole number, `0` or more.
   */
  editTotalGraduates: (
    yearOfGraduation: number | string,
    program: string,
    totalId: number,
    totalGraduates: number,
  ) =>
    http.post<MessageResponse>(
      cohort("/admin/graduates/total", yearOfGraduation, program),
      { id: totalId, totalGraduates },
    ),

  /**
   * Sets the total number of graduates of a record, found by its `id`.
   * The server ignores the year and program in this route's URL, so fixed
   * placeholders are used.
   */
  setTotalGraduates: (totalId: number, totalGraduates: number) =>
    http.post<MessageResponse>("/admin/graduates/total/0/-", {
      id: totalId,
      totalGraduates,
    }),

  /** Employed and not-employed counts for each major. */
  getEmploymentStatistics: (
    yearOfGraduation: number | string,
    program: string,
    options?: ReadOptions,
  ) =>
    http.get<Graduates[]>(
      cohort("/admin/employmentStatistics", yearOfGraduation, program),
      options,
    ),

  /** Yes and no counts of the four core survey questions. */
  getQuestions: (
    yearOfGraduation: number | string,
    program: string,
    options?: ReadOptions,
  ) =>
    http.get<QuestionResult[]>(
      cohort("/admin/questions", yearOfGraduation, program),
      options,
    ),

  /** Traced and untraced percentage for each major. */
  getTracedPercentage: (
    yearOfGraduation: number | string,
    program: string,
    options?: ReadOptions,
  ) =>
    http.get<TracedPercentageResult[]>(
      cohort("/admin/percentage", yearOfGraduation, program),
      options,
    ),

  /** Graduates by type of organization (always three entries). */
  getOrganizations: (
    yearOfGraduation: number | string,
    program: string,
    options?: ReadOptions,
  ) =>
    http.get<OrganizationTotal[]>(
      cohort("/admin/organization", yearOfGraduation, program),
      options,
    ),

  /** Graduates working locally and abroad. */
  getJobLocations: (
    yearOfGraduation: number | string,
    program: string,
    options?: ReadOptions,
  ) =>
    http.get<JobLocationTotal[]>(
      cohort("/admin/jobLocation", yearOfGraduation, program),
      options,
    ),

  /** Permanently deletes one survey response. This cannot be undone. */
  deleteResponse: (id: number) =>
    http.delete<MessageResponse>(`/admin/student/response/${segment(id)}`),

  /* ------------------------------- Departments ---------------------------- */

  addDepartment: (department: string) =>
    http.post<MessageResponse>("/department/add", { department }),

  editDepartment: (id: number, department: string) =>
    http.post<MessageResponse>(`/department/edit/${segment(id)}`, {
      department,
    }),

  /**
   * Permanently deletes a department. The server answers `409` while programs
   * still use it.
   */
  removeDepartment: (id: number) =>
    http.post<MessageResponse>(`/department/remove/${segment(id)}`),

  /* -------------------------------- Programs ------------------------------ */

  addProgram: (departmentId: number, program: string) =>
    http.post<MessageResponse>(`/program/add/${segment(departmentId)}`, {
      program,
    }),

  editProgram: (programId: number, program: string) =>
    http.post<MessageResponse>(`/program/edit/${segment(programId)}`, {
      program,
    }),

  /** Permanently deletes a program. The server answers `409` if it is in use. */
  removeProgram: (programId: number) =>
    http.post<MessageResponse>(`/program/remove/${segment(programId)}`),

  /* --------------------------------- Majors ------------------------------- */

  /** The request body `{ major }` is an assumption: check `majorController`. */
  addMajor: (programId: number, major: string) =>
    http.post<MessageResponse>(`/major/add/${segment(programId)}`, { major }),

  editMajor: (majorId: number, major: string) =>
    http.post<MessageResponse>(`/major/edit/${segment(majorId)}`, { major }),

  removeMajor: (majorId: number) =>
    http.post<MessageResponse>(`/major/remove/${segment(majorId)}`),
};

/* -------------------------------------------------------------------------- */
/*                                   Client                                   */
/* -------------------------------------------------------------------------- */

export const client = {
  /* ------------------------------ Public reads ---------------------------- */

  /** Lists departments (colleges). Used by the survey form. */
  getDepartment: (options?: ReadOptions) =>
    http.get<collegeDepartment[]>("/department/list", { ...PUBLIC, ...options }),

  /** Lists the programs of a department. */
  getRelatedProgram: (departmentId: number, options?: ReadOptions) =>
    http.post<ProgramListItem[]>(
      `/department/program/${segment(departmentId)}`,
      undefined,
      { ...PUBLIC_READ, ...options },
    ),

  /** Lists the majors of a program. */
  getRelatedMajor: (programId: number, options?: ReadOptions) =>
    http.post<Major[]>(`/major/${segment(programId)}`, undefined, {
      ...PUBLIC_READ,
      ...options,
    }),

  /** Lists every program. */
  listProgram: (options?: ReadOptions) =>
    http.get<ProgramListItem[]>("/program/list", { ...PUBLIC, ...options }),

  /** Lists every major. */
  listMajor: (options?: ReadOptions) =>
    http.get<Major[]>("/major/list", { ...PUBLIC, ...options }),

  /* ------------------------------ Survey submit --------------------------- */

  /**
   * Saves a graduate's survey response.
   *
   * @remarks
   * Never retried: every successful submission sends a thank-you email. Disable
   * the submit button while this runs, so a double click cannot send it twice.
   *
   * Only the fields listed here are sent, whatever else the form object holds.
   * The server trims the text, saves the email and the six answers in lower
   * case, and rejects an email that is already traced with `409`.
   */
  addResponse: ({
    yearOfSurvey,
    email,
    fullName,
    yearOfGraduation,
    departmentId,
    programId,
    majorId,
    isEmployed,
    isJobAligned,
    isSelfEmployed,
    isFurtherStudies,
    typeOfOrganization,
    currentJobLocated,
  }: SurveyResponse) =>
    http.post<MessageResponse>(
      "/user/add/response",
      {
        yearOfSurvey,
        email,
        fullName,
        yearOfGraduation,
        departmentId,
        programId,
        majorId,
        isEmployed,
        isJobAligned,
        isSelfEmployed,
        isFurtherStudies,
        typeOfOrganization,
        currentJobLocated,
      },
      PUBLIC,
    ),

  auth,
  admin,
};