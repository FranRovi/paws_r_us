import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationsProvider from "./NotificationsProvider";
import { useNotifications } from "../hooks/useNotifications";

const db = vi.hoisted(() => {
  const state = { rows: [], loadError: null, writeError: null, calls: [] };

  function chain(op, payload) {
    const filters = [];
    const query = {
      eq: (column, value) => {
        filters.push(["eq", column, value]);
        return query;
      },
      is: (column, value) => {
        filters.push(["is", column, value]);
        return query;
      },
      order: () => query,
      limit: () => query,
      then: (resolve, reject) => {
        state.calls.push({ op, payload, filters });
        const result =
          op === "select"
            ? { data: state.rows, error: state.loadError }
            : { error: state.writeError };
        return Promise.resolve(result).then(resolve, reject);
      },
    };
    return query;
  }

  const from = vi.fn(() => ({
    select: () => chain("select"),
    update: (payload) => chain("update", payload),
    delete: () => chain("delete"),
  }));

  return { state, from };
});

vi.mock("../lib/supabase", () => {
  const supabase = { from: db.from };
  return { supabase, default: supabase };
});

vi.mock("../hooks/useAuth", () => {
  const useAuth = () => ({ user: { id: "u1" } });
  return { useAuth, default: useAuth };
});

function row(id, readAt, createdAt) {
  return {
    id,
    kind: "status",
    body: `note ${id}`,
    link_path: null,
    read_at: readAt,
    created_at: createdAt,
  };
}

function setup() {
  return renderHook(() => useNotifications(), {
    wrapper: NotificationsProvider,
  });
}

async function loaded() {
  const hook = setup();
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  db.state.rows = [
    row("n1", null, "2026-10-17T12:00:00Z"),
    row("n2", null, "2026-10-17T10:00:00Z"),
    row("n3", "2026-10-16T09:00:00Z", "2026-10-16T08:00:00Z"),
  ];
  db.state.loadError = null;
  db.state.writeError = null;
  db.state.calls = [];
});

describe("NotificationsProvider", () => {
  it("loads the signed-in user's notifications and counts unread", async () => {
    const { result } = await loaded();
    expect(result.current.notifications.map((n) => n.id)).toEqual([
      "n1",
      "n2",
      "n3",
    ]);
    expect(result.current.unread).toBe(2);
    expect(db.state.calls[0].filters).toContainEqual(["eq", "user_id", "u1"]);
  });

  it("shows a friendly error when loading fails", async () => {
    db.state.loadError = { message: "boom" };
    const { result } = await loaded();
    expect(result.current.error).toBe("We could not load your notifications.");
    expect(result.current.notifications).toEqual([]);
  });

  it("marks one notification as read and saves read_at", async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.markRead("n1");
    });
    expect(result.current.unread).toBe(1);
    const call = db.state.calls.find((c) => c.op === "update");
    expect(call.payload.read_at).toEqual(expect.any(String));
    expect(call.filters).toContainEqual(["eq", "id", "n1"]);
  });

  it("does not save when the notification is already read", async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.markRead("n3");
    });
    expect(db.state.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("marks all as read, saving only the unread ones", async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.markAllRead();
    });
    expect(result.current.unread).toBe(0);
    const call = db.state.calls.find((c) => c.op === "update");
    expect(call.filters).toContainEqual(["eq", "user_id", "u1"]);
    expect(call.filters).toContainEqual(["is", "read_at", null]);
  });

  it("deletes one notification", async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.remove("n2");
    });
    expect(result.current.notifications.map((n) => n.id)).toEqual(["n1", "n3"]);
    const call = db.state.calls.find((c) => c.op === "delete");
    expect(call.filters).toContainEqual(["eq", "id", "n2"]);
  });

  it("deletes all notifications", async () => {
    const { result } = await loaded();
    await act(async () => {
      await result.current.removeAll();
    });
    expect(result.current.notifications).toEqual([]);
    const call = db.state.calls.find((c) => c.op === "delete");
    expect(call.filters).toContainEqual(["eq", "user_id", "u1"]);
  });

  it("returns an error and restores the list when saving fails", async () => {
    const { result } = await loaded();
    db.state.writeError = { message: "boom" };
    let outcome;
    await act(async () => {
      outcome = await result.current.markRead("n1");
    });
    expect(outcome.error).toBe(
      "We could not update your notifications. Please try again.",
    );
    expect(result.current.unread).toBe(2);
  });
});