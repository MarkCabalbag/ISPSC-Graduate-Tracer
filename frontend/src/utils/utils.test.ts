import { describe, expect, it } from "vitest";
import { displayYears } from "./utils";

describe("displayYears", () => {
  it("lists every year from start to end", () => {
    expect(displayYears(2020, 2023)).toEqual([2020, 2021, 2022, 2023]);
  });

  it("returns one year when start and end are equal", () => {
    expect(displayYears(2024, 2024)).toEqual([2024]);
  });
});
