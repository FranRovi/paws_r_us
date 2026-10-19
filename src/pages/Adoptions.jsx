import { useState } from "react";
import { Link } from "react-router-dom";
import ApplicationStepper from "../components/ApplicationStepper";
import PageCard from "../components/PageCard";
import PawIcon from "../components/PawIcon";
import DemoControls from "../components/DemoControls";
import MessageDrawer from "../components/MessageDrawer";
import { demoToolsEnabled } from "../lib/demo";
import { useApplications } from "../hooks/useApplications";
import { useAppointments } from "../hooks/useAppointments";
import { usePets } from "../hooks/usePets";
import {
  MAX_ACTIVE_APPLICATIONS,
  formatShortDate,
  isActive,
  openSlots,
  statusLabel,
} from "../lib/applications";
import { petPhotoUrl } from "../lib/petPhoto";
import { applicationStepsWithVisits, applicationProgressLabel } from "../lib/visitSteps";

const SPECIES_LABEL = { cat: "Cat", dog: "Dog" };

function slotCopy(used, open) {
  if (open === 0) {
    return {
      title: "All 3 slots in use",
      text: "Cancel an application, or wait for a shelter's decision, to apply for another pet.",
    };
  }
  if (used === 0) {
    return {
      title: "No applications yet",
      text: "Find a pet you love and press Adopt Me. You can have up to 3 applications at a time.",
    };
  }
  return {
    title: open === 1 ? "1 slot open" : `${open} slots open`,
    text: "Canceling an application, or a shelter declining it, frees a slot again.",
  };
}

