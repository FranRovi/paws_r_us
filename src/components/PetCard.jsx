import { Link } from "react-router-dom";
import { formatAge } from "../lib/pets";
import { petPhotoUrl } from "../lib/petPhoto";

const SPECIES_LABEL = { cat: "Cat", dog: "Dog" };

export default function PetCard({ pet }) {
  const photo = petPhotoUrl(pet.photo_path);
  const href = `/pets/${pet.id}`;

  return (
    <article className="relative flex flex-col gap-1 rounded-[28px] bg-cream p-3">
      <Link
        to={href}
        aria-label={`View ${pet.name}`}
        className="block h-[180px] overflow-hidden rounded-[20px] bg-paw/40"
      >
        {photo ? (
          <img
            src={photo}
            alt={`${pet.name}, ${pet.breed}`}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-16 fill-brown/40"
            >
              <ellipse cx="6" cy="10" rx="2" ry="2.6" />
              <ellipse cx="10" cy="5.5" rx="2" ry="2.8" />
              <ellipse cx="14" cy="5.5" rx="2" ry="2.8" />
              <ellipse cx="18" cy="10" rx="2" ry="2.6" />
              <path d="M12 11c-3 0-6 3.2-6 5.8 0 1.7 1.3 2.7 3 2.7 1.2 0 2-.5 3-.5s1.8.5 3 .5c1.7 0 3-1 3-2.7C18 14.2 15 11 12 11z" />
            </svg>
          </span>
        )}
      </Link>

      <Link to={href} className="flex flex-col gap-1 px-2 pb-2 pt-2.5">
        <span className="text-xl font-extrabold">{pet.name}</span>
        <span className="text-sm text-muted">
          {SPECIES_LABEL[pet.species]} · {pet.breed} ·{" "}
          {formatAge(pet.age_months)}
        </span>
        <span className="mt-1 text-sm text-muted">
          {pet.shelter.name} · {pet.shelter.distance_miles} mi
        </span>
      </Link>
    </article>
  );
}
