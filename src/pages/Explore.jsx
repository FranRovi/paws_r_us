import { useState } from "react";
import FilterPanel from "../components/FilterPanel";
import PetCard from "../components/PetCard";
import { usePets } from "../hooks/usePets";
import { DEFAULT_FILTERS, filterPets, sortPets } from "../lib/pets";

export default function Explore() {
  const { pets, loading, error } = usePets();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const update = (changes) =>
    setFilters((current) => ({ ...current, ...changes }));
  const shown = sortPets(filterPets(pets, filters), filters.sort);

  return (
    <div className="flex flex-wrap items-start gap-6">
      <FilterPanel
        filters={filters}
        onChange={update}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <section className="flex min-w-0 flex-[1_1_560px] flex-col gap-6 rounded-[40px] bg-white p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-[1_1_240px]">
            <h1 className="text-[38px] font-extrabold tracking-tight">
              Explore pets
            </h1>
            <p className="mt-1 text-base font-semibold italic text-muted">
              You can&apos;t buy love, but you can rescue it.
            </p>
          </div>

          <label className="flex h-[52px] w-[340px] max-w-full items-center gap-2.5 rounded-[14px] bg-field px-[18px] text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-5 shrink-0"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="sr-only">Search pets</span>
            <input
              type="search"
              value={filters.query}
              onChange={(e) => update({ query: e.target.value })}
              placeholder="Search by breed, name or shelter"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-text outline-none"
            />
          </label>
        </div>

        {loading && <p role="status">Loading pets…</p>}

        {error && (
          <p
            role="alert"
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          >
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-[15px] font-semibold text-muted">
                {shown.length === 1 ? "1 pet" : `${shown.length} pets`}
              </p>
              <label className="flex items-center gap-2 text-sm font-semibold">
                Sort by
                <select
                  value={filters.sort}
                  onChange={(e) => update({ sort: e.target.value })}
                  className="h-11 rounded-xl bg-field px-3.5"
                >
                  <option value="distance">Distance</option>
                  <option value="age">Age</option>
                </select>
              </label>
            </div>

            {shown.length > 0 ? (
              <div className="grid grid-cols-3 gap-5">
                {shown.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-[28px] bg-cream px-7 py-12 text-center">
                <p className="text-[22px] font-extrabold">
                  No pets match these filters
                </p>
                <p className="text-[15px] text-muted">
                  Try a wider distance or reset the filters.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
