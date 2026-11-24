import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import {
  TEST_ADMIN_PASSWORD,
  TEST_ADMIN_USERNAME,
  TEST_JWT_SECRET,
} from "./setup.js";
import { CSRF, TEST_ADMIN_ID, adminCookie } from "./helpers.js";

// Login reads the Admin table: one admin whose password is TEST_ADMIN_PASSWORD.
const TEST_ADMIN = {
  id: TEST_ADMIN_ID,
  username: TEST_ADMIN_USERNAME,
  passwordHash: bcrypt.hashSync(TEST_ADMIN_PASSWORD, 4),
  displayName: null,
  sessionVersion: 0,
};
const prismaMock = vi.hoisted(() => ({
  admin: { findUnique: vi.fn(), update: vi.fn().mockResolvedValue({}) },
}));
vi.mock("../lib/prisma.js", () => ({ default: prismaMock }));

const { default: app } = await import("../app.js");

const findAdmin = ({ where }: { where: { username?: string; id?: number } }) =>
  Promise.resolve(
    where.username === TEST_ADMIN.username || where.id === TEST_ADMIN.id
      ? TEST_ADMIN
      : null,
  );
prismaMock.admin.findUnique.mockImplementation(findAdmin);

const login = (
  body: unknown,
  headers: Record<string, string> = CSRF,
) =>
  request(app)
    .post("/api/graduateTracer/auth/login")
    .set(headers)
    .send(body as object);

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

  it("issues a token bound to the admin, with issuer, audience and session version", async () => {
    const res = await login({
      username: TEST_ADMIN_USERNAME,
      password: TEST_ADMIN_PASSWORD,
    });
    const cookie = (res.headers["set-cookie"] as unknown as string[])[0];
    const token = cookie.split(";")[0].replace("gt_admin=", "");
    const claims = jwt.verify(token, TEST_JWT_SECRET) as jwt.JwtPayload;

    expect(claims.sub).toBe(String(TEST_ADMIN_ID));
    expect(claims.sv).toBe(0);
    expect(claims.iss).toBe("ispsc-graduate-tracer");
    expect(claims.aud).toBe("ispsc-graduate-tracer-admin");
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
    expect(res.body.username).toBe(TEST_ADMIN_USERNAME);
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
      .set("Cookie", adminCookie({ role: "admin", sv: 0 }, "x".repeat(40)));

    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "admin", sv: 0 }, undefined, -10));

    expect(res.status).toBe(401);
  });

  it("rejects a token without the expected audience or issuer", async () => {
    const noAudience = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "admin", sv: 0 }, undefined, 60, { audience: false }));
    const otherIssuer = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "admin", sv: 0 }, undefined, 60, { issuer: "someone-else" }));

    expect(noAudience.status).toBe(401);
    expect(otherIssuer.status).toBe(401);
  });
});

describe("revoking a session", () => {
  it("ends the session when the admin's session version was raised", async () => {
    prismaMock.admin.findUnique.mockImplementationOnce(() =>
      Promise.resolve({ username: TEST_ADMIN_USERNAME, sessionVersion: 1 }),
    );

    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "admin", sv: 0 }));

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid or expired session");
  });

  it("ends the session when the admin was deleted", async () => {
    prismaMock.admin.findUnique.mockImplementationOnce(() => Promise.resolve(null));

    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie());

    expect(res.status).toBe(401);
  });

  it("rejects an old token that has no session version", async () => {
    const res = await request(app)
      .get("/api/graduateTracer/auth/me")
      .set("Cookie", adminCookie({ role: "admin" }));

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

// These tests use up the login limiters. Keep them last.
describe("login rate limits", () => {
  it("limits failures per username even when the IP address changes", async () => {
    let last = 0;
    let attempts = 0;
    for (; attempts < 15 && last !== 429; attempts += 1) {
      // Behind two proxies the client IP is the first X-Forwarded-For entry.
      last = (
        await login(
          { username: "target-user", password: "wrong" },
          { ...CSRF, "X-Forwarded-For": `10.0.0.${attempts + 1}, 9.9.9.9` },
        )
      ).status;
    }

    expect(last).toBe(429);
    expect(attempts).toBe(11); // 10 failures allowed, the 11th is refused
  });

  it("answers 429 after repeated failures from one IP address", async () => {
    let last = 0;
    for (let attempt = 0; attempt < 10 && last !== 429; attempt += 1) {
      last = (
        await login(
          { username: `user-${attempt}`, password: "y" },
          { ...CSRF, "X-Forwarded-For": "203.0.113.7, 9.9.9.9" },
        )
      ).status;
    }

    expect(last).toBe(429);
  });
});
