export const MAX_MESSAGE_LENGTH = 1000;

export function toConversation(row) {
  return {
    id: row.id,
    petId: row.pet_id,
    shelterId: row.shelter_id,
    lastMessageAt: new Date(row.last_message_at),
  };
}

export function toMessage(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    fromMe: row.sender === "user",
    body: row.body,
    createdAt: new Date(row.created_at),
  };
}

// Returns an error message, or null when the text can be sent.
export function validateMessage(body) {
  const text = (body ?? "").trim();
  if (text.length === 0) return "Write a message first.";
  if (text.length > MAX_MESSAGE_LENGTH) {
    return `Messages can be up to ${MAX_MESSAGE_LENGTH} characters.`;
  }
  return null;
}

// One conversation's messages, oldest first.
export function threadFor(messages, conversationId) {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function conversationForPet(conversations, petId) {
  return conversations.find((c) => c.petId === petId) ?? null;
}

// The inbox: conversations that have messages, most recent activity first.
export function inboxEntries(conversations, messages) {
  return conversations
    .map((conversation) => {
      const thread = threadFor(messages, conversation.id);
      return { conversation, last: thread[thread.length - 1] ?? null };
    })
    .filter((entry) => entry.last !== null)
    .sort((a, b) => b.last.createdAt - a.last.createdAt);
}

export function conversationTitle(pet) {
  if (!pet) return "Conversation";
  const shelter = pet.shelter?.name;
  return shelter ? `${shelter} · ${pet.name}` : pet.name;
}

export function previewText(body, max = 80) {
  if (body.length <= max) return body;
  return `${body.slice(0, max - 1).trimEnd()}…`;
}