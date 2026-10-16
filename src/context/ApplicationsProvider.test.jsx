import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ApplicationsProvider from "./ApplicationsProvider";
import { useApplications } from "../hooks/useApplications";

const db = vi.hoisted(() => ({
  list: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ order: db.list }) }),
      insert: () => ({ select: () => ({ single: db.insert }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: db.update }) }) }),
    }),
  },
}));

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}));

function Probe() {
  const { applications, loading, apply, cancel } = useApplications();
  const [message, setMessage] = useState("");
  return (
    <>
      <p>
        {loading
          ? "loading"
          : `ready:${applications.map((a) => a.status).join(",")}`}
      </p>
      <button
        onClick={async () => {
          const result = await apply("p1");
          setMessage(result.error ?? "applied");
        }}
      >
        apply
      </button>
      <button
        onClick={async () => {
          const result = await cancel("a1");
          setMessage(result.error ?? "cancelled");
        }}
      >
        cancel
      </button>
      <p>{message}</p>
    </>
  );
}

function renderProbe() {
  return render(
    <ApplicationsProvider>
      <Probe />
    </ApplicationsProvider>,
  );
}

const row = (status) => ({
  id: "a1",
  pet_id: "p1",
  status,
  created_at: "2026-10-01T10:00:00Z",
});

describe("ApplicationsProvider", () => {
  beforeEach(() => {
    db.list.mockResolvedValue({ data: [], error: null });
  });

  it("loads the user's applications", async () => {
    db.list.mockResolvedValue({ data: [row("pending")], error: null });
    renderProbe();
    expect(await screen.findByText("ready:pending")).toBeInTheDocument();
  });

  it("adds an application once the database accepts it", async () => {
    db.insert.mockResolvedValue({ data: row("pending"), error: null });
    renderProbe();
    await screen.findByText("ready:");

    fireEvent.click(screen.getByText("apply"));

    expect(await screen.findByText("applied")).toBeInTheDocument();
    expect(screen.getByText("ready:pending")).toBeInTheDocument();
  });

  it("shows a friendly message and adds nothing when the limit is reached", async () => {
    db.insert.mockResolvedValue({
      data: null,
      error: { message: "application_limit_reached" },
    });
    renderProbe();
    await screen.findByText("ready:");

    fireEvent.click(screen.getByText("apply"));

    expect(
      await screen.findByText(/3 active applications/),
    ).toBeInTheDocument();
    expect(screen.getByText("ready:")).toBeInTheDocument();
  });

  it("marks an application as cancelled", async () => {
    db.list.mockResolvedValue({ data: [row("pending")], error: null });
    db.update.mockResolvedValue({ data: row("cancelled"), error: null });
    renderProbe();
    await screen.findByText("ready:pending");

    fireEvent.click(screen.getByText("cancel"));

    expect(await screen.findByText("ready:cancelled")).toBeInTheDocument();
  });
});
