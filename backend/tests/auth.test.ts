import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { TEST_ADMIN_PASSWORD, TEST_ADMIN_USERNAME } from "./setup.js";
import { CSRF, adminCookie } from "./helpers.js";

// The auth routes never touch the database, but the app imports the client.
vi.mock("../lib/prisma.js", () => ({ default: {} }));

const { default: app } = await import("../app.js");

const login = (body: unknown, headers: Record<string, string> = CSRF) =>
  request(app).post("/api/graduateTracer/auth/login").set(headers).send(body as object);

describe("POST /auth/login", () => {
  it("signs in with the right credentials and sets a hardened cookie", async () => {
    const res = await login({
      username: TEST_ADMIN_USERNAME,
      password: TEST_ADMIN_PASSWORD,
    });

    expect(res.status).toBe(200);
    const cookie = (res.headers["set-cookie"] as unknown as string[])[0];
    expect(cookie).toContain("gt_admin=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    // The token is never put in the response body.
    expect(JSON.stringify(res.body)).not.toContain("eyJ");
  });

  it("rejects a wrong password with a generic message", async () => {
    const res = await login({ username: TEST_ADMIN_USERNAME, password: "nope" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid username or password");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("gives the same answer for an unknown username", async () => {
    const res = await login({
      username: "someone-else",
      password: TEST_ADMIN_PASSWORD,
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid username or password");
  });

  it("rejects a missing or non-text password", async () => {
    expect((await login({ username: TEST_ADMIN_USERNAME })).status).toBe(400);
    expect(
      (await login({ username: TEST_ADMIN_USERNAME, password: { $ne: "" } }))
        .status,
    ).toBe(400);
  });

  it("requires the CSRF header", async () => {
    const res = await login(
      { username: TEST_ADMIN_USERNAME, password: TEST_ADMIN_PASSWORD },
      {},
    );

    expect(res.status).toBe(403);
  });
});

describe("GET /auth/me", () => {
  it("answers 401 without a session", async () => {
    const res = await request(app).get("/api/graduateTracer/auth/me");
    expect(res.status).toBe(401);
  });

  it("answers 200 for a valid admin session", async () => {
    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie());

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.headers["cache-control"]).toBe("no-store");
  });

  it("rejects a token without the admin role", async () => {
    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "graduate" }));

    expect(res.status).toBe(403);
  });

  it("rejects a token signed with another secret", async () => {
    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "admin" }, "x".repeat(40)));

    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "admin" }, undefined, -10));

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await request(app)
      .post("/api/graduateTracer/auth/logout")
      .set(CSRF);

    expect(res.status).toBe(200);
    expect((res.headers["set-cookie"] as unknown as string[])[0]).toContain(
      "gt_admin=;",
    );
  });
});

// Keep this test last: it uses up the login limiter for this IP address.
describe("login rate limit", () => {
  it("answers 429 after repeated failures", async () => {
    let last = 0;
    for (let attempt = 0; attempt < 10 && last !== 429; attempt += 1) {
      last = (await login({ username: "x", password: "y" })).status;
    }

    expect(last).toBe(429);
  });
});
