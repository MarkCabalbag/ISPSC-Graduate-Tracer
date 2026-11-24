import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { CSRF, adminCookie } from "./helpers.js";

const prismaMock = vi.hoisted(() => ({
  responses: {
    groupBy: vi.fn().mockResolvedValue([]),
    findMany: vi.fn().mockResolvedValue([]),
  },
  // requireAdmin checks the session against the admin's row.
  admin: {
    findUnique: vi
      .fn()
      .mockResolvedValue({ username: "test-admin", sessionVersion: 0 }),
  },
  $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
}));
vi.mock("../lib/prisma.js", () => ({ default: prismaMock }));

const { default: app } = await import("../app.js");

const BASE = "/api/graduateTracer";

const ADMIN_GET_ROUTES = [
  "/admin/getAllData",
  "/admin/overviewStudents",
  "/admin/listOfPrograms",
  "/admin/graduates/2024/BSIT",
  "/admin/graduates/total/2024/BSIT",
  "/admin/employmentStatistics/2024/BSIT",
  "/admin/questions/2024/BSIT",
  "/admin/percentage/2024/BSIT",
  "/admin/organization/2024/BSIT",
  "/admin/jobLocation/2024/BSIT",
  "/admin/department/details",
  "/admin/analytics",
  "/admin/responses/export",
];

const ADMIN_WRITE_ROUTES: [string, string][] = [
  ["delete", "/admin/student/response/1"],
  ["post", "/admin/graduates/total/2024/BSIT"],
  ["post", "/department/add"],
  ["post", "/department/edit/1"],
  ["post", "/department/remove/1"],
  ["post", "/program/add/1"],
  ["post", "/program/edit/1"],
  ["post", "/program/remove/1"],
  ["post", "/major/add/1"],
  ["post", "/major/edit/1"],
  ["post", "/major/remove/1"],
];

describe("admin routes without a session", () => {
  it.each(ADMIN_GET_ROUTES)("GET %s answers 401", async (path) => {
    const res = await request(app).get(BASE + path);
    expect(res.status).toBe(401);
    expect(res.headers["cache-control"] ?? "").not.toBe("public");
  });

  it.each(ADMIN_WRITE_ROUTES)("%s %s answers 401", async (method, path) => {
    const res = await (request(app) as unknown as Record<
      string,
      (url: string) => request.Test
    >)[method](BASE + path).set(CSRF);
    expect(res.status).toBe(401);
  });
});

describe("admin routes with a session", () => {
  it("rejects a write without the CSRF header", async () => {
    const res = await request(app)
      .post(`${BASE}/department/add`)
      .set("Cookie", adminCookie())
      .send({ department: "Engineering" });

    expect(res.status).toBe(403);
  });

  it("returns analytics counted by the database", async () => {
    const res = await request(app)
      .get(`${BASE}/admin/analytics`)
      .set("Cookie", adminCookie());

    expect(res.status).toBe(200);
    expect(res.body.totals.traced).toBe(0);
    expect(res.body.totals.employmentRate).toBeNull();
  });
});

describe("CSV export", () => {
  it("neutralizes spreadsheet formulas typed by graduates", async () => {
    prismaMock.responses.findMany.mockResolvedValueOnce([
      { id: 1, fullName: '=HYPERLINK("http://evil")', email: "a@b.co" },
    ]);

    const res = await request(app)
      .get(`${BASE}/admin/responses/export`)
      .set("Cookie", adminCookie());

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });

  it("rejects an invalid year filter", async () => {
    const res = await request(app)
      .get(`${BASE}/admin/responses/export?yearOfGraduation=abc`)
      .set("Cookie", adminCookie());

    expect(res.status).toBe(400);
  });
});

describe("unknown routes", () => {
  it("answers 404 as JSON", async () => {
    const res = await request(app).get(`${BASE}/nope`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Route not found");
  });
});

describe("health endpoints", () => {
  it("answers ok without touching the database", async () => {
    prismaMock.$queryRaw.mockClear();
    const res = await request(app).get(`${BASE}/health`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it("answers ready when the database answers", async () => {
    const res = await request(app).get(`${BASE}/health/ready`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ready" });
  });

  it("answers 503 without details when the database is down", async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error("connect ECONNREFUSED db.internal"));
    const res = await request(app).get(`${BASE}/health/ready`);

    expect(res.status).toBe(503);
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|db\.internal/);
  });
});

describe("request handling", () => {
  it("sends a request id with every response", async () => {
    const res = await request(app).get(`${BASE}/nope`);
    expect(res.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("keeps a plain request id from a proxy and replaces an unsafe one", async () => {
    const kept = await request(app).get(`${BASE}/nope`).set("X-Request-Id", "abc12345-trace");
    // Too short, and with spaces/quotes a log reader could mistake for another field.
    const tooShort = await request(app).get(`${BASE}/nope`).set("X-Request-Id", "abc");
    const unsafe = await request(app).get(`${BASE}/nope`).set("X-Request-Id", 'fake id "level":"fatal"');

    expect(kept.headers["x-request-id"]).toBe("abc12345-trace");
    expect(tooShort.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    expect(unsafe.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("answers 413 for a body over 100 KB and 400 for broken JSON", async () => {
    const big = await request(app)
      .post(`${BASE}/user/add/response`)
      .send({ fullName: "x".repeat(110 * 1024) });
    const broken = await request(app)
      .post(`${BASE}/user/add/response`)
      .set("Content-Type", "application/json")
      .send("{nope");

    expect(big.status).toBe(413);
    expect(big.body.message).toBe("The request body is too large");
    expect(broken.status).toBe(400);
  });

  it("sends a CSP that allows nothing, and caches the preflight for 10 minutes", async () => {
    const res = await request(app).get(`${BASE}/nope`);
    expect(res.headers["content-security-policy"]).toContain("default-src 'none'");
    expect(res.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");

    const preflight = await request(app)
      .options(`${BASE}/department/list`)
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    expect(preflight.headers["access-control-max-age"]).toBe("600");
  });
});
