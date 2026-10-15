import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FavoritesProvider from "./FavoritesProvider";
import { useFavorites } from "../hooks/useFavorites";

const db = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: db.select }),
      insert: db.insert,
      delete: () => ({ eq: () => ({ eq: db.remove }) }),
    }),
  },
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

function Probe() {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  return (
    <>
      <p>{loading ? "loading" : "ready"}</p>
      <button onClick={() => toggleFavorite("p1")}>
        {isFavorite("p1") ? "saved" : "not saved"}
      </button>
    </>
  );
}

function renderProbe() {
  return render(
    <FavoritesProvider>
      <Probe />
    </FavoritesProvider>,
  );
}

describe("FavoritesProvider", () => {
  beforeEach(() => {
    db.select.mockResolvedValue({ data: [], error: null });
    db.insert.mockResolvedValue({ error: null });
    db.remove.mockResolvedValue({ error: null });
    db.insert.mockClear();
    db.remove.mockClear();
  });

  it("loads the saved pets", async () => {
    db.select.mockResolvedValue({ data: [{ pet_id: "p1" }], error: null });
    renderProbe();
    expect(await screen.findByText("saved")).toBeInTheDocument();
  });

  it("saves a pet right away and stores it", async () => {
    renderProbe();
    await screen.findByText("ready");

    fireEvent.click(screen.getByText("not saved"));

    expect(screen.getByText("saved")).toBeInTheDocument();
    expect(db.insert).toHaveBeenCalledWith({ user_id: "u1", pet_id: "p1" });
  });

  it("removes a saved pet", async () => {
    db.select.mockResolvedValue({ data: [{ pet_id: "p1" }], error: null });
    renderProbe();
    await screen.findByText("saved");

    fireEvent.click(screen.getByText("saved"));

    expect(screen.getByText("not saved")).toBeInTheDocument();
    expect(db.remove).toHaveBeenCalled();
  });

  it("undoes the change and warns when the database refuses", async () => {
    db.insert.mockResolvedValue({ error: { code: "500" } });
    renderProbe();
    await screen.findByText("ready");

    fireEvent.click(screen.getByText("not saved"));
    expect(screen.getByText("saved")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("not saved")).toBeInTheDocument(),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/could not update/i);
  });
});