function AdoptionCard({
  application,
  pet,
  visits,
  busy,
  onCancel,
  onDemoStatus,
  onMessage,
}) {
  const photo = petPhotoUrl(pet.photo_path);
  const hasVisits = visits.some((visit) => visit.status !== "cancelled");

  return (
    <section
      aria-label={`Application for ${pet.name}`}
      className="flex flex-col gap-6 rounded-[32px] bg-cream px-8 py-7"
    >
      <div className="flex flex-wrap items-center gap-[18px]">
        <div className="size-[72px] shrink-0 overflow-hidden rounded-[22px] bg-paw/40">
          {photo ? (
            <img src={photo} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <PawIcon className="size-8 fill-brown/40" />
            </span>
          )}
        </div>
        <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
          <span className="text-2xl font-extrabold">{pet.name}</span>
          <span className="text-[15px] text-muted">
            {SPECIES_LABEL[pet.species]} · {pet.breed} · {pet.shelter.name}
          </span>
        </div>
        <span className="rounded-full bg-white px-[18px] py-2 text-sm font-semibold">
          {applicationProgressLabel(application, visits)}
        </span>
      </div>

      <ApplicationStepper
        steps={applicationStepsWithVisits(
          application,
          visits,
          pet.shelter.name,
        )}/>

      <button
          type="button"
          onClick={() => onMessage(pet)}
          aria-label={`Message shelter about ${pet.name}`}
          className="min-h-[52px] cursor-pointer rounded-2xl border-2 border-ink bg-white px-6 font-semibold text-ink"
        >
          Message shelter
      </button>

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/pets/${pet.id}`}
          className="flex min-h-[52px] items-center rounded-2xl bg-brand px-6 font-extrabold text-ink"
        >
          View {pet.name}
        </Link>
        {application.status !== "pending" && (
          <Link
            to={`/adoptions/${application.id}/schedule`}
            aria-label={`Schedule a visit for ${pet.name}`}
            className="flex min-h-[52px] items-center rounded-2xl border-2 border-ink bg-white px-6 font-semibold text-ink"
          >
            Schedule a visit
          </Link>
        )}
        {hasVisits && (
          <Link
            to="/appointments"
            aria-label={`View visits for ${pet.name}`}
            className="flex min-h-[52px] items-center rounded-2xl border-2 border-ink bg-white px-6 font-semibold text-ink"
          >
            View visits
          </Link>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onCancel(application.id)}
          aria-label={`Cancel application for ${pet.name}`}
          className="min-h-[52px] cursor-pointer px-3 font-semibold underline disabled:opacity-60"
        >
          Cancel application
        </button>
      </div>
      {demoToolsEnabled && (
        <DemoControls
          pet={pet}
          application={application}
          busy={busy}
          onChange={onDemoStatus}
        />
      )}
    </section>
  );
}

export default function Adoptions() {
  const {
    applications,
    loading: appsLoading,
    error: appsError,
    cancel,
    demoSetStatus,
  } = useApplications();
  const { visitsFor, reload: reloadVisits } = useAppointments();
  const { pets, loading: petsLoading, error: petsError } = usePets();
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [messagingPet, setMessagingPet] = useState(null);

  const loading = appsLoading || petsLoading;
  const error = appsError || petsError || message;

  const petById = new Map(pets.map((pet) => [pet.id, pet]));
  const active = applications.filter(isActive);
  const past = applications.filter((application) => !isActive(application));
  const open = openSlots(applications);
  const slots = slotCopy(active.length, open);

  async function run(applicationId, action) {
    setBusyId(applicationId);
    setMessage("");
    const result = await action();
    // Cancelling or declining an application cancels its visits in the database.
    await reloadVisits();
    setBusyId(null);
    if (result.error) setMessage(result.error);
  }

  const cancelApplication = (applicationId) =>
    run(applicationId, () => cancel(applicationId));
  const changeStatus = (applicationId, status) =>
    run(applicationId, () => demoSetStatus(applicationId, status));

  return (
    <PageCard className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] font-extrabold tracking-tight">
            My adoptions
          </h1>
          <p className="mt-1.5 text-base text-muted">
            Track each application from first hello to final decision.
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-3 rounded-full bg-cream px-5 py-3">
            <span className="font-extrabold">
              {`${active.length} of ${MAX_ACTIVE_APPLICATIONS}`}
            </span>
            <span className="text-sm text-muted">applications in use</span>
          </div>
        )}
      </div>

      {loading && <p role="status">Loading your applications…</p>}

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {error}
        </p>
      )}

      {!loading && !appsError && !petsError && (
        <>
          {active.map((application) => {
            const pet = petById.get(application.pet_id);
            if (!pet) return null;
            return (
              <AdoptionCard
                key={application.id}
                application={application}
                pet={pet}
                visits={visitsFor(application.id)}
                busy={busyId === application.id}
                onCancel={cancelApplication}
                onDemoStatus={changeStatus}
                onMessage={setMessagingPet}
              />
            );
          })}

          <section className="flex flex-wrap items-center gap-[18px] rounded-[32px] border-[3px] border-dashed border-cream px-8 py-6">
            <div className="flex min-w-[260px] flex-1 flex-col gap-1">
              <span className="text-xl font-extrabold">{slots.title}</span>
              <span className="text-[15px] text-muted">{slots.text}</span>
            </div>
            <Link
              to="/explore"
              className="flex min-h-[52px] items-center rounded-2xl bg-brand px-6 font-extrabold text-ink"
            >
              Browse pets
            </Link>
          </section>

          {past.length > 0 && (
            <section
              aria-label="Past applications"
              className="flex flex-col gap-3"
            >
              <h2 className="text-xl font-extrabold">Past applications</h2>
              <ul className="flex flex-col gap-2">
                {past.map((application) => {
                  const pet = petById.get(application.pet_id);
                  if (!pet) return null;
                  return (
                    <li
                      key={application.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-cream px-5 py-3 text-[15px]"
                    >
                      <Link
                        to={`/pets/${pet.id}`}
                        className="font-extrabold underline"
                      >
                        {pet.name}
                      </Link>
                      <span className="text-muted">
                        {statusLabel(application.status)} · applied{" "}
                        {formatShortDate(application.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      )}
      {messagingPet && (
        <MessageDrawer
          pet={messagingPet}
          onClose={() => setMessagingPet(null)}
        />
      )}
    </PageCard>
  );
}