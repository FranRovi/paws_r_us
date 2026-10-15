const AGE_OPTIONS = [
  { key: "baby", label: "Baby (under 1 year)" },
  { key: "young", label: "Young (1 to 3 years)" },
  { key: "adult", label: "Adult and senior" },
];

const DISTANCE_OPTIONS = [25, 50, 100];

function CheckRow({ label, checked, onChange }) {
  return (
    <label className="flex min-h-9 items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-brand"
      />
      {label}
    </label>
  );
}

export default function FilterPanel({ filters, onChange, onReset }) {
  return (
    <aside
      aria-label="Filters"
      className="flex w-[280px] shrink-0 flex-col gap-6 rounded-[32px] bg-white p-7"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] font-extrabold">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 font-semibold underline"
        >
          Reset
        </button>
      </div>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 font-extrabold">Species</legend>
        <CheckRow
          label="Dogs"
          checked={filters.dogs}
          onChange={(v) => onChange({ dogs: v })}
        />
        <CheckRow
          label="Cats"
          checked={filters.cats}
          onChange={(v) => onChange({ cats: v })}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 font-extrabold">Age</legend>
        {AGE_OPTIONS.map((opt) => (
          <CheckRow
            key={opt.key}
            label={opt.label}
            checked={filters[opt.key]}
            onChange={(v) => onChange({ [opt.key]: v })}
          />
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 font-extrabold">Distance</legend>
        {DISTANCE_OPTIONS.map((miles) => (
          <label key={miles} className="flex min-h-9 items-center gap-3">
            <input
              type="radio"
              name="distance"
              checked={filters.distance === miles}
              onChange={() => onChange({ distance: miles })}
              className="size-5 accent-brand"
            />
            Under {miles} miles
          </label>
        ))}
      </fieldset>
    </aside>
  );
}
