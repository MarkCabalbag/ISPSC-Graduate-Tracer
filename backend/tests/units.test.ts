import { afterEach, describe, expect, it } from "vitest";
import { assertEnvironment } from "../lib/env.js";
import { toCsvCell } from "../utils/csv.js";
import { parseIdParam } from "../utils/validation.js";

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

  it("rejects a plain-text admin password", () => {
    process.env.ADMIN_PASSWORD_HASH = "my-plain-password";

    expect(() => assertEnvironment()).toThrow(/bcrypt/);
  });
});
