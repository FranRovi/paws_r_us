export const MAX_ACTIVE_APPLICATIONS = 3;

// Statuses that use up one of the user's slots.
export const ACTIVE_STATUSES = ["pending", "in_review", "accepted"];

export function isActive(application) {
  return ACTIVE_STATUSES.includes(application.status);
}

export function activeCount(applications) {
  return applications.filter(isActive).length;
}

// Why the user cannot apply to this pet right now:
// 'already' = they already have an active application for it
// 'limit'   = they are using all their slots
// null      = they can apply
export function applyBlockReason(applications, petId) {
  const alreadyApplied = applications.some(
    (application) => application.pet_id === petId && isActive(application),
  );
  if (alreadyApplied) return "already";
  if (activeCount(applications) >= MAX_ACTIVE_APPLICATIONS) return "limit";
  return null;
}

export function canApply(applications, petId) {
  return applyBlockReason(applications, petId) === null;
}

// Position (1 = first in line) of an application in a pet's waiting list.
// `petApplications` are all applications for ONE pet, from any users.
// Only active applications are in the line, oldest first.
// Returns null when the application is not in the line.
export function waitingPosition(petApplications, applicationId) {
  const line = petApplications
    .filter(isActive)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const index = line.findIndex(
    (application) => application.id === applicationId,
  );
  return index === -1 ? null : index + 1;
}

// How many of the user's 3 slots are free.
export function openSlots(applications) {
  return Math.max(0, MAX_ACTIVE_APPLICATIONS - activeCount(applications));
}

export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function statusLabel(status) {
  const labels = {
    pending: "Under review",
    in_review: "Meet and greet next",
    accepted: "Adoption approved",
    rejected: "Declined by the shelter",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
}

// Which of the 4 steps (0 to 3) is the current one; 4 means all are done.
const CURRENT_STEP = { pending: 0, in_review: 1, accepted: 4 };

// The 4-step progress of an application:
// Applied, Meet and greet, Home visit, Decision.
// Each step is 'done', 'now' or 'todo', with a short detail line.
export function applicationSteps(application) {
  const current = CURRENT_STEP[application.status] ?? 0;
  const sent = `Sent ${formatShortDate(application.created_at)}`;

  const steps = [
    {
      key: "applied",
      label: "Applied",
      detail: {
        done: sent,
        now: `${sent}, waiting for the shelter`,
        todo: sent,
      },
    },
    {
      key: "meet",
      label: "Meet and greet",
      detail: {
        done: "Completed",
        now: "Schedule it with the shelter",
        todo: "Opens once the shelter accepts",
      },
    },
    {
      key: "home",
      label: "Home visit",
      detail: {
        done: "Completed",
        now: "Schedule it with the shelter",
        todo: "Scheduled after the meet and greet",
      },
    },
    {
      key: "decision",
      label: "Decision",
      detail: {
        done: "The shelter approved your adoption",
        now: "Waiting for the shelter",
        todo: "The shelter confirms or declines",
      },
    },
  ];

  return steps.map((step, index) => {
    const state = index < current ? "done" : index === current ? "now" : "todo";
    return {
      key: step.key,
      label: step.label,
      state,
      detail: step.detail[state],
    };
  });
}

export function activeApplicationFor(applications, petId) {
  return applications.find(
    (application) => application.pet_id === petId && isActive(application),
  );
}
