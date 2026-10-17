import { describe, expect, it } from "vitest";
import {
  dayGroup,
  filterNotifications,
  groupByDay,
  iconFor,
  toNotification,
  unreadCount,
  unreadLabel,
  whenLabel,
  badgeText
} from "./notifications";

const NOW = new Date(2026, 9, 17, 12, 0);

function note(id, createdAt, read = false, kind = "status") {
  return { id, kind, body: `note ${id}`, linkPath: null, read, createdAt };
}

describe("toNotification", () => {
  it("maps a database row", () => {
    const result = toNotification({
      id: "n1",
      kind: "visit",
      body: "Your meet and greet with Max is booked.",
      link_path: "/appointments",
      read_at: null,
      created_at: "2026-10-17T12:00:00.000Z",
    });
    expect(result.id).toBe("n1");
    expect(result.linkPath).toBe("/appointments");
    expect(result.read).toBe(false);
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("is read when read_at is set and has no link when link_path is missing", () => {
    const result = toNotification({
      id: "n2",
      kind: "heart",
      body: "x",
      read_at: "2026-10-17T13:00:00.000Z",
      created_at: "2026-10-17T12:00:00.000Z",
    });
    expect(result.read).toBe(true);
    expect(result.linkPath).toBeNull();
  });
});

describe("unread helpers", () => {
  const list = [
    note(1, NOW, false),
    note(2, NOW, true),
    note(3, NOW, false),
  ];

  it("counts unread", () => {
    expect(unreadCount(list)).toBe(2);
    expect(unreadCount([])).toBe(0);
  });

  it("builds the bell label", () => {
    expect(unreadLabel(3)).toBe("Notifications, 3 unread");
    expect(unreadLabel(0)).toBe("Notifications, none unread");
  });

  it("filters all and unread", () => {
    expect(filterNotifications(list, "all")).toHaveLength(3);
    expect(filterNotifications(list, "unread").map((n) => n.id)).toEqual([1, 3]);
  });
});

describe("iconFor", () => {
  it("returns a different path per kind and falls back to status", () => {
    expect(iconFor("visit")).not.toBe(iconFor("heart"));
    expect(iconFor("unknown")).toBe(iconFor("status"));
  });
});

describe("dayGroup", () => {
  it("splits at local midnight", () => {
    expect(dayGroup(new Date(2026, 9, 17, 0, 0), NOW)).toBe("Today");
    expect(dayGroup(new Date(2026, 9, 16, 23, 59), NOW)).toBe("Yesterday");
    expect(dayGroup(new Date(2026, 9, 15, 23, 59), NOW)).toBe("Earlier");
  });
});

describe("whenLabel", () => {
  it("shows the time for today and yesterday", () => {
    expect(whenLabel(new Date(2026, 9, 17, 9, 12), NOW)).toBe("Today, 9:12 AM");
    expect(whenLabel(new Date(2026, 9, 16, 16, 40), NOW)).toBe(
      "Yesterday, 4:40 PM",
    );
  });

  it("handles noon and midnight", () => {
    expect(whenLabel(new Date(2026, 9, 17, 12, 5), NOW)).toBe("Today, 12:05 PM");
    expect(whenLabel(new Date(2026, 9, 17, 0, 30), NOW)).toBe("Today, 12:30 AM");
  });

  it("shows the date for older ones, with the year when it differs", () => {
    expect(whenLabel(new Date(2026, 9, 4, 8, 0), NOW)).toBe("Oct 4");
    expect(whenLabel(new Date(2025, 9, 4, 8, 0), NOW)).toBe("Oct 4, 2025");
  });
});

describe("groupByDay", () => {
  it("groups newest first and leaves out empty groups", () => {
    const list = [
      note(1, new Date(2026, 9, 4, 8, 0)),
      note(2, new Date(2026, 9, 17, 9, 0)),
      note(3, new Date(2026, 9, 17, 11, 0)),
    ];
    const groups = groupByDay(list, NOW);
    expect(groups.map((g) => g.title)).toEqual(["Today", "Earlier"]);
    expect(groups[0].items.map((n) => n.id)).toEqual([3, 2]);
  });

  it("returns an empty list for no notifications", () => {
    expect(groupByDay([], NOW)).toEqual([]);
  });

  describe("badgeText", () => {
  it("shows the number and caps it at 99+", () => {
    expect(badgeText(3)).toBe("3");
    expect(badgeText(99)).toBe("99");
    expect(badgeText(100)).toBe("99+");
    });
  });
});