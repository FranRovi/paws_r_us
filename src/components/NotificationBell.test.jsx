import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotificationBell from "./NotificationBell";

const hook = vi.hoisted(() => ({
  list: [],
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}));

vi.mock("../hooks/useNotifications", () => ({
  useNotifications: () => ({
    notifications: hook.list,
    unread: hook.list.filter((n) => !n.read).length,
    markRead: hook.markRead,
    markAllRead: hook.markAllRead,
  }),
}));

function note(id, body, read, linkPath = null) {
  return { id, kind: "status", body, linkPath, read, createdAt: new Date() };
}

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderBell(path = "/explore") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NotificationBell />
      <Where />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  hook.list = [
    note("n1", "Heart Shelter confirmed your meet and greet with Max.", false, "/appointments"),
    note("n2", "Welcome to Paws R Us!", true),
  ];
  hook.markRead.mockReset();
  hook.markRead.mockResolvedValue({});
  hook.markAllRead.mockReset();
  hook.markAllRead.mockResolvedValue({});
});

describe("NotificationBell", () => {
  it("shows the unread count on the bell", () => {
    renderBell();
    expect(
      screen.getByRole("button", { name: "Notifications, 1 unread" }),
    ).not.toBeNull();
    expect(screen.getByText("1")).not.toBeNull();
  });

  it("has no badge when everything is read", () => {
    hook.list = [note("n2", "Welcome to Paws R Us!", true)];
    renderBell();
    expect(
      screen.getByRole("button", { name: "Notifications, none unread" }),
    ).not.toBeNull();
    expect(screen.queryByText("1")).toBeNull();
  });

  it("opens the overlay with the latest notifications", () => {
    renderBell();
    const bell = screen.getByRole("button", { name: "Notifications, 1 unread" });
    expect(bell.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(bell);
    expect(bell.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("dialog", { name: "Notifications" })).not.toBeNull();
    expect(screen.getByText(/Heart Shelter confirmed/)).not.toBeNull();
    expect(screen.getByText("Welcome to Paws R Us!")).not.toBeNull();
  });

  it("shows an empty message when there is nothing", () => {
    hook.list = [];
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: "Notifications, none unread" }));
    expect(screen.getByText(/You're all caught up/)).not.toBeNull();
  });

  it("marks a notification read, opens its page and closes", () => {
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(screen.getByRole("button", { name: /Heart Shelter confirmed/ }));
    expect(hook.markRead).toHaveBeenCalledWith("n1");
    expect(screen.getByTestId("where").textContent).toBe("/appointments");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("marks all as read, and hides that button when none are unread", () => {
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(hook.markAllRead).toHaveBeenCalled();
  });

  it("does not offer Mark all read when everything is read", () => {
    hook.list = [note("n2", "Welcome to Paws R Us!", true)];
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: "Notifications, none unread" }));
    expect(screen.queryByRole("button", { name: "Mark all read" })).toBeNull();
  });

  it("closes with Escape, the close button and the backdrop", () => {
    renderBell();
    const bellName = "Notifications, 1 unread";

    fireEvent.click(screen.getByRole("button", { name: bellName }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: bellName }));
    fireEvent.click(screen.getByRole("button", { name: "Close notifications" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: bellName }));
    fireEvent.click(screen.getByTestId("notifications-backdrop"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("goes to the Notifications page from View all", () => {
    renderBell();
    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(screen.getByRole("link", { name: "View all notifications" }));
    expect(screen.getByTestId("where").textContent).toBe("/notifications");
  });

  it("is a plain link on the Notifications page", () => {
    renderBell("/notifications");
    const link = screen.getByRole("link", { name: "Notifications, 1 unread" });
    expect(link.getAttribute("href")).toBe("/notifications");
    expect(screen.queryByRole("button", { name: /Notifications/ })).toBeNull();
  });
});