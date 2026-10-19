export function friendlyMessageError(error) {
  const text = `${error?.message ?? ""} ${error?.code ?? ""}`;

  if (text.includes("conversation_not_found")) {
    return "We could not find that conversation.";
  }
  if (text.includes("pet_not_found")) return "We could not find that pet.";
  if (text.includes("demo_tools_disabled")) {
    return "The demo shelter is turned off.";
  }
  if (text.includes("42501") || text.includes("row-level security")) {
    return "You cannot send that message.";
  }
  return "We could not send your message. Please try again.";
}