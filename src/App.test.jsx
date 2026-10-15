import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { usePets } from "./hooks/usePets";

vi.mock("./hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("./hooks/useProfile", () => ({ useProfile: vi.fn() }));
vi.mock("./hooks/usePets", () => ({ usePets: vi.fn() }));
vi.mock("./lib/petPhoto", () => ({
  petPhotoUrl: (path) => (path ? `https://photos.test/${path}` : null),
}));

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
  home_type: "House with a yard",
  tenure: "I own my home",
  other_pets: "No other pets",
  notify_appointments: true,
  notify_applications: true,
  notify_messages: false,
};

const pets = [
  {
    id: "p1",
    name: "Max",
    species: "cat",
    breed: "American Shorthair",
    age_months: 6,
    photo_path: "max.jpg",
    shelter: { name: "Heart Shelter", city: "New York, NY", distance_miles: 2 },
  },
  {
    id: "p2",
    name: "Rocky",
    species: "dog",
    breed: "Husky",
    age_months: 24,
    photo_path: null,
    shelter: {
      name: "PetLove Rescue",
      city: "Brooklyn, NY",
      distance_miles: 4,
    },
  },
];

beforeEach(() => {
  useAuth.mockReturnValue(loggedOut);
  useProfile.mockReturnValue({ profile, loading: false, error: "" });
  usePets.mockReturnValue({ pets, loading: false, error: "" });
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
    // expect(screen.getByText(/me@example.com/i)).toBeInTheDocument();
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
    expect(screen.getByLabelText("Email")).toHaveValue("me@example.com");
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

  it("shows validation errors when saving a profile with an empty name", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/profile");
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    expect(screen.getByText("Enter your first name.")).toBeInTheDocument();
  });

  it("saves the profile and shows a confirmation", async () => {
    const save = vi.fn().mockResolvedValue({ error: null });
    useAuth.mockReturnValue(loggedIn);
    useProfile.mockReturnValue({ profile, loading: false, error: "", save });
    renderAt("/profile");

    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { value: "Boston" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText(/profile saved/i)).toBeInTheDocument();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Boston" }),
    );
  });
  it("lists the pets on Explore", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");

    expect(screen.getByText("2 pets")).toBeInTheDocument();
    expect(
      screen.getByText("Cat · American Shorthair · 6 months"),
    ).toBeInTheDocument();
    expect(screen.getByText("PetLove Rescue · 4 mi")).toBeInTheDocument();
    expect(screen.getByAltText("Max, American Shorthair")).toHaveAttribute(
      "src",
      "https://photos.test/max.jpg",
    );
    expect(screen.queryByAltText(/rocky/i)).not.toBeInTheDocument();
  });

  it("shows a loading message while the pets load", () => {
    useAuth.mockReturnValue(loggedIn);
    usePets.mockReturnValue({ pets: [], loading: true, error: "" });
    renderAt("/explore");
    expect(screen.getByRole("status")).toHaveTextContent(/loading pets/i);
  });

  it("shows an error when the pets cannot be loaded", () => {
    useAuth.mockReturnValue(loggedIn);
    usePets.mockReturnValue({ pets: [], loading: false, error: "Boom" });
    renderAt("/explore");
    expect(screen.getByRole("alert")).toHaveTextContent(/boom/i);
  });
  it("hides dogs when the Dogs box is unticked", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");

    fireEvent.click(screen.getByLabelText("Dogs"));

    expect(screen.getByText("1 pet")).toBeInTheDocument();
    expect(screen.queryByText(/PetLove Rescue/)).not.toBeInTheDocument();
  });

  it("searches by name, breed or shelter", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");

    fireEvent.change(screen.getByRole("searchbox", { name: /search pets/i }), {
      target: { value: "husky" },
    });

    expect(screen.getByText("1 pet")).toBeInTheDocument();
    expect(screen.getByText("PetLove Rescue · 4 mi")).toBeInTheDocument();
  });

  it("shows an empty state, and Reset brings the pets back", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");

    fireEvent.change(screen.getByRole("searchbox", { name: /search pets/i }), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("0 pets")).toBeInTheDocument();
    expect(screen.getByText("No pets match these filters")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText("2 pets")).toBeInTheDocument();
    expect(
      screen.queryByText("No pets match these filters"),
    ).not.toBeInTheDocument();
  });

  it("changes the sort order", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");

    fireEvent.change(screen.getByLabelText(/sort by/i), {
      target: { value: "age" },
    });

    expect(screen.getByLabelText(/sort by/i)).toHaveValue("age");
  });
});
