import { describe, expect, it } from "vitest";
import {
  MAX_MESSAGE_LENGTH,
  conversationForPet,
  conversationTitle,
  inboxEntries,
  previewText,
  threadFor,
  toConversation,
  toMessage,
  validateMessage,
} from "./messages";

function msg(id, conversationId, minute, sender = "user") {
  return {
    id,
    conversationId,
    sender,
    fromMe: sender === "user",
    body: `message ${id}`,
    createdAt: new Date(2026, 9, 19, 10, minute),
  };
}

function conv(id, petId) {
  return {
    id,
    petId,
    shelterId: "s1",
    lastMessageAt: new Date(2026, 9, 19, 9, 0),
  };
}

describe("mapping rows", () => {
  it("maps a conversation row", () => {
    const result = toConversation({
      id: "c1",
      pet_id: "p1",
      shelter_id: "s1",
      last_message_at: "2026-10-19T09:00:00.000Z",
    });
    expect(result.id).toBe("c1");
    expect(result.petId).toBe("p1");
    expect(result.shelterId).toBe("s1");
    expect(result.lastMessageAt).toBeInstanceOf(Date);
  });

  it("maps a message row and marks my own messages", () => {
    const mine = toMessage({
      id: "m1",
      conversation_id: "c1",
      sender: "user",
      body: "Hi",
      created_at: "2026-10-19T09:00:00.000Z",
    });
    const theirs = toMessage({
      id: "m2",
      conversation_id: "c1",
      sender: "shelter",
      body: "Hello",
      created_at: "2026-10-19T09:01:00.000Z",
    });
    expect(mine.conversationId).toBe("c1");
    expect(mine.fromMe).toBe(true);
    expect(theirs.fromMe).toBe(false);
  });
});

describe("validateMessage", () => {
  it("rejects an empty or blank message", () => {
    expect(validateMessage("")).toBe("Write a message first.");
    expect(validateMessage("   ")).toBe("Write a message first.");
    expect(validateMessage(undefined)).toBe("Write a message first.");
  });

  it("allows up to the limit and rejects beyond it", () => {
    expect(validateMessage("a".repeat(MAX_MESSAGE_LENGTH))).toBeNull();
    expect(validateMessage("a".repeat(MAX_MESSAGE_LENGTH + 1))).toBe(
      "Messages can be up to 1000 characters.",
    );
    expect(validateMessage("Hello")).toBeNull();
  });
});

describe("threads and inbox", () => {
  it("returns one conversation's messages, oldest first", () => {
    const messages = [msg(3, "c1", 30), msg(1, "c1", 10), msg(2, "c2", 20)];
    expect(threadFor(messages, "c1").map((m) => m.id)).toEqual([1, 3]);
  });

  it("finds the conversation for a pet", () => {
    const list = [conv("c1", "p1"), conv("c2", "p2")];
    expect(conversationForPet(list, "p2").id).toBe("c2");
    expect(conversationForPet(list, "p9")).toBeNull();
  });

  it("lists only conversations with messages, most recent first", () => {
    const list = [conv("c1", "p1"), conv("c2", "p2"), conv("c3", "p3")];
    const messages = [msg(1, "c1", 10), msg(2, "c2", 40), msg(3, "c1", 20)];
    const entries = inboxEntries(list, messages);
    expect(entries.map((e) => e.conversation.id)).toEqual(["c2", "c1"]);
    expect(entries[1].last.id).toBe(3);
  });
});

describe("display helpers", () => {
  it("builds a title from the shelter and the pet", () => {
    expect(
      conversationTitle({ name: "Max", shelter: { name: "Heart Shelter" } }),
    ).toBe("Heart Shelter · Max");
    expect(conversationTitle({ name: "Max" })).toBe("Max");
    expect(conversationTitle(undefined)).toBe("Conversation");
  });

  it("shortens long previews", () => {
    expect(previewText("Short")).toBe("Short");
    const result = previewText("a".repeat(100));
    expect(result).toHaveLength(80);
    expect(result.endsWith("…")).toBe(true);
  });
});