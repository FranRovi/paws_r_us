import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";

vi.mock("./hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("./hooks/useProfile", () => ({ useProfile: vi.fn() }));

const loggedOut = {
  user: null,
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
};
const loggedIn = { ...loggedOut, user: { email: "me@example.com" } };

const profile = {
  id: "1",
  first_name: "Alex",
  last_name: "Rivera",
  username: "alex.rivera",
  address: "4 N 2nd St",
  city: "New York",
  zip: "10001",
  country: "United States",
};

beforeEach(() => {
  useAuth.mockReturnValue(loggedOut);
  useProfile.mockReturnValue({ profile, loading: false, error: "" });
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
describe("App routing", () => {
  it("shows the registration form at /register", () => {
    renderAt("/register");
    expect(
      screen.getByRole("heading", { name: /create account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting an empty registration form", () => {
    renderAt("/register");
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
    expect(screen.getByText("Enter your first name.")).toBeInTheDocument();
    expect(
      screen.getByText("You need to accept the terms to continue."),
    ).toBeInTheDocument();
  });
  it("shows validation errors when logging in with an empty form", () => {
    renderAt("/login");
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    expect(
      screen.getByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument();
  });
  it("sends a logged-out visitor from /explore to the login page", () => {
    renderAt("/explore");
    expect(
      screen.getByRole("heading", { name: /log in/i }),
    ).toBeInTheDocument();
  });

  it("shows /explore to a logged-in user", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");
    expect(
      screen.getByRole("heading", { name: /explore/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/me@example.com/i)).toBeInTheDocument();
  });

  it("sends a logged-in user away from /login", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/login");
    expect(
      screen.getByRole("heading", { name: /explore/i }),
    ).toBeInTheDocument();
  });

  it("shows a loading screen while the session is being restored", () => {
    useAuth.mockReturnValue({ ...loggedOut, loading: true });
    renderAt("/explore");
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
  });

  it("shows the shared header with the active page highlighted", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");

    const nav = screen.getByRole("navigation", { name: /main/i });
    expect(within(nav).getByRole("link", { name: /explore/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(nav).getByRole("link", { name: /favorites/i }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: /account, edit profile/i }),
    ).toHaveTextContent("M");
  });

  it("shows the profile details to a logged-in user", () => {
    useAuth.mockReturnValue({
      ...loggedIn,
      user: { email: "me@example.com", created_at: "2026-10-01T12:00:00Z" },
    });
    renderAt("/profile");

    expect(
      screen.getByRole("heading", { name: /edit profile/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/hello, alex/i)).toBeInTheDocument();
    expect(screen.getByText(/member since oct 2026/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toHaveValue("alex.rivera");
    expect(screen.getByLabelText(/email/i)).toHaveValue("me@example.com");
  });

  it("shows a loading message while the profile loads", () => {
    useAuth.mockReturnValue(loggedIn);
    useProfile.mockReturnValue({ profile: null, loading: true, error: "" });
    renderAt("/profile");
    expect(screen.getByRole("status")).toHaveTextContent(
      /loading your profile/i,
    );
  });

  it("shows an error when the profile cannot be loaded", () => {
    useAuth.mockReturnValue(loggedIn);
    useProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: "Boom",
    });
    renderAt("/profile");
    expect(screen.getByRole("alert")).toHaveTextContent(/boom/i);
  });
});
