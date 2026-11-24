import request from "supertest";
import { Prisma } from "../src/generated/prisma/client.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  responses: { findFirst: vi.fn(), create: vi.fn() },
  department: { findUnique: vi.fn() },
  program: { findUnique: vi.fn() },
  major: { findUnique: vi.fn() },
  total: { upsert: vi.fn() },
}));
vi.mock("../lib/prisma.js", () => ({ default: prismaMock }));

const sendEmail = vi.hoisted(() => vi.fn());
vi.mock("../utils/sendGraduateTracerEmail.js", () => ({
  sendGraduateTracerEmail: sendEmail,
}));

const { default: app } = await import("../app.js");

const URL = "/api/graduateTracer/user/add/response";
const THIS_YEAR = new Date().getFullYear();

const validBody = {
  yearOfSurvey: THIS_YEAR,
  email: "Juan@Example.com ",
  fullName: "Juan Dela Cruz",
  yearOfGraduation: THIS_YEAR - 2,
  departmentId: 1,
  programId: 2,
  isEmployed: "Yes",
  isJobAligned: "yes",
  isSelfEmployed: "no",
  isFurtherStudies: "no",
  typeOfOrganization: "government",
  currentJobLocated: "locally",
};

// What the form sends for a graduate who is not employed.
const notEmployed = {
  isEmployed: "no",
  isJobAligned: "not applicable",
  typeOfOrganization: "not applicable",
  currentJobLocated: "not applicable",
};

beforeEach(() => {
  vi.clearAllMocks();
  sendEmail.mockResolvedValue({ success: true, message: "sent" });
  prismaMock.responses.findFirst.mockResolvedValue(null);
  prismaMock.department.findUnique.mockResolvedValue({
    id: 1,
    department: "COLLEGE OF ENGINEERING",
  });
  prismaMock.program.findUnique.mockResolvedValue({
    id: 2,
    program: "BSIT",
    departmentId: 1,
  });
  prismaMock.major.findUnique.mockResolvedValue({ id: 3, major: "Networks", programId: 2 });
  prismaMock.responses.create.mockResolvedValue({ fullName: "Juan Dela Cruz" });
  prismaMock.total.upsert.mockResolvedValue({ id: 1 });
});

