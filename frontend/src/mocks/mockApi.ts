/**
 * Sample-data API for the design preview (`npm run preview:demo`).
 *
 * It answers the same routes as the real backend with invented sample records, so every
 * screen can be seen without a database or a sign-in to the real system. Every name and
 * figure here is fake. The module is only imported when VITE_MOCK_API is "true", which a
 * production build never sets, so it is never shipped.
 *
 * Preview admin sign-in: username "admin", password "preview".
 */
import { ApiError } from "../api/http";

type Row = {
  id: number;
  email: string;
  fullName: string;
  yearOfGraduation: number;
  yearOfSurvey: number;
  department: string;
  program: string;
  major: string | null;
  isEmployed: string;
  isJobAligned: string;
  isSelfEmployed: string;
  isFurtherStudies: string;
  typeOfOrganization: string;
  currentJobLocated: string;
};

type Department = { id: number; department: string };
type Program = { id: number; program: string; departmentId: number };
type Major = { id: number; major: string; programId: number };
type Total = { id: number; yearOfGraduation: number; program: string; department: string; totalGraduates: number };

/* --------------------------------- seed data -------------------------------- */

let seed = 20231;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];

const departments: Department[] = [
  { id: 1, department: "COLLEGE OF COMPUTING STUDIES" },
  { id: 2, department: "COLLEGE OF TEACHER EDUCATION" },
  { id: 3, department: "COLLEGE OF CRIMINAL JUSTICE EDUCATION" },
  { id: 4, department: "COLLEGE OF AGRICULTURE" },
];
const programs: Program[] = [
  { id: 1, program: "BSIT", departmentId: 1 },
  { id: 2, program: "BSEd", departmentId: 2 },
  { id: 3, program: "BEEd", departmentId: 2 },
  { id: 4, program: "BSCrim", departmentId: 3 },
  { id: 5, program: "BSA", departmentId: 4 },
];
const majors: Major[] = [
  { id: 1, major: "English", programId: 2 },
  { id: 2, major: "Mathematics", programId: 2 },
  { id: 3, major: "Science", programId: 2 },
  { id: 4, major: "Crop Science", programId: 5 },
  { id: 5, major: "Animal Science", programId: 5 },
];

const FIRST = ["Juan", "Maria", "Paolo", "Liza", "Carlo", "Andrea", "Mark", "Joy", "Ramon", "Kristine", "Jerome", "Angela", "Rodel", "Mylene", "Arvin", "Clarisse", "Noel", "Rhea", "Dennis", "Camille"];
const LAST = ["Dela Cruz", "Reyes", "Santos", "Agbayani", "Ramos", "Pascua", "Domingo", "Ancheta", "Tabios", "Galima", "Rabago", "Bautista", "Cabanilla", "Pira", "Ragasa", "Valdez", "Lazo", "Gaerlan", "Tadeo", "Corpuz"];

const COHORT_SIZES: Record<string, number> = { BSIT: 160, BSEd: 150, BEEd: 90, BSCrim: 130, BSA: 100 };
const TRACE_RATE: Record<string, number> = { BSIT: 0.83, BSEd: 0.79, BEEd: 0.7, BSCrim: 0.66, BSA: 0.76 };
const EMPLOY_RATE: Record<string, number> = { BSIT: 0.84, BSEd: 0.79, BEEd: 0.81, BSCrim: 0.7, BSA: 0.76 };
const ALIGN_RATE: Record<string, number> = { BSIT: 0.71, BSEd: 0.74, BEEd: 0.77, BSCrim: 0.52, BSA: 0.49 };

const rows: Row[] = [];
const totals: Total[] = [];
let nextId = 1;
let totalId = 1;

for (const year of [2021, 2022, 2023, 2024]) {
  for (const program of programs) {
    const department = departments.find((d) => d.id === program.departmentId)!.department;
    const size = Math.round(COHORT_SIZES[program.program] * (0.85 + rand() * 0.3));
    totals.push({ id: totalId++, yearOfGraduation: year, program: program.program, department, totalGraduates: year === 2024 && program.program === "BEEd" ? 0 : size });
    const traced = Math.round(size * TRACE_RATE[program.program] * (year === 2024 ? 0.55 : 1));
    const programMajors = majors.filter((m) => m.programId === program.id);
    for (let i = 0; i < traced; i++) {
      const first = pick(FIRST);
      const last = pick(LAST);
      const employed = rand() < EMPLOY_RATE[program.program];
      const abroad = employed && rand() < (program.program === "BSA" ? 0.4 : 0.08);
      const sector = employed ? pick(["government", "government", "private institution", "private institution", "entrepreneurial / freelance"]) : "not applicable";
      rows.push({
        id: nextId++,
        email: `${first}.${last}.${nextId}`.toLowerCase().replace(/\s+/g, "") + "@example.com",
        fullName: `${first} ${last}`,
        yearOfGraduation: year,
        yearOfSurvey: Math.min(year + 1, 2026),
        department,
        program: program.program,
        major: programMajors.length ? pick(programMajors).major : null,
        isEmployed: employed ? "yes" : "no",
        isJobAligned: employed ? (rand() < ALIGN_RATE[program.program] ? "yes" : "no") : "not applicable",
        isSelfEmployed: sector === "entrepreneurial / freelance" ? "yes" : "no",
        isFurtherStudies: rand() < 0.12 ? "yes" : "no",
        typeOfOrganization: sector,
        currentJobLocated: employed ? (abroad ? "abroad" : "locally") : "not applicable",
      });
    }
  }
}

