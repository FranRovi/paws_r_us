import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageCard from "../components/PageCard";
import { useApplications } from "../hooks/useApplications";
import { useAppointments } from "../hooks/useAppointments";
import { usePets } from "../hooks/usePets";
import {
  VISIT_LABEL,
  dateTile,
  formatVisitWhen,
  groupVisits,
  visitNote,
  visitStatusLabel,
} from "../lib/scheduling";

const BADGE = {
  Scheduled: "bg-[#E3F5D9]",
  Completed: "bg-[#F7F0C8]",
  Cancelled: "bg-[#EDEDED]",
  Missed: "bg-[#FFE6CC]",
};

function UpcomingCard({ visit, pet, now, busy, onCancel }) {
  const tile = dateTile(visit.starts_at);
  const status = visitStatusLabel(visit, now);
  const title = `${VISIT_LABEL[visit.kind]} with ${pet.name}`;

  return (
    <article className="flex flex-wrap items-center gap-6 rounded-[28px] bg-cream px-6 py-5">
      <div className="flex min-h-[84px] w-[84px] flex-col items-center justify-center rounded-[22px] bg-white">
        <span className="text-[13px] font-extrabold text-brown">
          {tile.month}
        </span>
        <span className="text-[32px] font-extrabold leading-none">
          {tile.day}
        </span>
      </div>
      <div className="flex min-w-[280px] flex-1 flex-col gap-1">
        <span className="text-xl font-extrabold">{title}</span>
        <span className="text-[15px] text-muted">
          {`${formatVisitWhen(visit.starts_at)} · ${pet.shelter.name}`}
        </span>
        <span className="text-sm text-muted">{visitNote(visit.kind)}</span>
      </div>
      <span
        className={`rounded-full px-4 py-2 text-sm font-extrabold ${BADGE[status]}`}
      >
        {status}
      </span>
      <div className="flex gap-2.5">
        <Link
          to={`/adoptions/${visit.application_id}/schedule?reschedule=${visit.id}`}
          aria-label={`Reschedule ${title}`}
          className="box-border flex min-h-12 items-center rounded-[14px] border-2 border-ink bg-white px-5 font-semibold"
        >
          Reschedule
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => onCancel(visit.id)}
          aria-label={`Cancel ${title}`}
          className="min-h-12 cursor-pointer rounded-[14px] px-5 font-semibold underline disabled:opacity-60"
        >
          Cancel visit
        </button>
      </div>
    </article>
  );
}

export default function Appointments() {
  const {
    appointments,
    loading: visitsLoading,
    error: visitsError,
    cancel,
    reload,
  } = useAppointments();
  const { applications, loading: appsLoading } = useApplications();
  const { pets, loading: petsLoading } = usePets();
  const [now] = useState(() => new Date());
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  // Visits can change behind our back (declining an application cancels them).
  useEffect(() => {
    reload();
  }, [reload]);

  const loading = visitsLoading || appsLoading || petsLoading;
  const error = visitsError || message;

  const applicationById = new Map(applications.map((a) => [a.id, a]));
  const petById = new Map(pets.map((p) => [p.id, p]));
  const withPet = (visit) => {
    const application = applicationById.get(visit.application_id);
    const pet = application ? petById.get(application.pet_id) : undefined;
    return pet ? { visit, pet } : null;
  };

  const { upcoming, past } = groupVisits(appointments, now);
  const upcomingRows = upcoming.map(withPet).filter(Boolean);
  const pastRows = past.map(withPet).filter(Boolean);

  async function cancelVisit(id) {
    setBusyId(id);
    setMessage("");
    const result = await cancel(id);
    setBusyId(null);
    if (result.error) setMessage(result.error);
  }

  return (
    <PageCard className="flex min-h-[640px] flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-extrabold tracking-tight">
            My appointments
          </h1>
          <p className="mt-1.5 text-base text-muted">
            Each adoption has two visits: a meet and greet first, then a home
            visit.
          </p>
        </div>
        <Link
          to="/adoptions"
          className="flex min-h-14 items-center rounded-2xl bg-brand px-7 text-lg font-extrabold text-ink"
        >
          Schedule a visit
        </Link>
      </div>

      {loading && <p role="status">Loading your visits…</p>}

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {error}
        </p>
      )}

      {!loading && (
        <>
          <section aria-label="Upcoming visits" className="flex flex-col gap-3.5">
            <h2 className="text-[22px] font-extrabold">
              {`Upcoming (${upcomingRows.length})`}
            </h2>
            {upcomingRows.map(({ visit, pet }) => (
              <UpcomingCard
                key={visit.id}
                visit={visit}
                pet={pet}
                now={now}
                busy={busyId === visit.id}
                onCancel={cancelVisit}
              />
            ))}
            {upcomingRows.length === 0 && (
              <p className="rounded-[28px] bg-cream p-10 text-center text-base text-muted">
                No upcoming visits. Schedule one to move your application
                forward.
              </p>
            )}
          </section>

          <section aria-label="Past visits" className="flex flex-col gap-2.5">
            <h2 className="text-[22px] font-extrabold">Past visits</h2>
            {pastRows.map(({ visit, pet }) => {
              const status = visitStatusLabel(visit, now);
              return (
                <div
                  key={visit.id}
                  className="flex flex-wrap items-center gap-4 rounded-[22px] border-2 border-[#EDEDED] px-[22px] py-4"
                >
                  <span className="min-w-[260px] flex-1 text-base font-semibold">
                    {`${VISIT_LABEL[visit.kind]} with ${pet.name}`}
                  </span>
                  <span className="text-sm text-muted">
                    {formatVisitWhen(visit.starts_at)}
                  </span>
                  <span
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-extrabold ${BADGE[status]}`}
                  >
                    {status}
                  </span>
                </div>
              );
            })}
            {pastRows.length === 0 && (
              <p className="text-[15px] text-muted">No past visits yet.</p>
            )}
          </section>
        </>
      )}
    </PageCard>
  );
}