import { describe, it, expect } from "vitest";
import { friendlyApplicationError } from "./applicationErrors";

describe("friendlyApplicationError", () => {
  it("explains the 3-application limit", () => {
    expect(
      friendlyApplicationError({ message: "application_limit_reached" }),
    ).toMatch(/3 active applications/);
  });

  it("explains a duplicate application", () => {
    expect(
      friendlyApplicationError({ code: "23505", message: "duplicate key" }),
    ).toMatch(/already have an active application for this pet/);
  });

  it("falls back to a generic message", () => {
    expect(friendlyApplicationError({ message: "boom" })).toMatch(/try again/);
    expect(friendlyApplicationError(null)).toMatch(/try again/);
  });
});
