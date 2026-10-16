import { useState } from "react";
import { Link } from "react-router-dom";
import { useApplications } from "../hooks/useApplications";
import {
  MAX_ACTIVE_APPLICATIONS,
  activeCount,
  applyBlockReason,
  isActive,
  waitingPosition,
} from "../lib/applications";

const STATUS_LABEL = {
  pending: "Application sent",
  in_review: "Application in review",
  accepted: "Application accepted",
};

function progressText(pet, application, position) {
  if (application.status === "accepted") {
    return `${pet.shelter.name} accepted your application for ${pet.name}.`;
  }
  const place = position
    ? `You are number ${position} on ${pet.name}'s waiting list.`
    : `You are on ${pet.name}'s waiting list.`;
  return `${place} ${pet.shelter.name} will review your application and contact you about your meet and greet.`;
}

function AdoptDialog({ pet, busy, onConfirm, onClose }) {
  return (
    <>
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 z-[60] cursor-default bg-ink/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adopt-dialog-title"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="fixed left-1/2 top-60 z-[70] flex w-[480px] max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col gap-4 rounded-[36px] bg-white p-9 shadow-2xl"
      >
        <h2
          id="adopt-dialog-title"
          className="text-[26px] font-extrabold tracking-tight"
        >
          Start the adoption for {pet.name}?
        </h2>
        <p className="text-base leading-relaxed text-[#3A3A3A]">
          You will join {pet.name}&apos;s waiting list and use 1 of your 3
          adoption slots. {pet.shelter.name} will then arrange two visits: a
          meet and greet, and a home visit.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onConfirm}
            className="min-h-14 flex-[1_1_180px] cursor-pointer rounded-2xl bg-brand text-[17px] font-extrabold text-ink disabled:opacity-60"
          >
            {busy ? "Sending…" : "Yes, start adoption"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-14 flex-[1_1_120px] cursor-pointer rounded-2xl border-2 border-text bg-white text-[17px] font-semibold"
          >
            Not now
          </button>
        </div>
      </div>
    </>
  );
}

export default function AdoptPanel({ pet, waitingList }) {
  const { applications, loading, error, apply, cancel } = useApplications();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const reason = applyBlockReason(applications, pet.id);
  const mine = applications.find(
    (application) => application.pet_id === pet.id && isActive(application),
  );
  const used = activeCount(applications);
  const percent = Math.round((used / MAX_ACTIVE_APPLICATIONS) * 100);
  const position = mine ? waitingPosition(waitingList, mine.id) : null;
  const notice = message || error;

  async function confirmAdopt() {
    setBusy(true);
    setMessage("");
    const result = await apply(pet.id);
    setBusy(false);
    setConfirmOpen(false);
    if (result.error) setMessage(result.error);
  }

  async function cancelApplication() {
    setBusy(true);
    setMessage("");
    const result = await cancel(mine.id);
    setBusy(false);
    if (result.error) setMessage(result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      {mine && (
        <div className="flex flex-col gap-3">
          <div
            role="status"
            className="flex min-h-[60px] items-center justify-center gap-2 rounded-2xl bg-white text-xl font-extrabold"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-[22px]"
            >
              <path d="M5 12l5 5 9-10" />
            </svg>
            {STATUS_LABEL[mine.status]}
          </div>
          <p className="text-sm leading-normal">
            {progressText(pet, mine, position)}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={cancelApplication}
            className="min-h-11 cursor-pointer self-start font-semibold underline disabled:opacity-60"
          >
            Cancel application
          </button>
        </div>
      )}

      {!mine && reason === "limit" && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled
            aria-describedby="limit-note"
            className="min-h-[60px] cursor-not-allowed rounded-2xl bg-[#E4DACB] text-xl font-extrabold text-muted"
          >
            Adopt Me
          </button>
          <p id="limit-note" className="text-sm leading-normal">
            You already have 3 active applications, so you can&apos;t apply for
            another pet yet. Cancel one, or wait for a shelter&apos;s decision,
            to adopt {pet.name}.
          </p>
          <Link
            to="/adoptions"
            className="flex min-h-11 items-center self-start font-semibold underline"
          >
            Go to My adoptions
          </Link>
        </div>
      )}

      {!mine && reason === null && (
        <button
          type="button"
          disabled={loading || Boolean(error)}
          onClick={() => setConfirmOpen(true)}
          className="min-h-[60px] cursor-pointer rounded-2xl bg-brand text-xl font-extrabold text-ink disabled:cursor-not-allowed disabled:bg-[#E4DACB] disabled:text-muted"
        >
          Adopt Me
        </button>
      )}

      {notice && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {notice}
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-[20px] bg-white px-4 py-3.5">
        <span className="text-sm font-extrabold">
          {used} of {MAX_ACTIVE_APPLICATIONS} adoption slots in use
        </span>
        <div
          aria-hidden="true"
          className="h-2 overflow-hidden rounded-full bg-field"
        >
          <div className="h-full bg-brand" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-[13px] leading-normal text-muted">
          You can have up to 3 active applications. Canceling, or a shelter
          declining, frees a slot.
        </span>
      </div>

      {confirmOpen && (
        <AdoptDialog
          pet={pet}
          busy={busy}
          onConfirm={confirmAdopt}
          onClose={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
