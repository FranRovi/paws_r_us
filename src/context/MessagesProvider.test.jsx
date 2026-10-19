import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MessagesProvider from "./MessagesProvider";
import { useMessages } from "../hooks/useMessages";

const db = vi.hoisted(() => {
  const state = {
    conversations: [],
    messages: [],
    loadError: null,
    createdConversation: { data: null, error: null },
    createdMessage: { data: null, error: null },
    rpcResult: { data: null, error: null },
    calls: [],
    handlers: {},
  };

  function select(table) {
    state.calls.push({ op: "select", table });
    const query = {
      eq: () => query,
      order: () => query,
      limit: () => query,
      then: (resolve, reject) => {
        const result = {
          data: table === "conversations" ? state.conversations : state.messages,
          error: state.loadError,
        };
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return query;
  }

  function insert(table, payload) {
    state.calls.push({ op: "insert", table, payload });
    const query = {
      select: () => query,
      single: () =>
        Promise.resolve(
          table === "conversations"
            ? state.createdConversation
            : state.createdMessage,
        ),
    };
    return query;
  }

  const from = vi.fn((table) => ({
    select: () => select(table),
    insert: (payload) => insert(table, payload),
  }));

  const rpc = vi.fn((name, args) => {
    state.calls.push({ op: "rpc", name, args });
    return Promise.resolve(state.rpcResult);
  });

  const channel = vi.fn(() => {
    const channelObject = {
      on: vi.fn((type, filter, callback) => {
        state.handlers[filter.event] = { filter, callback };
        return channelObject;
      }),
      subscribe: vi.fn(() => channelObject),
    };
    return channelObject;
  });

  const removeChannel = vi.fn();

  return { state, from, rpc, channel, removeChannel };
});

vi.mock("../lib/supabase", () => {
  const supabase = {
    from: db.from,
    rpc: db.rpc,
    channel: db.channel,
    removeChannel: db.removeChannel,
  };
  return { supabase, default: supabase };
});

vi.mock("../hooks/useAuth", () => {
  const useAuth = () => ({ user: { id: "u1" } });
  return { useAuth, default: useAuth };
});

function conversationRow(id, petId) {
  return {
    id,
    pet_id: petId,
    shelter_id: "s1",
    last_message_at: "2026-10-19T09:00:00Z",
  };
}

function messageRow(id, conversationId, sender, createdAt, body) {
  return {
    id,
    conversation_id: conversationId,
    sender,
    body,
    created_at: createdAt,
  };
}

function conversationSelects() {
  return db.state.calls.filter(
    (c) => c.op === "select" && c.table === "conversations",
  ).length;
}

async function loaded() {
  const hook = renderHook(() => useMessages(), { wrapper: MessagesProvider });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  db.state.conversations = [conversationRow("c1", "p1")];
  db.state.messages = [
    messageRow("m1", "c1", "user", "2026-10-19T09:00:00Z", "Hi"),
    messageRow("m2", "c1", "shelter", "2026-10-19T09:05:00Z", "Hello!"),
  ];
  db.state.loadError = null;
  db.state.createdConversation = {
    data: conversationRow("c2", "p2"),
    error: null,
  };
  db.state.createdMessage = {
    data: messageRow("m3", "c1", "user", "2026-10-19T10:00:00Z", "Hello again"),
    error: null,
  };
  db.state.rpcResult = {
    data: messageRow("m9", "c1", "shelter", "2026-10-19T11:00:00Z", "Thanks!"),
    error: null,
  };
  db.state.calls = [];
  db.state.handlers = {};
  db.channel.mockClear();
  db.removeChannel.mockClear();
  db.rpc.mockClear();
});

describe("MessagesProvider", () => {
  it("loads the user's conversations and messages", async () => {
    const { result } = await loaded();
    expect(result.current.conversations.map((c) => c.id)).toEqual(["c1"]);
    expect(result.current.messages.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(result.current.messages[0].fromMe).toBe(true);
  });

  it("shows a friendly error when loading fails", async () => {
    db.state.loadError = { message: "boom" };
    const { result } = await loaded();
    expect(result.current.error).toBe("We could not load your messages.");
  });

  it("sends a message in an existing conversation", async () => {
    const { result } = await loaded();
    let outcome;
    await act(async () => {
      outcome = await result.current.send("p1", "  Hello again  ");
    });
    expect(outcome).toEqual({ conversationId: "c1" });
    expect(
      db.state.calls.some((c) => c.op === "insert" && c.table === "conversations"),
    ).toBe(false);
    const insert = db.state.calls.find(
      (c) => c.op === "insert" && c.table === "messages",
    );
    expect(insert.payload).toEqual({
      conversation_id: "c1",
      sender: "user",
      body: "Hello again",
    });
    expect(result.current.messages).toHaveLength(3);
  });

  it("starts a conversation with the first message to a pet", async () => {
    db.state.createdMessage = {
      data: messageRow("m3", "c2", "user", "2026-10-19T10:00:00Z", "Is Luna good with kids?"),
      error: null,
    };
    const { result } = await loaded();
    let outcome;
    await act(async () => {
      outcome = await result.current.send("p2", "Is Luna good with kids?");
    });
    expect(outcome).toEqual({ conversationId: "c2" });
    const created = db.state.calls.find(
      (c) => c.op === "insert" && c.table === "conversations",
    );
    expect(created.payload).toEqual({ user_id: "u1", pet_id: "p2" });
    expect(result.current.conversations.map((c) => c.id)).toContain("c2");
  });

  it("does not send an empty message", async () => {
    const { result } = await loaded();
    let outcome;
    await act(async () => {
      outcome = await result.current.send("p1", "   ");
    });
    expect(outcome).toEqual({ error: "Write a message first." });
    expect(db.state.calls.some((c) => c.op === "insert")).toBe(false);
  });

  it("explains why a message could not be sent", async () => {
    db.state.createdMessage = { data: null, error: { message: "boom" } };
    const { result } = await loaded();
    let outcome;
    await act(async () => {
      outcome = await result.current.send("p1", "Hello again");
    });
    expect(outcome.error).toBe("We could not send your message. Please try again.");
    expect(result.current.messages).toHaveLength(2);
  });

  it("carries on when another tab created the conversation first", async () => {
    const { result } = await loaded();
    db.state.conversations = [conversationRow("c1", "p1"), conversationRow("c2", "p2")];
    db.state.createdConversation = {
      data: null,
      error: { code: "23505", message: "duplicate key" },
    };
    db.state.createdMessage = {
      data: messageRow("m3", "c2", "user", "2026-10-19T10:00:00Z", "Hi"),
      error: null,
    };
    let outcome;
    await act(async () => {
      outcome = await result.current.send("p2", "Hi");
    });
    expect(outcome).toEqual({ conversationId: "c2" });
    const insert = db.state.calls.find(
      (c) => c.op === "insert" && c.table === "messages",
    );
    expect(insert.payload.conversation_id).toBe("c2");
  });

  it("lets the demo shelter reply, and explains when it is off", async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.demoShelterReply("c1");
    });
    expect(db.rpc).toHaveBeenCalledWith("demo_shelter_reply", {
      p_conversation_id: "c1",
    });
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].sender).toBe("shelter");

    db.state.rpcResult = { data: null, error: { message: "demo_tools_disabled" } };
    let outcome;
    await act(async () => {
      outcome = await result.current.demoShelterReply("c1");
    });
    expect(outcome.error).toBe("The demo shelter is turned off.");
  });
});

