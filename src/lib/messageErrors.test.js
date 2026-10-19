import { describe, expect, it } from "vitest";
import { friendlyMessageError } from "./messageErrors";

describe("friendlyMessageError", () => {
  it("explains a missing conversation", () => {
    expect(friendlyMessageError({ message: "conversation_not_found" })).toBe(
      "We could not find that conversation.",
    );
  });

  it("explains a missing pet", () => {
    expect(friendlyMessageError({ message: "pet_not_found" })).toBe(
      "We could not find that pet.",
    );
  });

  it("explains that the demo shelter is off", () => {
    expect(friendlyMessageError({ message: "demo_tools_disabled" })).toBe(
      "The demo shelter is turned off.",
    );
  });

  it("explains a permission error", () => {
    expect(friendlyMessageError({ code: "42501", message: "denied" })).toBe(
      "You cannot send that message.",
    );
  });

  it("falls back to a general message", () => {
    expect(friendlyMessageError({ message: "boom" })).toBe(
      "We could not send your message. Please try again.",
    );
    expect(friendlyMessageError(null)).toBe(
      "We could not send your message. Please try again.",
    );
  });
});