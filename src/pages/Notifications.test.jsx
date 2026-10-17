import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Notifications from "./Notifications";

const hook = vi.hoisted(() => ({
  state: { notifications: [], loading: false, error: null },
  markRead: vi.fn(),
  markAllRead: vi.fn(),
  remove: vi.fn(),
  removeAll: vi.fn(),
}));

vi.mock("../hooks/useNotifications", () => ({
  useNotifications: () => ({
    ...hook.state,
    unread: hook.state.notifications.filter((n) => !n.read).length,
    markRead: hook.markRead,
    markAllRead: hook.markAllRead,
    remove: hook.remove,
    removeAll: hook.removeAll,
  }),
}));

function note(id, body, createdAt, read = false, kind = "status") {
  return { id, kind, body, linkPath: null, read, createdAt };
}

const TODAY_NOTE = "Heart Shelter confirmed your meet and greet with Max.";
const YESTERDAY_NOTE = "PetLove Rescue is reviewing your application for Rocky.";
const EARLIER_NOTE = "Welcome to Paws R Us!";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 17, 12, 0));
  hook.state = {
    notifications: [
      note("n1", TODAY_NOTE, new Date(2026, 9, 17, 9, 12), false, "visit"),
      note("n2", YESTERDAY_NOTE, new Date(2026, 9, 16, 16, 40), false),
      note("n3", EARLIER_NOTE, new Date(2026, 9, 4, 8, 0), true),
    ],
    loading: false,
    error: null,
  };
  for (const spy of [hook.markRead, hook.markAllRead, hook.remove, hook.removeAll]) {
    spy.mockReset();
    spy.mockResolvedValue({});
  }
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Notifications page", () => {
  it("lists notifications grouped by day with their time", () => {
    render(<Notifications />);
    expect(screen.getByRole("heading", { name: "Today" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Yesterday" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Earlier" })).not.toBeNull();
    expect(screen.getByText(TODAY_NOTE)).not.toBeNull();
    expect(screen.getByText("Today, 9:12 AM")).not.toBeNull();
    expect(screen.getByText("Yesterday, 4:40 PM")).not.toBeNull();
    expect(screen.getByText("Oct 4")).not.toBeNull();
  });

  it("shows the totals on the tabs", () => {
    render(<Notifications />);
    expect(screen.getByRole("button", { name: "All (3)" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Unread (2)" })).not.toBeNull();
  });

  it("filters to unread only", () => {
    render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: "Unread (2)" }));
    expect(
      screen.getByRole("button", { name: "Unread (2)" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.queryByText(EARLIER_NOTE)).toBeNull();
    expect(screen.getByText(TODAY_NOTE)).not.toBeNull();
  });

  it("marks one notification as read, only offered for unread ones", () => {
    render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: `Mark as read: ${TODAY_NOTE}` }));
    expect(hook.markRead).toHaveBeenCalledWith("n1");
    expect(
      screen.queryByRole("button", { name: `Mark as read: ${EARLIER_NOTE}` }),
    ).toBeNull();
  });

  it("deletes one notification", () => {
    render(<Notifications />);
    fireEvent.click(
      screen.getByRole("button", { name: `Delete notification: ${YESTERDAY_NOTE}` }),
    );
    expect(hook.remove).toHaveBeenCalledWith("n2");
  });

  it("marks all as read and deletes all", () => {
    render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(hook.markAllRead).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Delete all" }));
    expect(hook.removeAll).toHaveBeenCalled();
  });

  it("disables Mark all read when everything is read", () => {
    hook.state.notifications = [note("n3", EARLIER_NOTE, new Date(2026, 9, 4), true)];
    render(<Notifications />);
    expect(screen.getByRole("button", { name: "Mark all read" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Delete all" }).disabled).toBe(false);
  });

  it("shows an empty state and disables Delete all when there is nothing", () => {
    hook.state.notifications = [];
    render(<Notifications />);
    expect(screen.getByText("You're all caught up")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Delete all" }).disabled).toBe(true);
  });

  it("shows the empty state on the Unread tab when everything is read", () => {
    hook.state.notifications = [note("n3", EARLIER_NOTE, new Date(2026, 9, 4), true)];
    render(<Notifications />);
    fireEvent.click(screen.getByRole("button", { name: "Unread (0)" }));
    expect(screen.getByText("You're all caught up")).not.toBeNull();
  });

  it("shows a loading message and an error message", () => {
    hook.state = { notifications: [], loading: true, error: null };
    const { unmount } = render(<Notifications />);
    expect(screen.getByText("Loading your notifications…")).not.toBeNull();
    unmount();

    hook.state = {
      notifications: [],
      loading: false,
      error: "We could not load your notifications.",
    };
    render(<Notifications />);
    expect(screen.getByRole("alert").textContent).toBe(
      "We could not load your notifications.",
    );
  });

  it("shows why an action failed", async () => {
    hook.remove.mockResolvedValue({
      error: "We could not update your notifications. Please try again.",
    });
    render(<Notifications />);
    fireEvent.click(
      screen.getByRole("button", { name: `Delete notification: ${TODAY_NOTE}` }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(
      "We could not update your notifications. Please try again.",
    );
  });
});