describe("MessagesProvider realtime", () => {
  it("listens to the signed-in user's messages only", async () => {
    await loaded();
    expect(db.channel).toHaveBeenCalledWith("messages:u1");
    expect(db.state.handlers.INSERT.filter).toMatchObject({
      schema: "public",
      table: "messages",
      filter: "user_id=eq.u1",
    });
  });

  it("adds a new message once and updates the last activity", async () => {
    const { result } = await loaded();
    const incoming = messageRow("m5", "c1", "shelter", "2026-10-19T12:00:00Z", "Hi there");
    act(() => {
      db.state.handlers.INSERT.callback({ new: incoming });
    });
    act(() => {
      db.state.handlers.INSERT.callback({ new: incoming });
    });
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.conversations[0].lastMessageAt).toEqual(
      new Date("2026-10-19T12:00:00Z"),
    );
  });

  it("reloads when a message belongs to a conversation it does not know", async () => {
    await loaded();
    expect(conversationSelects()).toBe(1);
    act(() => {
      db.state.handlers.INSERT.callback({
        new: messageRow("m6", "c9", "shelter", "2026-10-19T12:00:00Z", "New chat"),
      });
    });
    await waitFor(() => expect(conversationSelects()).toBe(2));
  });

  it("stops listening when the provider goes away", async () => {
    const { unmount } = await loaded();
    unmount();
    expect(db.removeChannel).toHaveBeenCalledTimes(1);
  });
});