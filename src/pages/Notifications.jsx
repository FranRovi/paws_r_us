import { useState } from "react";
import PageCard from "../components/PageCard";
import { useNotifications } from "../hooks/useNotifications";
import {
  filterNotifications,
  groupByDay,
  iconFor,
  whenLabel,
} from "../lib/notifications";

function NotificationRow({ item, onRead, onDelete }) {
  return (
    <li
      className={`flex items-center gap-4 rounded-[28px] py-3.5 pl-[22px] pr-3 ${
        item.read ? "bg-[#F6F3EE]" : "bg-[#FFE9CF]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          item.read ? "bg-transparent" : "bg-brand"
        }`}
      />
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d={iconFor(item.kind)} />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={`text-base leading-normal ${
            item.read ? "font-medium" : "font-bold"
          }`}
        >
          {!item.read && <span className="sr-only">Unread: </span>}
          {item.body}
        </span>
        <span className="text-[13px] text-[#5B5348]">
          {whenLabel(item.createdAt)}
        </span>
      </div>
      {!item.read && (
        <button
          type="button"
          aria-label={`Mark as read: ${item.body}`}
          onClick={onRead}
          className="min-h-11 cursor-pointer px-3 text-sm font-semibold underline"
        >
          Mark as read
        </button>
      )}
      <button
        type="button"
        aria-label={`Delete notification: ${item.body}`}
        onClick={onDelete}
        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
        </svg>
      </button>
    </li>
  );
}

export default function Notifications() {
  const {
    notifications,
    unread,
    loading,
    error,
    markRead,
    markAllRead,
    remove,
    removeAll,
  } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");

  async function run(action) {
    setMessage("");
    const result = await action();
    if (result?.error) setMessage(result.error);
  }

  const groups = groupByDay(filterNotifications(notifications, filter));

  return (
    <PageCard className="mx-auto flex max-w-[960px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[40px] font-extrabold tracking-[-1px]">
            Notifications
          </h1>
          <p className="mb-0 mt-1.5 text-base text-[#5B5348]">
            Everything shelters and Paws R Us have told you, newest first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={unread === 0}
            onClick={() => run(markAllRead)}
            className="min-h-[52px] cursor-pointer rounded-2xl border-2 border-[#1A1A1A] bg-white px-5 font-semibold text-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
          <button
            type="button"
            disabled={notifications.length === 0}
            onClick={() => run(removeAll)}
            className="min-h-[52px] cursor-pointer rounded-2xl border-0 bg-[#1A1A1A] px-5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete all
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter notifications"
        className="flex gap-2"
      >
        <button
          type="button"
          aria-pressed={filter === "all"}
          onClick={() => setFilter("all")}
          className={`min-h-11 cursor-pointer rounded-full px-[22px] font-semibold ${
            filter === "all"
              ? "bg-[#1A1A1A] text-white"
              : "bg-[#EDEDED] text-[#1A1A1A]"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          aria-pressed={filter === "unread"}
          onClick={() => setFilter("unread")}
          className={`min-h-11 cursor-pointer rounded-full px-[22px] font-semibold ${
            filter === "unread"
              ? "bg-[#1A1A1A] text-white"
              : "bg-[#EDEDED] text-[#1A1A1A]"
          }`}
        >
          Unread ({unread})
        </button>
      </div>

      {message && (
        <p role="alert" className="m-0 rounded-2xl bg-[#FDE8E8] px-5 py-3 font-semibold">
          {message}
        </p>
      )}

      {loading && <p className="m-0 text-[#5B5348]">Loading your notifications…</p>}

      {!loading && error && (
        <p role="alert" className="m-0 rounded-2xl bg-[#FDE8E8] px-5 py-3 font-semibold">
          {error}
        </p>
      )}

      {!loading &&
        !error &&
        groups.map((group) => (
          <section key={group.title} className="flex flex-col gap-2.5">
            <h2 className="m-0 text-sm font-extrabold uppercase tracking-[0.08em] text-[#5B5348]">
              {group.title}
            </h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {group.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onRead={() => run(() => markRead(item.id))}
                  onDelete={() => run(() => remove(item.id))}
                />
              ))}
            </ul>
          </section>
        ))}

      {!loading && !error && groups.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-[28px] bg-[#FFF6EA] px-7 py-12 text-center">
          <span className="text-[22px] font-extrabold">You're all caught up</span>
          <span className="text-[15px] text-[#5B5348]">
            No notifications to show here.
          </span>
        </div>
      )}
    </PageCard>
  );
}