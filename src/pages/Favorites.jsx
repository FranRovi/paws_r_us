import { Link } from "react-router-dom";
import PageCard from "../components/PageCard";
import PetCard from "../components/PetCard";
import { useFavorites } from "../hooks/useFavorites";
import { usePets } from "../hooks/usePets";
import { sortPets } from "../lib/pets";

export default function Favorites() {
  const { pets, loading: petsLoading, error } = usePets();
  const { isFavorite, loading: favoritesLoading } = useFavorites();

  const loading = petsLoading || favoritesLoading;
  const saved = sortPets(
    pets.filter((pet) => isFavorite(pet.id)),
    "distance",
  );
  const count = saved.length === 1 ? "1 pet" : `${saved.length} pets`;

  return (
    <PageCard className="flex min-h-[640px] flex-col gap-6">
      <div>
        <h1 className="text-[40px] font-extrabold tracking-tight">
          My favorites
        </h1>
        {!loading && !error && (
          <p className="mt-1.5 text-base text-muted">
            {`${count} saved. Tap the heart to remove one.`}
          </p>
        )}
      </div>

      {loading && <p role="status">Loading favorites…</p>}

      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {error}
        </p>
      )}

      {!loading && !error && saved.length > 0 && (
        <div className="grid grid-cols-4 gap-5">
          {saved.map((pet) => (
            <PetCard key={pet.id} pet={pet} />
          ))}
        </div>
      )}

      {!loading && !error && saved.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-[32px] bg-cream px-7 py-16 text-center">
          <p className="text-2xl font-extrabold">No favorites yet</p>
          <p className="text-base text-muted">
            Save pets you like and they will show up here.
          </p>
          <Link
            to="/explore"
            className="mt-2 flex min-h-14 items-center rounded-2xl bg-brand px-8 text-lg font-extrabold text-ink"
          >
            Browse pets
          </Link>
        </div>
      )}
    </PageCard>
  );
}
