import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertEnvironment, parseEnv } from "../lib/env.js";
import { answersAreConsistent } from "../utils/surveyValues.js";
import { toCsvCell } from "../utils/csv.js";
import { parseIdParam } from "../utils/validation.js";
import {
  isBcryptHash,
  normalizeUsername,
  toPasswordHash,
} from "../lib/adminAccounts.js";

describe("parseIdParam", () => {
  it.each([
    ["12", 12],
    ["1", 1],
    ["0", null],
    ["-3", null],
    ["1.5", null],
    ["abc", null],
    ["12abc", null],
    ["", null],
    [undefined, null],
    ["99999999999999999999", null],
  ])("parses %j as %j", (input, expected) => {
    expect(parseIdParam(input as string | undefined)).toBe(expected);
  });
});

describe("toCsvCell", () => {
  it("leaves plain values alone", () => {
    expect(toCsvCell("Juan")).toBe("Juan");
    expect(toCsvCell(2024)).toBe("2024");
    expect(toCsvCell(null)).toBe("");
    expect(toCsvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(toCsvCell("a,b")).toBe('"a,b"');
    expect(toCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(toCsvCell("a\nb")).toBe('"a\nb"');
  });

  it.each(["=1+1", "+1", "-1", "@SUM(A1)", "\tcmd"])(
    "defuses the formula %j",
    (input) => {
      expect(toCsvCell(input).replace(/^"/, "").startsWith("'")).toBe(true);
    },
  );
});

describe("assertEnvironment", () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it("accepts the test environment", () => {
    expect(() => assertEnvironment()).not.toThrow();
  });

  it("names the missing variables but never prints values", () => {
    delete process.env.JWT_SECRET;

    expect(() => assertEnvironment()).toThrow(/JWT_SECRET/);
    expect(() => assertEnvironment()).not.toThrow(/test-secret/);
  });

  it("does not require the admin credentials (admins live in the table)", () => {
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD_HASH;

    expect(() => assertEnvironment()).not.toThrow();
  });
});

describe("parseEnv", () => {
  const good = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://u:p@db.example.com:5432/app?sslmode=require",
    JWT_SECRET: "j".repeat(48),
    CLIENT_URL: "https://tracer.example.com",
    TRUST_PROXY: "2",
  } as NodeJS.ProcessEnv;

  it("accepts a correct production configuration", () => {
    const env = parseEnv(good);
    expect(env.CLIENT_URL).toEqual(["https://tracer.example.com"]);
    expect(env.TRUST_PROXY).toBe(2);
    expect(env.PORT).toBe(7000);
  });

  it("reads several allowed origins", () => {
    const env = parseEnv({ ...good, CLIENT_URL: "https://a.example.com, https://b.example.com" });
    expect(env.CLIENT_URL).toEqual(["https://a.example.com", "https://b.example.com"]);
  });

  it.each([
    ["a missing JWT_SECRET", { JWT_SECRET: undefined }, "JWT_SECRET"],
    ["a 31 character JWT_SECRET", { JWT_SECRET: "j".repeat(31) }, "JWT_SECRET"],
    ["a missing DATABASE_URL", { DATABASE_URL: undefined }, "DATABASE_URL"],
    ["a CLIENT_URL with a trailing slash", { CLIENT_URL: "https://tracer.example.com/" }, "CLIENT_URL"],
    ["http in production", { CLIENT_URL: "http://tracer.example.com" }, "CLIENT_URL"],
    ["production without TRUST_PROXY", { TRUST_PROXY: undefined }, "TRUST_PROXY"],
    ["a database over the internet without TLS", { DATABASE_URL: "postgresql://u:p@db.example.com:5432/app" }, "DATABASE_URL"],
    ["a NODE_ENV typo", { NODE_ENV: "prod" }, "NODE_ENV"],
  ])("refuses %s and names the variable", (_label, change, name) => {
    expect(() => parseEnv({ ...good, ...change } as NodeJS.ProcessEnv)).toThrow(name);
  });

  it("never prints a value in the error", () => {
    expect(() => parseEnv({ ...good, JWT_SECRET: "short-secret-value" })).not.toThrow(/short-secret-value/);
    try {
      parseEnv({ ...good, JWT_SECRET: "short-secret-value" });
    } catch (error) {
      expect((error as Error).message).not.toContain("short-secret-value");
    }
  });

  it("allows a private database host without TLS, and local development without a proxy", () => {
    expect(() => parseEnv({ ...good, DATABASE_URL: "postgresql://u:p@dpg-abc123-a/app" })).not.toThrow();
    expect(() =>
      parseEnv({
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://u:p@localhost:5432/app",
        JWT_SECRET: "j".repeat(40),
      } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});

describe("answersAreConsistent", () => {
  const employed = {
    isEmployed: "yes",
    isJobAligned: "no",
    isSelfEmployed: "no",
    isFurtherStudies: "yes",
    typeOfOrganization: "private institution",
    currentJobLocated: "abroad",
  };
  const unemployed = {
    isEmployed: "no",
    isJobAligned: "not applicable",
    isSelfEmployed: "yes",
    isFurtherStudies: "no",
    typeOfOrganization: "not applicable",
    currentJobLocated: "not applicable",
  };

  it("accepts what the form sends", () => {
    expect(answersAreConsistent(employed)).toBe(true);
    expect(answersAreConsistent({ ...employed, typeOfOrganization: "entrepreneurial / freelance" })).toBe(true);
    expect(answersAreConsistent(unemployed)).toBe(true);
  });

  it.each([
    ["an unknown yes/no value", { ...employed, isSelfEmployed: "maybe" }],
    ["an unknown organization", { ...employed, typeOfOrganization: "other" }],
    ["an unknown location", { ...employed, currentJobLocated: "mars" }],
    ["employed with not applicable", { ...employed, isJobAligned: "not applicable" }],
    ["unemployed with an organization", { ...unemployed, typeOfOrganization: "government" }],
    ["unemployed with yes/no", { ...unemployed, isJobAligned: "yes" }],
  ])("refuses %s", (_label, answers) => {
    expect(answersAreConsistent(answers)).toBe(false);
  });
});

describe("email templates", () => {
  const folder = path.resolve("utils/templates");
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = path.join(dir, name);
      return statSync(full).isDirectory() ? files(full) : [full];
    });

  // `{{{body}}}` in the layout is how express-handlebars inserts the email that was
  // already rendered (and escaped) from its own template. Any other triple-stash would
  // print a value, such as a graduate's name, without escaping it.
  it("never prints a value unescaped ({{{ ... }}}) except the layout's rendered body", () => {
    for (const file of files(folder)) {
      const unescaped = (readFileSync(file, "utf8").match(/\{\{\{[^}]*\}\}\}/g) ?? []).filter(
        (stash) => stash.replace(/\s/g, "") !== "{{{body}}}",
      );
      expect(unescaped, file).toEqual([]);
    }
  });
});

describe("admin account helpers", () => {
  it("recognizes a bcrypt hash", async () => {
    const hash = await toPasswordHash({ password: "a-strong-password" });
    expect(isBcryptHash(hash)).toBe(true);
    expect(isBcryptHash("plain-password")).toBe(false);
  });

  it.each([
    ["mis.admin", true],
    ["a_b-1", true],
    ["ab", false],
    ["has space", false],
    ["bad/char", false],
  ])("checks the username %j", (input, ok) => {
    if (ok) expect(normalizeUsername(input)).toBe(input);
    else expect(() => normalizeUsername(input)).toThrow();
  });

  it("hashes a plain password and passes a hash through", async () => {
    const hash = await toPasswordHash({ password: "a-strong-password" });
    expect(isBcryptHash(hash)).toBe(true);
    await expect(toPasswordHash({ password: "short" })).rejects.toThrow();
    expect(await toPasswordHash({ hash })).toBe(hash);
    await expect(toPasswordHash({ hash: "not-a-hash" })).rejects.toThrow();
  });
});
