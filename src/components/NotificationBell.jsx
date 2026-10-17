import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { badgeText, unreadLabel, whenLabel } from "../lib/notifications";

const VISIBLE_COUNT = 8;
const BELL_CLASS =
  "relative z-[2] flex h-12 w-12 items-center justify-center rounded-full bg-[#EDEDED] text-[#1A1A1A]";

function BellIcon() {
  return (
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
      <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function Badge({ count }) {
  if (count === 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-[5px] text-xs font-extrabold text-[#1A1A1A]">
      {badgeText(count)}
    </span>
  );
}

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        bellRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const label = unreadLabel(unread);

  // On the Notifications page the bell is just a link, as in the design.
  if (pathname === "/notifications") {
    return (
      <Link
        to="/notifications"
        aria-label={label}
        aria-current="page"
        className={BELL_CLASS}
      >
        <BellIcon />
        <Badge count={unread} />
      </Link>
    );
  }

  function openNotification(item) {
    markRead(item.id);
    setOpen(false);
    if (item.linkPath) navigate(item.linkPath);
  }

  const latest = notifications.slice(0, VISIBLE_COUNT);

  return (
    <div className="relative">
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          data-testid="notifications-backdrop"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[1] cursor-default bg-[rgba(43,26,12,0.45)]"
        />
      )}

      <button
        ref={bellRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`${BELL_CLASS} cursor-pointer`}
      >
        <BellIcon />
        <Badge count={unread} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-[62px] z-[2] w-[420px] max-w-[calc(100vw-32px)] overflow-hidden rounded-[28px] bg-white text-left shadow-[0_24px_60px_rgba(43,26,12,0.35)]"
        >
          <div className="flex items-center gap-2 pb-2 pl-6 pr-3 pt-3.5">
            <h2 className="m-0 flex-1 text-xl font-extrabold">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="min-h-11 cursor-pointer px-2 text-sm font-semibold underline"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {latest.length > 0 ? (
            <ul className="m-0 max-h-[400px] list-none overflow-y-auto p-0 pb-2">
              {latest.map((item) => (
                <li key={item.id} className="border-t border-[#F0E3D2]">
                  <button
                    type="button"
                    onClick={() => openNotification(item)}
                    className={`flex w-full cursor-pointer items-start gap-3.5 px-6 py-4 text-left ${
                      item.read ? "bg-white" : "bg-[#FFF6EA]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${
                        item.read ? "bg-transparent" : "bg-brand"
                      }`}
                    />
                    <span className="flex flex-col gap-1">
                      <span
                        className={`text-[15px] leading-normal ${
                          item.read ? "font-medium" : "font-bold"
                        }`}
                      >
                        {!item.read && <span className="sr-only">Unread: </span>}
                        {item.body}
                      </span>
                      <span className="text-[13px] text-[#5B5348]">
                        {whenLabel(item.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 border-t border-[#F0E3D2] px-6 py-7 text-[15px] text-[#5B5348]">
              You're all caught up. New updates will show up here.
            </p>
          )}

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex min-h-14 items-center justify-center bg-brand text-[15px] font-extrabold text-[#1A1A1A]"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}