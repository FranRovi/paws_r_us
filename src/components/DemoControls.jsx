const ACTIONS = [
  { status: "in_review", label: "Open meet and greet" },
  { status: "accepted", label: "Approve adoption" },
  { status: "rejected", label: "Decline" },
  { status: "pending", label: "Reset to under review" },
];

export default function DemoControls({ pet, application, busy, onChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border-2 border-dashed border-brown/40 bg-white/60 p-4">
      <p className="text-[13px] font-semibold text-brown">
        Demo controls: play the shelter
      </p>
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={busy || application.status === action.status}
            onClick={() => onChange(application.id, action.status)}
            aria-label={`${action.label} (${pet.name})`}
            className="min-h-11 cursor-pointer rounded-xl border-2 border-text bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
