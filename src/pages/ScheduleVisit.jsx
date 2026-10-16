import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageCard from "../components/PageCard";
import { useApplications } from "../hooks/useApplications";
import { useAppointments } from "../hooks/useAppointments";
import { usePets } from "../hooks/usePets";
import { useTakenSlots } from "../hooks/useTakenSlots";
import { isActive } from "../lib/applications";
import {
  BOOKING_HORIZON_DAYS,
  VISIT_LABEL,
  blockMessage,
  bookBlockReason,
  daySlots,
  defaultKind,
  firstBookableMonth,
  formatSlotTime,
  maxMonthOffset,
  monthCells,
  monthTitle,
  startOfDay,
  visitSummary,
  visitTabs,
} from "../lib/scheduling";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function BackLink() {
  return (
    <Link
      to="/adoptions"
      className="inline-flex min-h-11 items-center font-semibold underline"
    >
      Back to My adoptions
    </Link>
  );
}

function MonthButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-white text-xl font-extrabold disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

export default function ScheduleVisit() {
  const { applicationId } = useParams();
  const { applications, loading: appsLoading } = useApplications();
  const { visitsFor, loading: visitsLoading, book } = useAppointments();
  const { pets, loading: petsLoading } = usePets();

  const [now] = useState(() => new Date());
  const [selectedKind, setSelectedKind] = useState(null);
  const [monthOffset, setMonthOffset] = useState(() => firstBookableMonth(now));
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState("");

  const application = applications.find((a) => a.id === applicationId);
  const pet = application
    ? pets.find((p) => p.id === application.pet_id)
    : undefined;
  const visits = application ? visitsFor(application.id) : [];

  // Taken times for the whole booking window.
  const today = startOfDay(now);
  const rangeFrom = today.toISOString();
  const rangeTo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + BOOKING_HORIZON_DAYS + 1,
  ).toISOString();
  const {
    taken,
    error: takenError,
    reload: reloadTaken,
  } = useTakenSlots(pet?.shelter_id, rangeFrom, rangeTo);

  const loading = appsLoading || petsLoading || visitsLoading;

  if (loading) {
    return (
      <PageCard className="flex min-h-[640px] flex-col gap-6">
        <p role="status">Loading…</p>
      </PageCard>
    );
  }

  if (!application || !isActive(application) || !pet) {
    return (
      <PageCard className="flex min-h-[640px] flex-col gap-6">
        <BackLink />
        <h1 className="text-[40px] font-extrabold tracking-tight">
          Application not found
        </h1>
        <p className="text-base text-muted">
          We could not find an active application for this visit.
        </p>
      </PageCard>
    );
  }

  const tabs = visitTabs(visits);
  const kind = tabs.some((t) => t.kind === selectedKind && !t.locked)
    ? selectedKind
    : defaultKind(visits);
  const reason = bookBlockReason(application, visits, kind);
  const blocked = reason !== null;
  const lockedNote = tabs.find((t) => t.locked)?.note;
  const slots = day ? daySlots(day, taken, now) : [];

  const cells = monthCells(now, monthOffset);
  const maxOffset = maxMonthOffset(now);

  function pickKind(next) {
    setSelectedKind(next);
    setSlot(null);
    setError("");
  }

  function pickDay(next) {
    setDay(next);
    setSlot(null);
    setError("");
  }

  async function confirm() {
    if (!slot || blocked || busy) return;
    setBusy(true);
    setError("");
    const summary = visitSummary(
      { starts_at: slot.toISOString() },
      pet.shelter.name,
    );
    const result = await book(application.id, kind, slot);
    setBusy(false);
    setSlot(null);
    reloadTaken();
    if (result.error) {
      setError(result.error);
      return;
    }
    setBooked(`${VISIT_LABEL[kind]} booked for ${summary}.`);
  }

  return (
    <PageCard className="flex min-h-[640px] flex-col gap-6">
      <div>
        <BackLink />
        <h1 className="text-[40px] font-extrabold tracking-tight">
          Schedule a visit for {pet.name}
        </h1>
        <p className="mt-1.5 text-base text-muted">
          {pet.shelter.name}
          {lockedNote ? ` · ${lockedNote}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.kind}
            type="button"
            disabled={tab.locked}
            aria-pressed={tab.kind === kind}
            onClick={() => pickKind(tab.kind)}
            className={`min-h-14 cursor-pointer rounded-2xl border-2 border-ink px-6 text-base font-extrabold disabled:cursor-not-allowed disabled:opacity-45 ${
              tab.kind === kind ? "bg-brand" : "bg-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {blocked && !booked && (
        <p
          role="status"
          className="rounded-2xl bg-cream px-4 py-3 text-sm font-semibold"
        >
          {blockMessage(reason)}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-8">
        <section
          aria-label="Pick a day"
          className="min-w-[320px] flex-[1_1_460px] rounded-[32px] bg-cream p-7"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold">
              {monthTitle(now, monthOffset)}
            </h2>
            <div className="flex gap-2">
              <MonthButton
                label="Previous month"
                disabled={monthOffset === 0}
                onClick={() => setMonthOffset(monthOffset - 1)}
              >
                ‹
              </MonthButton>
              <MonthButton
                label="Next month"
                disabled={monthOffset >= maxOffset}
                onClick={() => setMonthOffset(monthOffset + 1)}
              >
                ›
              </MonthButton>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[13px] font-extrabold text-brown">
            {WEEKDAYS.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map(({ date, inMonth, enabled }) => {
              if (!inMonth) {
                return <span key={date.getTime()} aria-hidden="true" />;
              }
              const selected = day?.getTime() === date.getTime();
              const label = date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              });
              return (
                <button
                  key={date.getTime()}
                  type="button"
                  disabled={!enabled || blocked}
                  aria-label={label}
                  aria-pressed={selected}
                  onClick={() => pickDay(date)}
                  className={`min-h-[52px] cursor-pointer rounded-[14px] font-extrabold disabled:cursor-not-allowed disabled:opacity-35 ${
                    selected ? "bg-brand" : "bg-white"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="flex flex-[0_1_380px] flex-col gap-4">
          <section
            aria-label="Available times"
            className="flex flex-col gap-3.5 rounded-[32px] bg-cream p-7"
          >
            <h2 className="text-xl font-extrabold">Available times</h2>
            {takenError && (
              <p role="alert" className="text-sm font-semibold text-red-800">
                {takenError}
              </p>
            )}
            {!day && (
              <p className="text-[15px] text-muted">
                Pick a day to see the available times.
              </p>
            )}
            {day && (
              <div className="grid grid-cols-2 gap-2.5">
                {slots.map((s) => {
                  const selected = slot?.getTime() === s.start.getTime();
                  return (
                    <button
                      key={s.start.getTime()}
                      type="button"
                      disabled={!s.available || blocked}
                      aria-pressed={selected}
                      onClick={() => setSlot(s.start)}
                      className={`min-h-12 cursor-pointer rounded-[14px] border-2 border-ink font-semibold disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through ${
                        selected ? "bg-brand" : "bg-white"
                      }`}
                    >
                      {formatSlotTime(s.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div className="rounded-3xl border-2 border-[#EDEDED] bg-white p-5 text-[15px] leading-normal">
            <strong>
              {VISIT_LABEL[kind]} with {pet.name}
            </strong>
            <br />
            {slot
              ? visitSummary({ starts_at: slot.toISOString() }, pet.shelter.name)
              : "Pick a day and a time."}
          </div>

          <button
            type="button"
            disabled={!slot || blocked || busy}
            onClick={confirm}
            className="min-h-[60px] cursor-pointer rounded-2xl bg-brand text-lg font-extrabold text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Booking…" : "Confirm visit"}
          </button>

          {error && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
            >
              {error}
            </p>
          )}

          {booked && (
            <div
              role="status"
              className="rounded-[20px] bg-[#E3F5D9] px-5 py-4 font-semibold"
            >
              {booked}{" "}
              <Link to="/adoptions" className="font-extrabold underline">
                Go to My adoptions
              </Link>
            </div>
          )}
        </aside>
      </div>
    </PageCard>
  );
}