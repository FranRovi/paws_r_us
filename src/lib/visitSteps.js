import { applicationSteps, statusLabel } from "./applications";
import { formatVisitDate, liveVisit, visitSummary } from "./scheduling";

// The same steps as applicationSteps(), but the Meet and greet, Home visit and
// Decision steps follow the real visits of this application.
export function applicationStepsWithVisits(application, visits = [], shelterName = "") {
  const steps = applicationSteps(application);
  const open =
    application.status === "in_review" || application.status === "accepted";
  if (!open) return steps;

  const meet = liveVisit(visits, "meet");
  const home = liveVisit(visits, "home");

  const detailFor = (visit, fallback) => {
    if (!visit) return fallback;
    if (visit.status === "completed") {
      return `Completed ${formatVisitDate(visit.starts_at)}`;
    }
    return visitSummary(visit, shelterName);
  };

  // Approved: every step stays done, but show the dates of the visits that happened.
  if (application.status === "accepted") {
    return steps.map((step, index) => {
      if (index === 1) return { ...step, detail: detailFor(meet, step.detail) };
      if (index === 2) return { ...step, detail: detailFor(home, step.detail) };
      return step;
    });
  }

  const meetDone = meet?.status === "completed";
  const homeDone = home?.status === "completed";

  return steps.map((step, index) => {
    if (index === 1) {
      return {
        ...step,
        state: meetDone ? "done" : "now",
        detail: detailFor(meet, step.detail),
      };
    }
    if (index === 2) {
      if (!meetDone) return { ...step, state: "todo" };
      return {
        ...step,
        state: homeDone ? "done" : "now",
        detail: detailFor(home, "Schedule your home visit"),
      };
    }
    if (index === 3 && homeDone) {
      return {
        ...step,
        state: "now",
        detail: "Waiting for the shelter to decide",
      };
    }
    return step;
  });
}

export function applicationProgressLabel(application, visits = []) {
  if (application.status !== "in_review") {
    return statusLabel(application.status);
  }
  const meet = liveVisit(visits, "meet");
  const home = liveVisit(visits, "home");

  if (home?.status === "completed") return "Waiting for the decision";
  if (home?.status === "scheduled") return "Home visit scheduled";
  if (meet?.status === "completed") return "Home visit next";
  if (meet?.status === "scheduled") return "Meet and greet scheduled";
  return statusLabel(application.status);
}