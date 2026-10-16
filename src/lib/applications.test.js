import { describe, it, expect } from "vitest";
import {
  activeCount,
  applyBlockReason,
  canApply,
  waitingPosition,
} from "./applications";

let nextId = 0;
function app(
  status,
  petId = `pet-${nextId}`,
  createdAt = "2026-10-01T10:00:00Z",
) {
  nextId += 1;
  return { id: `a${nextId}`, pet_id: petId, status, created_at: createdAt };
}

describe("activeCount", () => {
  it("counts 0, 1, 2 and 3 active applications", () => {
    expect(activeCount([])).toBe(0);
    expect(activeCount([app("pending")])).toBe(1);
    expect(activeCount([app("pending"), app("in_review")])).toBe(2);
    expect(
      activeCount([app("pending"), app("in_review"), app("accepted")]),
    ).toBe(3);
  });

  it("does not count cancelled or rejected applications", () => {
    expect(
      activeCount([app("cancelled"), app("rejected"), app("pending")]),
    ).toBe(1);
  });
});

describe("canApply", () => {
  it("allows applying with 0, 1 or 2 active applications", () => {
    expect(canApply([], "max")).toBe(true);
    expect(canApply([app("pending")], "max")).toBe(true);
    expect(canApply([app("pending"), app("in_review")], "max")).toBe(true);
  });

  it("blocks a 4th active application", () => {
    const three = [app("pending"), app("in_review"), app("accepted")];
    expect(canApply(three, "max")).toBe(false);
    expect(applyBlockReason(three, "max")).toBe("limit");
  });

  it("frees a slot when an application is cancelled or rejected", () => {
    expect(
      canApply([app("pending"), app("pending"), app("cancelled")], "max"),
    ).toBe(true);
    expect(
      canApply([app("pending"), app("pending"), app("rejected")], "max"),
    ).toBe(true);
  });

  it("blocks a second active application for the same pet", () => {
    const list = [app("pending", "max")];
    expect(canApply(list, "max")).toBe(false);
    expect(applyBlockReason(list, "max")).toBe("already");
  });

  it("allows applying again to a pet after cancelling", () => {
    expect(canApply([app("cancelled", "max")], "max")).toBe(true);
  });

  it('reports "already" before "limit" when both are true', () => {
    const three = [app("pending", "max"), app("pending"), app("pending")];
    expect(applyBlockReason(three, "max")).toBe("already");
  });

  it("reports no reason when the user can apply", () => {
    expect(applyBlockReason([app("pending")], "max")).toBeNull();
  });
});

describe("waitingPosition", () => {
  it("orders the line by when each application was made", () => {
    const first = app("pending", "max", "2026-10-01T10:00:00Z");
    const second = app("pending", "max", "2026-10-02T10:00:00Z");
    const third = app("in_review", "max", "2026-10-03T10:00:00Z");
    const list = [third, first, second];

    expect(waitingPosition(list, first.id)).toBe(1);
    expect(waitingPosition(list, second.id)).toBe(2);
    expect(waitingPosition(list, third.id)).toBe(3);
  });

  it("skips cancelled and rejected applications", () => {
    const gone = app("cancelled", "max", "2026-10-01T10:00:00Z");
    const mine = app("pending", "max", "2026-10-02T10:00:00Z");
    expect(waitingPosition([gone, mine], mine.id)).toBe(1);
  });

  it("returns null when the application is not in the line", () => {
    const cancelled = app("cancelled", "max");
    expect(waitingPosition([cancelled], cancelled.id)).toBeNull();
    expect(waitingPosition([], "missing")).toBeNull();
  });

  it("does not change the list it receives", () => {
    const a = app("pending", "max", "2026-10-02T10:00:00Z");
    const b = app("pending", "max", "2026-10-01T10:00:00Z");
    const list = [a, b];
    waitingPosition(list, a.id);
    expect(list).toEqual([a, b]);
  });
});
