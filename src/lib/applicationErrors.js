export function friendlyApplicationError(error) {
  const message = error?.message ?? "";

  if (message.includes("application_limit_reached")) {
    return "You already have 3 active applications. Cancel one to apply for another pet.";
  }
  if (error?.code === "23505") {
    return "You already have an active application for this pet.";
  }
  return "We could not complete that. Please try again.";
}