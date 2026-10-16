import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Appointments from "./Appointments";

const mocks = vi.hoisted(() => ({
  useApplications: vi.fn(),
  useAppointments: vi.fn(),
  usePets: vi.fn(),
}));

vi.mock("../hooks/useApplications", () => ({
  useApplications: mocks.useApplications,
}));
vi.mock("../hooks/useAppointments", () => ({
  useAppointments: mocks.useAppointments,
}));
vi.mock("../hooks/usePets", () => ({ usePets: mocks.usePets }));
vi.mock("../lib/demo", () => ({ demoToolsEnabled: true }));


const cancel = vi.fn();
const reload = vi.fn();
const demoSetVisitStatus = vi.fn()

const pets = [
  { id: "p1", name: "Daisy", shelter: { name: "Heart Shelter" } },
  { id: "p2", name: "Rocky", shelter: { name: "PetLove Rescue" } },
  { id: "p3", name: "Milo", shelter: { name: "Safe Harbor Shelter" } },
];
const applications = [
  { id: "a1", pet_id: "p1", status: "in_review" },
  { id: "a2", pet_id: "p2", status: "accepted" },
  { id: "a3", pet_id: "p3", status: "in_review" },
];

const at = (day, hour, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();

const visits = [
  { id: "v1", application_id: "a1", kind: "meet", status: "scheduled", starts_at: at(20, 10) },
  { id: "v2", application_id: "a2", kind: "meet", status: "completed", starts_at: at(10, 9) },
  { id: "v3", application_id: "a2", kind: "home", status: "cancelled", starts_at: at(12, 15, 30) },
  { id: "v4", application_id: "a3", kind: "meet", status: "scheduled", starts_at: at(14, 11) },
];

function setup({ appointments = visits, loading = false, error = null } = {}) {
  mocks.useApplications.mockReturnValue({ applications, loading: false });
  mocks.usePets.mockReturnValue({ pets, loading: false });
  mocks.useAppointments.mockReturnValue({
    appointments,
    loading,
    error,
    cancel,
    reload,
    demoSetVisitStatus,
  });
  return render(
    <MemoryRouter>
      <Appointments />
    </MemoryRouter>,
  );
}

describe("Appointments", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 16, 12, 0)); // Fri Oct 16, 2026, noon
    vi.clearAllMocks();
    cancel.mockResolvedValue({});
    demoSetVisitStatus.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes the visits when the page opens", () => {
    setup();
    expect(reload).toHaveBeenCalled();
  });

  it("lists the upcoming visits with their details", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "Upcoming (1)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Meet and greet with Daisy")).toBeInTheDocument();
    expect(
      screen.getByText("Tue, Oct 20 · 10:00 AM · Heart Shelter"),
    ).toBeInTheDocument();
    expect(screen.getByText("OCT")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });

  it("links Reschedule to the schedule page in reschedule mode", () => {
    setup();
    expect(
      screen.getByRole("link", { name: "Reschedule Meet and greet with Daisy" }),
    ).toHaveAttribute("href", "/adoptions/a1/schedule?reschedule=v1");
  });

  it("cancels a visit", () => {
    setup();
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel Meet and greet with Daisy" }),
    );
    expect(cancel).toHaveBeenCalledWith("v1");
  });

  it("shows the error when cancelling fails", async () => {
    cancel.mockResolvedValue({ error: "We could not complete that. Please try again." });
    setup();
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel Meet and greet with Daisy" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We could not complete that",
    );
  });

  it("lists past visits, latest first, with their status", () => {
    setup();
    const past = within(screen.getByRole("region", { name: "Past visits" }));
    const rows = past.getAllByText(/ with /).map((el) => el.textContent);
    expect(rows).toEqual([
      "Meet and greet with Milo",
      "Home visit with Rocky",
      "Meet and greet with Rocky",
    ]);
    expect(past.getByText("Missed")).toBeInTheDocument();
    expect(past.getByText("Cancelled")).toBeInTheDocument();
    expect(past.getByText("Completed")).toBeInTheDocument();
  });

  it("explains when there are no upcoming visits", () => {
    setup({ appointments: [visits[1]] });
    expect(screen.getByText(/No upcoming visits/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Upcoming (0)" }),
    ).toBeInTheDocument();
  });

  it("shows a loading message", () => {
    setup({ loading: true });
    expect(screen.getByRole("status")).toHaveTextContent("Loading your visits");
  });
  it("lets the demo shelter complete an upcoming visit", () => {
    setup();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark as completed (Meet and greet with Daisy)",
      }),
    );
    expect(demoSetVisitStatus).toHaveBeenCalledWith("v1", "completed");
  });

  it("lets the demo shelter undo a completed visit or complete a missed one", () => {
    setup();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Undo completed (Meet and greet with Rocky)",
      }),
    );
    expect(demoSetVisitStatus).toHaveBeenCalledWith("v2", "scheduled");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Mark as completed (Meet and greet with Milo)",
      }),
    );
    expect(demoSetVisitStatus).toHaveBeenCalledWith("v4", "completed");
  });

  it("offers no demo controls for a cancelled visit", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: /\(Home visit with Rocky\)/ }),
    ).not.toBeInTheDocument();
  });
});