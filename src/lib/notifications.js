const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ICONS = {
  visit:
    "M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M9 3v4M15 3v4",
  status:
    "M8 4h8a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6a2 2 0 0 1 2-2zM9 4V3h6v1M9 12h6M9 16h4",
  message:
    "M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  heart:
    "M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z",
};

const GROUP_ORDER = ["Today", "Yesterday", "Earlier"];

function dayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function clockTime(date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${minutes} ${suffix}`;
}

// Turns a database row into the shape the screens use.
export function toNotification(row) {
  return {
    id: row.id,
    kind: row.kind,
    body: row.body,
    linkPath: row.link_path ?? null,
    read: Boolean(row.read_at),
    createdAt: new Date(row.created_at),
  };
}

export function iconFor(kind) {
  return ICONS[kind] ?? ICONS.status;
}

export function unreadCount(list) {
  return list.filter((n) => !n.read).length;
}

export function unreadLabel(count) {
  return count > 0
    ? `Notifications, ${count} unread`
    : "Notifications, none unread";
}

export function badgeText(count) {
  return count > 99 ? "99+" : String(count);
}

export function filterNotifications(list, filter) {
  return filter === "unread" ? list.filter((n) => !n.read) : list;
}

export function dayGroup(createdAt, now = new Date()) {
  const days = Math.round((dayStart(now) - dayStart(createdAt)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

// Today and Yesterday show the time; older ones show the date.
export function whenLabel(createdAt, now = new Date()) {
  const group = dayGroup(createdAt, now);
  if (group === "Today") return `Today, ${clockTime(createdAt)}`;
  if (group === "Yesterday") return `Yesterday, ${clockTime(createdAt)}`;
  const date = `${MONTHS[createdAt.getMonth()]} ${createdAt.getDate()}`;
  return createdAt.getFullYear() === now.getFullYear()
    ? date
    : `${date}, ${createdAt.getFullYear()}`;
}

// Newest first, split into Today / Yesterday / Earlier. Empty groups are left out.
export function groupByDay(list, now = new Date()) {
  const sorted = [...list].sort((a, b) => b.createdAt - a.createdAt);
  return GROUP_ORDER.map((title) => ({
    title,
    items: sorted.filter((n) => dayGroup(n.createdAt, now) === title),
  })).filter((group) => group.items.length > 0);
}