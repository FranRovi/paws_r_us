export default function DemoVisitControls({ visit, title, busy, onChange }) {
  const complete = visit.status === "scheduled";
  const label = complete ? "Mark as completed" : "Undo completed";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed border-paw px-4 py-2 text-sm">
      <span className="font-semibold text-muted">
        Demo controls: play the shelter
      </span>
      <button
        type="button"
        disabled={busy}
        aria-label={`${label} (${title})`}
        onClick={() => onChange(visit.id, complete ? "completed" : "scheduled")}
        className="min-h-11 cursor-pointer rounded-xl bg-white px-4 font-semibold underline disabled:opacity-60"
      >
        {label}
      </button>
    </div>
  );
}