/* ---------------------------------- session --------------------------------- */

const SESSION_KEY = "ispsc-preview-session";
const SESSION_SECONDS = 8 * 60 * 60;
const hasSession = () => {
  try {
    return Number(sessionStorage.getItem(SESSION_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
};

/* ---------------------------------- helpers --------------------------------- */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (status: number, message: string): never => {
  throw new ApiError(status, message);
};
const requireAdmin = () => {
  if (!hasSession()) fail(401, "Authentication required");
};

const summary = () => {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = `${row.yearOfGraduation}|${row.program}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()]
    .map((group) => {
      const count = (test: (r: Row) => boolean) => group.filter(test).length;
      return {
        yearOfGraduation: String(group[0].yearOfGraduation),
        program: group[0].program,
        totalTracedGraduates: group.length,
        totalEmployedStudents: count((r) => r.isEmployed === "yes"),
        totalEmployedGraduatesAlignedToTheirProgram: count((r) => r.isJobAligned === "yes"),
        totalEmployedGraduatesNotAlignedToTheirProgram: count((r) => r.isJobAligned === "no"),
        totalOfSelfEmployed: count((r) => r.isSelfEmployed === "yes"),
        totalOfGraduatesEnrolledInFurtherStudies: count((r) => r.isFurtherStudies === "yes"),
        totalOfGraduatesEmployedInGovernment: count((r) => r.typeOfOrganization === "government"),
        totalOfGraduatesEmployedInPrivate: count((r) => r.typeOfOrganization === "private institution"),
        totalOfGraduatesFreelance: count((r) => r.typeOfOrganization === "entrepreneurial / freelance"),
        totalOfGraduatesEmployedLocally: count((r) => r.currentJobLocated === "locally"),
        totalOfGraduatesEmployedAbroad: count((r) => r.currentJobLocated === "abroad"),
      };
    })
    .sort((a, b) => Number(a.yearOfGraduation) - Number(b.yearOfGraduation) || a.program.localeCompare(b.program));
};

const details = () =>
  departments.map((d) => ({
    ...d,
    listOfProgram: programs
      .filter((p) => p.departmentId === d.id)
      .map((p) => ({ id: p.id, program: p.program, listOfMajor: majors.filter((m) => m.programId === p.id).map(({ id, major }) => ({ id, major })) })),
  }));

const text = (body: unknown, key: string) => {
  const value = (body as Record<string, unknown> | undefined)?.[key];
  return typeof value === "string" ? value.trim() : "";
};

/* ---------------------------------- routes ---------------------------------- */

export const mockRequest = async (method: string, path: string, body?: unknown): Promise<unknown> => {
  await wait(250 + rand() * 350);
  const parts = path.split("?")[0].split("/").filter(Boolean).map(decodeURIComponent);
  const [area, action, a, b, c] = parts;

  if (area === "auth") {
    if (action === "login") {
      if (text(body, "username") === "admin" && text(body, "password") === "preview") {
        sessionStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_SECONDS * 1000));
        return { message: "Signed in", expiresIn: SESSION_SECONDS };
      }
      return fail(401, "Invalid username or password");
    }
    if (action === "logout") {
      sessionStorage.removeItem(SESSION_KEY);
      return { message: "Signed out" };
    }
    if (action === "me") {
      requireAdmin();
      return { authenticated: true, expiresAt: Number(sessionStorage.getItem(SESSION_KEY)) };
    }
  }

  if (area === "department") {
    if (action === "list") return departments.map((d) => ({ ...d }));
    if (action === "program") return programs.filter((p) => p.departmentId === Number(a));
    requireAdmin();
    if (action === "add") {
      const name = text(body, "department").toUpperCase();
      if (!name) fail(400, "Please provide a department name");
      departments.push({ id: Math.max(0, ...departments.map((d) => d.id)) + 1, department: name });
      return { message: `Department ${name} has been added` };
    }
    if (action === "edit") {
      const found = departments.find((d) => d.id === Number(a)) ?? fail(404, "Department not found");
      found.department = text(body, "department").toUpperCase() || found.department;
      return { message: `The ${found.department} is successfully updated!` };
    }
    if (action === "remove") {
      const index = departments.findIndex((d) => d.id === Number(a));
      if (index < 0) fail(404, "Department not found");
      const [removed] = departments.splice(index, 1);
      return { message: `The ${removed.department} is successfully deleted!` };
    }
  }

  if (area === "program") {
    if (action === "list") return programs;
    requireAdmin();
    if (action === "add") {
      const name = text(body, "program");
      programs.push({ id: Math.max(0, ...programs.map((p) => p.id)) + 1, program: name, departmentId: Number(a) });
      return { message: `Program ${name} has been added` };
    }
    if (action === "edit") {
      const found = programs.find((p) => p.id === Number(a)) ?? fail(404, "Program not found");
      found.program = text(body, "program") || found.program;
      return { message: `The ${found.program} is successfully updated!` };
    }
    if (action === "remove") {
      const index = programs.findIndex((p) => p.id === Number(a));
      const [removed] = programs.splice(index, 1);
      return { message: `The ${removed.program} is successfully deleted!` };
    }
  }

  if (area === "major") {
    if (action === "list") return majors;
    if (action !== "add" && action !== "edit" && action !== "remove") return majors.filter((m) => m.programId === Number(action));
    requireAdmin();
    if (action === "add") {
      const name = text(body, "major");
      majors.push({ id: Math.max(0, ...majors.map((m) => m.id)) + 1, major: name, programId: Number(a) });
      return { message: `Major ${name} has been added` };
    }
    if (action === "edit") {
      const found = majors.find((m) => m.id === Number(a)) ?? fail(404, "Major not found");
      found.major = text(body, "major") || found.major;
      return { message: `The ${found.major} is successfully updated!` };
    }
    const index = majors.findIndex((m) => m.id === Number(a));
    const [removed] = majors.splice(index, 1);
    return { message: `The ${removed.major} is successfully deleted!` };
  }

  if (area === "user" && action === "add") {
    const input = body as Record<string, unknown>;
    const email = String(input.email ?? "").trim().toLowerCase();
    if (rows.some((r) => r.email === email)) fail(409, "This email is already traced! Thank you");
    const program = programs.find((p) => p.id === Number(input.programId)) ?? fail(404, "The program does not exist");
    const department = departments.find((d) => d.id === Number(input.departmentId)) ?? fail(404, "The department does not exist");
    const major = majors.find((m) => m.id === Number(input.majorId));
    rows.push({
      id: nextId++,
      email,
      fullName: String(input.fullName ?? "").trim(),
      yearOfGraduation: Number(input.yearOfGraduation),
      yearOfSurvey: Number(input.yearOfSurvey),
      department: department.department,
      program: program.program,
      major: major?.major ?? null,
      isEmployed: String(input.isEmployed).toLowerCase(),
      isJobAligned: String(input.isJobAligned).toLowerCase(),
      isSelfEmployed: String(input.isSelfEmployed).toLowerCase(),
      isFurtherStudies: String(input.isFurtherStudies).toLowerCase(),
      typeOfOrganization: String(input.typeOfOrganization).toLowerCase(),
      currentJobLocated: String(input.currentJobLocated).toLowerCase(),
    });
    return { message: `Thank you ${String(input.fullName)} for being part of this tracing!` };
  }

  if (area === "admin") {
    requireAdmin();
    if (action === "getAllData") return summary();
    if (action === "department" && a === "details") return details();
    if (action === "listOfPrograms") return programs.map(({ id, program }) => ({ id, program }));
    if (action === "graduates" && a === "total") {
      const year = Number(b);
      const list = totals.filter((t) => t.yearOfGraduation === year && t.program === c);
      if (method === "POST") {
        const input = body as { id: number; totalGraduates: number };
        const found = totals.find((t) => t.id === Number(input.id)) ?? fail(404, "Total graduates record not found");
        found.totalGraduates = Number(input.totalGraduates);
        return { message: `Successfully added total graduates: ${found.totalGraduates}` };
      }
      return list;
    }
    if (action === "graduates") return rows.filter((r) => r.yearOfGraduation === Number(a) && r.program === b);
    if (action === "student" && a === "response" && method === "DELETE") {
      const index = rows.findIndex((r) => r.id === Number(b));
      if (index < 0) fail(404, "Student does not exist");
      rows.splice(index, 1);
      return { message: "Successfully deleted student record" };
    }
  }

  return fail(404, "Route not found");
};

/* ------------------------------------ CSV ------------------------------------ */

const cell = (value: unknown) => {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const mockCsv = async (filters: { yearOfGraduation?: number | string; program?: string; department?: string }) => {
  await wait(300);
  requireAdmin();
  const columns = ["id", "fullName", "email", "yearOfGraduation", "yearOfSurvey", "department", "program", "major", "isEmployed", "isJobAligned", "isSelfEmployed", "isFurtherStudies", "typeOfOrganization", "currentJobLocated"] as const;
  const list = rows.filter(
    (r) =>
      (!filters.yearOfGraduation || r.yearOfGraduation === Number(filters.yearOfGraduation)) &&
      (!filters.program || r.program === filters.program) &&
      (!filters.department || r.department === filters.department),
  );
  const csv = [columns.join(","), ...list.map((r) => columns.map((k) => cell(r[k])).join(","))].join("\r\n");
  return new Blob([String.fromCharCode(0xfeff), csv, "\r\n"], { type: "text/csv;charset=utf-8" });
};
