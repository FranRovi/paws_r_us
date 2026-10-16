import { describe, expect, it } from "vitest";
import { applicationSteps } from "./applications";
import { applicationStepsWithVisits, applicationProgressLabel } from "./visitSteps";

const application = (status) => ({
  id: "a1",
  pet_id: "p1",
  status,
  created_at: "2026-10-01T10:00:00Z",
});

const visit = (kind, status, day = 20, hour = 10, minute = 30) => ({
  id: `${kind}-${status}`,
  kind,
  status,
  starts_at: new Date(2026, 9, day, hour, minute).toISOString(),
});

const states = (steps) => steps.map((s) => s.state);

describe("applicationStepsWithVisits", () => {
  it("relies on the step shape used by the stepper (state and detail)", () => {
    const steps = applicationSteps(application("in_review"));
    expect(steps).toHaveLength(4);
    expect(steps[1]).toHaveProperty("state");
    expect(steps[1]).toHaveProperty("detail");
  });

  it("leaves a pending application untouched", () => {
    const pending = application("pending");
    expect(applicationStepsWithVisits(pending, [])).toEqual(
      applicationSteps(pending),
    );
  });

  it("keeps the original text while no meet and greet is booked", () => {
    const inReview = application("in_review");
    const steps = applicationStepsWithVisits(inReview, []);
    expect(steps[1].state).toBe("now");
    expect(steps[1].detail).toBe(applicationSteps(inReview)[1].detail);
    expect(steps[2].state).toBe("todo");
  });

  it("shows when and where the meet and greet is booked", () => {
    const steps = applicationStepsWithVisits(
      application("in_review"),
      [visit("meet", "scheduled")],
      "Heart Shelter",
    );
    expect(steps[1].state).toBe("now");
    expect(steps[1].detail).toBe("Oct 20, 10:30 AM at Heart Shelter");
    expect(steps[2].state).toBe("todo");
  });

  it("ignores cancelled visits", () => {
    const inReview = application("in_review");
    const steps = applicationStepsWithVisits(inReview, [
      visit("meet", "cancelled"),
    ]);
    expect(steps[1].detail).toBe(applicationSteps(inReview)[1].detail);
  });

  it("moves on to the home visit once the meet and greet is completed", () => {
    const steps = applicationStepsWithVisits(application("in_review"), [
      visit("meet", "completed"),
    ]);
    expect(steps[1].state).toBe("done");
    expect(steps[1].detail).toBe("Completed Oct 20");
    expect(steps[2].state).toBe("now");
    expect(steps[2].detail).toBe("Schedule your home visit");
  });

  it("shows the booked home visit", () => {
    const steps = applicationStepsWithVisits(
      application("in_review"),
      [visit("meet", "completed"), visit("home", "scheduled", 25, 14, 0)],
      "Heart Shelter",
    );
    expect(steps[2].state).toBe("now");
    expect(steps[2].detail).toBe("Oct 25, 2:00 PM at Heart Shelter");
  });

  it("waits for the decision once both visits are completed", () => {
    const steps = applicationStepsWithVisits(application("in_review"), [
      visit("meet", "completed"),
      visit("home", "completed", 25),
    ]);
    expect(states(steps).slice(1)).toEqual(["done", "done", "now"]);
    expect(steps[3].detail).toBe("Waiting for the shelter to decide");
  });

  it("keeps an approved application fully done and shows the visit dates", () => {
    const accepted = application("accepted");
    const steps = applicationStepsWithVisits(accepted, [
      visit("meet", "completed"),
    ]);
    expect(states(steps)).toEqual(states(applicationSteps(accepted)));
    expect(steps[1].detail).toBe("Completed Oct 20");
  });
});

describe("applicationProgressLabel", () => {
  const inReview = application("in_review");

  it("follows the visits of an application in review", () => {
    expect(applicationProgressLabel(inReview, [])).toBe("Meet and greet next");
    expect(
      applicationProgressLabel(inReview, [visit("meet", "scheduled")]),
    ).toBe("Meet and greet scheduled");
    expect(
      applicationProgressLabel(inReview, [visit("meet", "completed")]),
    ).toBe("Home visit next");
    expect(
      applicationProgressLabel(inReview, [
        visit("meet", "completed"),
        visit("home", "scheduled"),
      ]),
    ).toBe("Home visit scheduled");
    expect(
      applicationProgressLabel(inReview, [
        visit("meet", "completed"),
        visit("home", "completed"),
      ]),
    ).toBe("Waiting for the decision");
  });

  it("ignores cancelled visits", () => {
    expect(
      applicationProgressLabel(inReview, [visit("meet", "cancelled")]),
    ).toBe("Meet and greet next");
  });

  it("keeps the normal label for the other statuses", () => {
    expect(applicationProgressLabel(application("pending"), [])).toBe(
      "Under review",
    );
    expect(applicationProgressLabel(application("accepted"), [])).toBe(
      "Adoption approved",
    );
  });
});