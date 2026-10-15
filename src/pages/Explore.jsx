import PageCard from "../components/PageCard";
import PetCard from "../components/PetCard";
import { usePets } from "../hooks/usePets";
import { sortPets } from "../lib/pets";

export default function Explore() {
  const { pets, loading, error } = usePets();
  const shown = sortPets(pets, "distance");

  return (
    <PageCard className="flex flex-col gap-6">
      <div>
        <h1 className="text-[38px] font-extrabold tracking-tight">
          Explore pets
        </h1>
        <p className="mt-1 text-base font-semibold italic text-muted">
          You can&apos;t buy love, but you can rescue it.
        </p>
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
          <p className="text-[15px] font-semibold text-muted">
            {shown.length === 1 ? "1 pet" : `${shown.length} pets`}
          </p>
          <div className="grid grid-cols-3 gap-5">
            {shown.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        </>
      )}
    </PageCard>
  );
}
