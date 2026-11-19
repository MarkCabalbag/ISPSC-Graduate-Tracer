import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  responses: { findFirst: vi.fn(), create: vi.fn() },
  department: { findUnique: vi.fn() },
  program: { findUnique: vi.fn() },
  major: { findUnique: vi.fn() },
  total: { findFirst: vi.fn(), create: vi.fn() },
}));
vi.mock("../lib/prisma.js", () => ({ default: prismaMock }));
vi.mock("../utils/sendGraduateTracerEmail.js", () => ({
  sendGraduateTracerEmail: vi
    .fn()
    .mockResolvedValue({ success: true, message: "sent" }),
}));

const { default: app } = await import("../app.js");

const URL = "/api/graduateTracer/user/add/response";

const validBody = {
  yearOfSurvey: 2025,
  email: "Juan@Example.com ",
  fullName: "Juan Dela Cruz",
  yearOfGraduation: 2023,
  departmentId: 1,
  programId: 2,
  isEmployed: "Yes",
  isJobAligned: "yes",
  isSelfEmployed: "no",
  isFurtherStudies: "no",
  typeOfOrganization: "government",
  currentJobLocated: "locally",
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.responses.findFirst.mockResolvedValue(null);
  prismaMock.department.findUnique.mockResolvedValue({
    id: 1,
    department: "COLLEGE OF ENGINEERING",
  });
  prismaMock.program.findUnique.mockResolvedValue({ id: 2, program: "BSIT" });
  prismaMock.responses.create.mockResolvedValue({ fullName: "Juan Dela Cruz" });
  prismaMock.total.findFirst.mockResolvedValue({ id: 1 });
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

  it.each([
    ["a missing name", { fullName: undefined }],
    ["an invalid email", { email: "not-an-email" }],
    ["a text year", { yearOfGraduation: "abcd" }],
    ["an out-of-range year", { yearOfSurvey: 1800 }],
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

  it("answers 409 when the email is already traced", async () => {
    prismaMock.responses.findFirst.mockResolvedValue({ id: 9 });

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(409);
    expect(prismaMock.responses.create).not.toHaveBeenCalled();
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
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    prismaMock.responses.create.mockRejectedValue(
      new Error("connection to db.internal:5432 refused, password=hunter2"),
    );

    const res = await request(app).post(URL).send(validBody);

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/hunter2|db\.internal|at /);
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
