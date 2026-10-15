import { Link, NavLink } from "react-router-dom";
import PawLogo from "./PawLogo";
import { useAuth } from "../hooks/useAuth";

const NAV_LINKS = [
  { to: "/explore", label: "Explore" },
  { to: "/favorites", label: "Favorites" },
  { to: "/adoptions", label: "My adoptions" },
  { to: "/appointments", label: "Appointments" },
  { to: "/messages", label: "Messages" },
  { to: "/notifications", label: "Notifications" },
];

function navClass({ isActive }) {
  return isActive
    ? "flex min-h-[44px] items-center rounded-full bg-brand px-[18px] font-extrabold text-ink"
    : "flex min-h-[44px] items-center rounded-full px-[18px] font-medium text-muted transition hover:bg-cream";
}

export default function Header() {
  const { user } = useAuth();
  const initial = (user?.user_metadata?.first_name || user?.email || "?")
    .charAt(0)
    .toUpperCase();
  const unread = 0; // the real count arrives with the notifications phase

  return (
    <div className="relative z-50 px-10 pt-6">
      <header className="mx-auto flex min-h-20 max-w-[1360px] flex-wrap items-center gap-7 rounded-[32px] bg-white px-6 shadow-[0_10px_30px_rgba(107,68,35,0.2)]">
        <Link to="/explore" aria-label="Paws R Us, home">
          <PawLogo size="md" />
        </Link>

        <nav aria-label="Main" className="flex flex-wrap gap-1.5">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3.5">
          <Link
            to="/notifications"
            aria-label={
              unread > 0
                ? `Notifications, ${unread} unread`
                : "Notifications, none unread"
            }
            className="relative flex size-12 items-center justify-center rounded-full bg-field text-text"
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
              <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z" />
              <path d="M10 21h4" />
            </svg>
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-extrabold text-ink">
                {unread}
              </span>
            )}
          </Link>

          <Link
            to="/profile"
            aria-label="Account, edit profile"
            className="flex size-12 items-center justify-center rounded-full bg-[#F3E8FB] font-extrabold text-text"
          >
            {initial}
          </Link>
        </div>
      </header>
    </div>
  );
}
