import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { usePets } from "./hooks/usePets";
import { usePet } from "./hooks/usePet";
import { useFavorites } from "./hooks/useFavorites";
import { useApplications } from "./hooks/useApplications";
import { useWaitingList } from "./hooks/useWaitingList";

vi.mock("./hooks/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("./hooks/useProfile", () => ({ useProfile: vi.fn() }));
vi.mock("./hooks/usePets", () => ({ usePets: vi.fn() }));
vi.mock("./lib/petPhoto", () => ({
  petPhotoUrl: (path) => (path ? `https://photos.test/${path}` : null),
}));
vi.mock("./hooks/usePet", () => ({ usePet: vi.fn() }));
vi.mock("./hooks/useFavorites", () => ({ useFavorites: vi.fn() }));
vi.mock("./context/FavoritesProvider", () => ({
  default: ({ children }) => children,
}));
vi.mock("./hooks/useApplications", () => ({ useApplications: vi.fn() }));
vi.mock("./hooks/useWaitingList", () => ({ useWaitingList: vi.fn() }));
vi.mock("./context/ApplicationsProvider", () => ({
  default: ({ children }) => children,
}));
vi.mock("./lib/demo", () => ({ demoToolsEnabled: true }));
vi.mock('./context/AppointmentsProvider', () => ({
  AppointmentsProvider: ({ children }) => children,
}))


const application = (id, petId, status = "pending") => ({
  id,
  pet_id: petId,
  status,
  created_at: "2026-10-01T10:00:00Z",
});
const withApplications = (applications) => ({
  applications,
  loading: false,
  error: "",
  apply,
  cancel,
  demoSetStatus,
});

const toggleFavorite = vi.fn();
const apply = vi.fn();
const cancel = vi.fn();
const demoSetStatus = vi.fn();

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

const petDetail = {
  id: "p1",
  name: "Max",
  species: "cat",
  breed: "American Shorthair",
  age_months: 6,
  sex: "female",
  energy: 3,
  intro: "Max is a curious, affectionate stray.",
  photo_path: "max.jpg",
  photo_credit: "Photo by Jane Doe on Pexels",
  shelter: {
    name: "Heart Shelter",
    city: "New York, NY",
    phone: "123-456-7890",
    email: "heart@example.com",
  },
};

beforeEach(() => {
  useAuth.mockReturnValue(loggedOut);
  useProfile.mockReturnValue({ profile, loading: false, error: "" });
  usePets.mockReturnValue({ pets, loading: false, error: "" });
  usePet.mockReturnValue({ pet: petDetail, loading: false, error: "" });
  toggleFavorite.mockClear();
  apply.mockReset();
  cancel.mockReset();
  apply.mockResolvedValue({});
  cancel.mockResolvedValue({});
  useApplications.mockReturnValue(withApplications([]));
  useWaitingList.mockReturnValue({ list: [], loading: false, error: "" });
  useFavorites.mockReturnValue({
    loading: false,
    isFavorite: (id) => id === "p1",
    toggleFavorite,
  });
  demoSetStatus.mockReset();
  demoSetStatus.mockResolvedValue({});
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
  it("shows the pet detail page", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/pets/p1");

    expect(screen.getByRole("heading", { name: "Max" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Cat · American Shorthair · 6 months · Female · New York, NY",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Energy level 3 of 5" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Max is a curious, affectionate stray."),
    ).toBeInTheDocument();
    expect(screen.getByText("Photo by Jane Doe on Pexels")).toBeInTheDocument();
    expect(screen.getByText("Heart Shelter")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "heart@example.com" }),
    ).toHaveAttribute("href", "mailto:heart@example.com");
    expect(
      screen.getByText("You join Max's waiting list."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adopt Me" })).toBeEnabled();
    expect(
      screen.getByRole("link", { name: /back to results/i }),
    ).toHaveAttribute("href", "/explore");
  });

  it("shows a not-found message for an unknown pet", () => {
    useAuth.mockReturnValue(loggedIn);
    usePet.mockReturnValue({ pet: null, loading: false, error: "" });
    renderAt("/pets/nope");
    expect(
      screen.getByRole("heading", { name: /couldn't find this pet/i }),
    ).toBeInTheDocument();
  });

  it("shows loading and error states on the pet page", () => {
    useAuth.mockReturnValue(loggedIn);
    usePet.mockReturnValue({ pet: null, loading: true, error: "" });
    const { unmount } = renderAt("/pets/p1");
    expect(screen.getByRole("status")).toHaveTextContent(/loading pet/i);
    unmount();

    usePet.mockReturnValue({ pet: null, loading: false, error: "Boom" });
    renderAt("/pets/p1");
    expect(screen.getByRole("alert")).toHaveTextContent(/boom/i);
  });
  it("shows which pets are saved and toggles them from Explore", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/explore");

    expect(
      screen.getByRole("button", { name: "Remove Max from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");

    const rocky = screen.getByRole("button", {
      name: "Save Rocky to favorites",
    });
    expect(rocky).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(rocky);
    expect(toggleFavorite).toHaveBeenCalledWith("p2");
  });

  it("shows the heart on the pet detail page", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/pets/p1");

    expect(
      screen.getByRole("button", { name: "Remove Max from favorites" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  it("lists only the saved pets on Favorites", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/favorites");

    expect(
      screen.getByRole("heading", { name: "My favorites" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 pet saved. Tap the heart to remove one."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cat · American Shorthair · 6 months"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/PetLove Rescue/)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Remove Max from favorites" }),
    );
    expect(toggleFavorite).toHaveBeenCalledWith("p1");
  });

  it("shows an empty state when nothing is saved", () => {
    useAuth.mockReturnValue(loggedIn);
    useFavorites.mockReturnValue({
      loading: false,
      isFavorite: () => false,
      toggleFavorite,
    });
    renderAt("/favorites");

    expect(
      screen.getByText("0 pets saved. Tap the heart to remove one."),
    ).toBeInTheDocument();
    expect(screen.getByText("No favorites yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse pets" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  it("shows a loading message while favorites load", () => {
    useAuth.mockReturnValue(loggedIn);
    useFavorites.mockReturnValue({
      loading: true,
      isFavorite: () => false,
      toggleFavorite,
    });
    renderAt("/favorites");

    expect(screen.getByRole("status")).toHaveTextContent(/loading favorites/i);
    expect(screen.queryByText("No favorites yet")).not.toBeInTheDocument();
  });
  it("starts an adoption after the user confirms", async () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/pets/p1");

    expect(screen.getByText("No one yet")).toBeInTheDocument();
    expect(
      screen.getByText("0 of 3 adoption slots in use"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Adopt Me" }));
    expect(
      screen.getByRole("dialog", { name: /start the adoption for max/i }),
    ).toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: "Yes, start adoption" }),
    );
    await waitFor(() => expect(apply).toHaveBeenCalledWith("p1"));
  });

  it("does not apply when the user chooses Not now", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/pets/p1");

    fireEvent.click(screen.getByRole("button", { name: "Adopt Me" }));
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });

  it("shows the reason when the application could not be sent", async () => {
    useAuth.mockReturnValue(loggedIn);
    apply.mockResolvedValue({ error: "Nope, try later" });
    renderAt("/pets/p1");

    fireEvent.click(screen.getByRole("button", { name: "Adopt Me" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, start adoption" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nope, try later",
    );
  });

  it("blocks Adopt Me when 3 applications are active", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([
        application("a1", "p2"),
        application("a2", "p3"),
        application("a3", "p4", "in_review"),
      ]),
    );
    renderAt("/pets/p1");

    expect(screen.getByRole("button", { name: "Adopt Me" })).toBeDisabled();
    expect(
      screen.getByText(/already have 3 active applications/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to My adoptions" }),
    ).toHaveAttribute("href", "/adoptions");
    expect(
      screen.getByText("3 of 3 adoption slots in use"),
    ).toBeInTheDocument();
  });

  it("shows the sent application, the position, and lets the user cancel", async () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([application("a9", "p1")]),
    );
    useWaitingList.mockReturnValue({
      list: [
        { id: "a5", status: "pending", created_at: "2026-09-30T10:00:00Z" },
        { id: "a9", status: "pending", created_at: "2026-10-01T10:00:00Z" },
      ],
      loading: false,
      error: "",
    });
    renderAt("/pets/p1");

    expect(screen.getByRole("status")).toHaveTextContent("Application sent");
    expect(screen.getByText("2 people")).toBeInTheDocument();
    expect(
      screen.getByText(/You are number 2 on Max's waiting list\./),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 of 3 adoption slots in use"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Adopt Me" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel application" }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("a9"));
  });
  it("lists the active applications with their progress", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([
        application("a1", "p1", "in_review"),
        application("a2", "p2", "pending"),
      ]),
    );
    renderAt("/adoptions");

    expect(
      screen.getByRole("heading", { name: "My adoptions" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    expect(screen.getByText("1 slot open")).toBeInTheDocument();

    const max = within(
      screen.getByRole("region", { name: "Application for Max" }),
    );
    expect(max.getByText("Meet and greet next")).toBeInTheDocument();
    expect(max.getByText("Schedule it with the shelter")).toBeInTheDocument();

    const rocky = within(
      screen.getByRole("region", { name: "Application for Rocky" }),
    );
    expect(rocky.getByText("Under review")).toBeInTheDocument();
    expect(rocky.getByText(/waiting for the shelter/)).toBeInTheDocument();
  });

  it("cancels an application from My adoptions", async () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([application("a1", "p1")]),
    );
    renderAt("/adoptions");

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel application for Max" }),
    );
    await waitFor(() => expect(cancel).toHaveBeenCalledWith("a1"));
  });

  it("shows why a cancel failed", async () => {
    useAuth.mockReturnValue(loggedIn);
    cancel.mockResolvedValue({ error: "Nope, try later" });
    useApplications.mockReturnValue(
      withApplications([application("a1", "p1")]),
    );
    renderAt("/adoptions");

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel application for Max" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nope, try later",
    );
  });

  it("shows an empty state when there are no applications", () => {
    useAuth.mockReturnValue(loggedIn);
    renderAt("/adoptions");

    expect(screen.getByText("0 of 3")).toBeInTheDocument();
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse pets" })).toHaveAttribute(
      "href",
      "/explore",
    );
  });

  it("says when all 3 slots are in use", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([
        application("a1", "p1"),
        application("a2", "p2"),
        application("a3", "p3"),
      ]),
    );
    renderAt("/adoptions");

    expect(screen.getByText("3 of 3")).toBeInTheDocument();
    expect(screen.getByText("All 3 slots in use")).toBeInTheDocument();
  });

  it("lists declined and cancelled applications as past ones", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([
        application("a1", "p1", "rejected"),
        application("a2", "p2", "cancelled"),
      ]),
    );
    renderAt("/adoptions");

    const past = within(
      screen.getByRole("region", { name: "Past applications" }),
    );
    expect(past.getByText(/Declined by the shelter/)).toBeInTheDocument();
    expect(past.getByText(/Cancelled/)).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Application for Max" }),
    ).not.toBeInTheDocument();
  });

  it("shows a loading message while applications load", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue({
      ...withApplications([]),
      loading: true,
    });
    renderAt("/adoptions");

    expect(screen.getByRole("status")).toHaveTextContent(
      /loading your applications/i,
    );
  });
  it("greys out pets the user has already applied for", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([application("a1", "p2")]),
    );
    renderAt("/explore");

    expect(
      screen.getByRole("link", { name: "View Rocky, application sent" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Application sent")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Max" })).toBeInTheDocument();
  });

  it("shows a pet as available again after the application is cancelled", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([application("a1", "p2", "cancelled")]),
    );
    renderAt("/explore");

    expect(screen.queryByText("Application sent")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View Rocky" }),
    ).toBeInTheDocument();
  });
  it("lets the demo shelter change an application's status", async () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([application("a1", "p1")]),
    );
    renderAt("/adoptions");

    fireEvent.click(
      screen.getByRole("button", { name: "Open meet and greet (Max)" }),
    );
    await waitFor(() =>
      expect(demoSetStatus).toHaveBeenCalledWith("a1", "in_review"),
    );
  });

  it("disables the demo button for the status the application already has", () => {
    useAuth.mockReturnValue(loggedIn);
    useApplications.mockReturnValue(
      withApplications([application("a1", "p1", "in_review")]),
    );
    renderAt("/adoptions");

    expect(
      screen.getByRole("button", { name: "Open meet and greet (Max)" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Approve adoption (Max)" }),
    ).toBeEnabled();
  });

  it("shows why a demo status change failed", async () => {
    useAuth.mockReturnValue(loggedIn);
    demoSetStatus.mockResolvedValue({ error: "Demo went wrong" });
    useApplications.mockReturnValue(
      withApplications([application("a1", "p1")]),
    );
    renderAt("/adoptions");

    fireEvent.click(screen.getByRole("button", { name: "Decline (Max)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Demo went wrong",
    );
  });
});
