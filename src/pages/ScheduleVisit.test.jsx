import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ScheduleVisit from "./ScheduleVisit";

const mocks = vi.hoisted(() => ({
  useApplications: vi.fn(),
  useAppointments: vi.fn(),
  usePets: vi.fn(),
  useTakenSlots: vi.fn(),
}));

vi.mock("../hooks/useApplications", () => ({
  useApplications: mocks.useApplications,
}));
vi.mock("../hooks/useAppointments", () => ({
  useAppointments: mocks.useAppointments,
}));
vi.mock("../hooks/usePets", () => ({ usePets: mocks.usePets }));
vi.mock("../hooks/useTakenSlots", () => ({
  useTakenSlots: mocks.useTakenSlots,
}));

const book = vi.fn();
const reschedule = vi.fn();
const reloadTaken = vi.fn();

const pet = {
  id: "p1",
  name: "Daisy",
  shelter_id: "s1",
  shelter: { name: "Heart Shelter" },
};
const inReview = { id: "a1", pet_id: "p1", status: "in_review" };

function setup({
  applications = [inReview],
  visits = [],
  taken = [],
  url = '/adoptions/a1/schedule'
} = {}) {
  mocks.useApplications.mockReturnValue({ applications, loading: false });
  mocks.useAppointments.mockReturnValue({
    visitsFor: () => visits,
    loading: false,
    book,
    reschedule,
  });
  mocks.usePets.mockReturnValue({ pets: [pet], loading: false });
  mocks.useTakenSlots.mockReturnValue({
    taken,
    error: null,
    reload: reloadTaken,
  });

  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/adoptions/:applicationId/schedule"
          element={<ScheduleVisit />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

const day = (name) => screen.getByRole("button", { name });
const time = (name) => screen.getByRole("button", { name });

describe("ScheduleVisit", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 16, 12, 0)); // Fri Oct 16, 2026, noon
    vi.clearAllMocks();
    book.mockResolvedValue({});
    reschedule.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the pet, the shelter and a locked home visit tab", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "Schedule a visit for Daisy" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Heart Shelter/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "2. Home visit (locked)" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "1. Meet and greet" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("disables past days, Sundays and today's past times", () => {
    setup();
    expect(day("Thursday, October 15")).toBeDisabled();
    expect(day("Sunday, October 18")).toBeDisabled();

    fireEvent.click(day("Friday, October 16"));
    expect(time("9:00 AM")).toBeDisabled(); // before noon
    expect(time("2:00 PM")).toBeEnabled();
  });

  it("lists the times for a day and summarizes the choice", () => {
    setup();
    expect(screen.getByText("Pick a day and a time.")).toBeInTheDocument();

    fireEvent.click(day("Monday, October 19"));
    fireEvent.click(time("10:30 AM"));

    expect(
      screen.getByText("Oct 19, 10:30 AM at Heart Shelter"),
    ).toBeInTheDocument();
  });

  it("disables a time that someone else already booked", () => {
    setup({ taken: [new Date(2026, 9, 19, 10, 30).toISOString()] });
    fireEvent.click(day("Monday, October 19"));
    expect(time("10:30 AM")).toBeDisabled();
    expect(time("12:00 PM")).toBeEnabled();
  });

  it("keeps Confirm disabled until a time is chosen, then books the visit", async () => {
    setup();
    const confirm = screen.getByRole("button", { name: "Confirm visit" });
    expect(confirm).toBeDisabled();

    fireEvent.click(day("Monday, October 19"));
    fireEvent.click(time("10:30 AM"));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    expect(
      await screen.findByText(
        /Meet and greet booked for Oct 19, 10:30 AM at Heart Shelter/,
      ),
    ).toBeInTheDocument();
    expect(book).toHaveBeenCalledWith(
      "a1",
      "meet",
      new Date(2026, 9, 19, 10, 30),
    );
    expect(reloadTaken).toHaveBeenCalled();
    expect(
      screen.getByRole("link", { name: "View my appointments" }),
    ).toBeInTheDocument();
  });

  it("shows the error and refreshes the times when booking fails", async () => {
    book.mockResolvedValue({
      error: "Someone just booked that time. Please pick another one.",
    });
    setup();

    fireEvent.click(day("Monday, October 19"));
    fireEvent.click(time("10:30 AM"));
    fireEvent.click(screen.getByRole("button", { name: "Confirm visit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Someone just booked that time",
    );
    expect(reloadTaken).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Confirm visit" })).toBeDisabled();
  });

  it("opens on the home visit once the meet and greet is completed", () => {
    setup({
      visits: [
        {
          id: "v1",
          kind: "meet",
          status: "completed",
          starts_at: new Date(2026, 9, 14, 9, 0).toISOString(),
        },
      ],
    });
    expect(screen.getByRole("button", { name: "2. Home visit" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("blocks booking while the application is still pending", () => {
    setup({ applications: [{ ...inReview, status: "pending" }] });
    expect(screen.getByText(/Visits open once the shelter/)).toBeInTheDocument();
    expect(day("Monday, October 19")).toBeDisabled();
  });

  it("explains when the application cannot be found", () => {
    setup({ applications: [] });
    expect(
      screen.getByRole("heading", { name: "Application not found" }),
    ).toBeInTheDocument();
  });
  it("lets you move to the next month and back", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "October 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(
      screen.getByRole("heading", { name: "November 2026" }),
    ).toBeInTheDocument();
    expect(day("Monday, November 2")).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(
      screen.getByRole("heading", { name: "October 2026" }),
    ).toBeInTheDocument();
  });

  it("stops at the end of the booking window", () => {
    setup();
    const next = screen.getByRole("button", { name: "Next month" });
    fireEvent.click(next);
    fireEvent.click(next);

    expect(
      screen.getByRole("heading", { name: "December 2026" }),
    ).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(day("Tuesday, December 15")).toBeEnabled();
    expect(day("Wednesday, December 16")).toBeDisabled();
  });

  it("opens on next month when no days are left in this one", () => {
    vi.setSystemTime(new Date(2026, 9, 31, 18, 0)); // Sat Oct 31, 6 PM
    setup();
    expect(
      screen.getByRole("heading", { name: "November 2026" }),
    ).toBeInTheDocument();
  });
  it("moves an existing visit when opened in reschedule mode", async () => {
    setup({
      url: "/adoptions/a1/schedule?reschedule=v1",
      visits: [
        {
          id: "v1",
          kind: "meet",
          status: "scheduled",
          starts_at: new Date(2026, 9, 20, 9, 0).toISOString(),
        },
      ],
    });

    expect(
      screen.getByRole("heading", { name: "Reschedule your visit for Daisy" }),
    ).toBeInTheDocument();
    expect(day("Monday, October 19")).toBeEnabled(); // not blocked as "already booked"

    fireEvent.click(day("Monday, October 19"));
    fireEvent.click(time("10:30 AM"));
    fireEvent.click(screen.getByRole("button", { name: "Move visit" }));

    expect(
      await screen.findByText(
        /Meet and greet moved to Oct 19, 10:30 AM at Heart Shelter/,
      ),
    ).toBeInTheDocument();
    expect(reschedule).toHaveBeenCalledWith("v1", new Date(2026, 9, 19, 10, 30));
    expect(book).not.toHaveBeenCalled();
  });
});