describe("POST /user/add/response", () => {
  it("saves a valid response with a normalized email and answers", async () => {
    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(201);
    const data = prismaMock.responses.create.mock.calls[0][0].data;
    expect(data.email).toBe("juan@example.com");
    expect(data.isEmployed).toBe("yes");
    expect(data.program).toBe("BSIT");
  });

  it("saves an employed graduate with a major", async () => {
    const res = await request(app).post(URL).send({ ...validBody, majorId: 3 });

    expect(res.status).toBe(201);
    expect(prismaMock.responses.create.mock.calls[0][0].data.major).toBe("Networks");
  });

  it("saves a graduate who is not employed, as the form sends it", async () => {
    const res = await request(app).post(URL).send({ ...validBody, ...notEmployed });

    expect(res.status).toBe(201);
    expect(prismaMock.responses.create.mock.calls[0][0].data.currentJobLocated).toBe(
      "not applicable",
    );
  });

  it.each([
    ["a missing name", { fullName: undefined }],
    ["an invalid email", { email: "not-an-email" }],
    ["a text year", { yearOfGraduation: "abcd" }],
    ["an out-of-range survey year", { yearOfSurvey: 1800 }],
    ["a graduation year in the future", { yearOfGraduation: THIS_YEAR + 1 }],
    ["a survey year far in the past", { yearOfSurvey: THIS_YEAR - 5 }],
    ["an over-long name", { fullName: "x".repeat(500) }],
    ["an object where text is expected", { isEmployed: { $gt: "" } }],
    ["a negative id", { departmentId: -1 }],
  ])("rejects %s with 400", async (_label, change) => {
    const res = await request(app)
      .post(URL)
      .send({ ...validBody, ...change });

    expect(res.status).toBe(400);
    expect(prismaMock.responses.create).not.toHaveBeenCalled();
  });

  it.each([
    ["an answer the form never sends", { isSelfEmployed: "maybe" }],
    ["an unknown organization type", { typeOfOrganization: "a pirate ship" }],
    ["an unknown job location", { currentJobLocated: "the moon" }],
    ["an employed graduate with a job question not answered", { isJobAligned: "not applicable" }],
    ["a graduate who is not employed but names an organization", { ...notEmployed, typeOfOrganization: "government" }],
    ["a graduate who is not employed with yes/no job answers", { isEmployed: "no" }],
  ])("rejects %s with 400", async (_label, change) => {
    const res = await request(app)
      .post(URL)
      .send({ ...validBody, ...change });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Please fill all fields");
    expect(prismaMock.responses.create).not.toHaveBeenCalled();
  });

  it("rejects a program that belongs to another department", async () => {
    prismaMock.program.findUnique.mockResolvedValue({ id: 2, program: "BSIT", departmentId: 99 });

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("The program does not belong to the selected department");
    expect(prismaMock.responses.create).not.toHaveBeenCalled();
  });

  it("rejects a major that belongs to another program", async () => {
    prismaMock.major.findUnique.mockResolvedValue({ id: 3, major: "Networks", programId: 77 });

    const res = await request(app).post(URL).send({ ...validBody, majorId: 3 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("The major does not belong to the selected program");
  });

  it("answers 409 when the email is already traced", async () => {
    prismaMock.responses.findFirst.mockResolvedValue({ id: 9 });

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(409);
    expect(prismaMock.responses.create).not.toHaveBeenCalled();
  });

  it("answers 409 with the same message when two submissions arrive at once", async () => {
    prismaMock.responses.findFirst.mockResolvedValue({ id: 9 });
    const precheck = await request(app).post(URL).send(validBody);

    prismaMock.responses.findFirst.mockResolvedValue(null);
    prismaMock.responses.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    const race = await request(app).post(URL).send(validBody);

    expect(race.status).toBe(409);
    expect(race.body.message).toBe(precheck.body.message);
  });

  it("creates the graduate total with one upsert on year + program", async () => {
    await request(app).post(URL).send(validBody);

    expect(prismaMock.total.upsert).toHaveBeenCalledWith({
      where: { year_program: { yearOfGraduation: THIS_YEAR - 2, program: "BSIT" } },
      update: {},
      create: { yearOfGraduation: THIS_YEAR - 2, program: "BSIT", department: "COLLEGE OF ENGINEERING" },
    });
  });

  it("answers 404 for a department that does not exist", async () => {
    prismaMock.department.findUnique.mockResolvedValue(null);

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(404);
  });

  it("answers 400 for a body that is not valid JSON", async () => {
    const res = await request(app)
      .post(URL)
      .set("Content-Type", "application/json")
      .send("{not json");

    expect(res.status).toBe(400);
  });

  it("never leaks error details or stack traces", async () => {
    prismaMock.responses.create.mockRejectedValue(
      new Error("connection to db.internal:5432 refused, password=hunter2"),
    );

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2|db\.internal|at /);
  });
});

describe("confirmation email", () => {
  it("answers 201 at once even when the mail server hangs", async () => {
    sendEmail.mockReturnValue(new Promise(() => undefined)); // never settles

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(201);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0]).toBe("juan@example.com");
  });

  it("still answers 201 when the email fails", async () => {
    sendEmail.mockResolvedValue({ success: false, message: "Failed to send email." });

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(201);
  });
});

describe("security headers", () => {
  it("sends helmet headers and hides the framework", async () => {
    const res = await request(app).get("/api/graduateTracer/nope");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("only allows the configured CORS origin", async () => {
    const allowed = await request(app)
      .get("/api/graduateTracer/nope")
      .set("Origin", "http://localhost:5173");
    const denied = await request(app)
      .get("/api/graduateTracer/nope")
      .set("Origin", "https://evil.example");

    expect(allowed.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
