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
