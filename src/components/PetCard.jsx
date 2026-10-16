import { Link } from "react-router-dom";
import { useApplications } from "../hooks/useApplications";
import { activeApplicationFor } from "../lib/applications";
import { formatAge } from "../lib/pets";
import { petPhotoUrl } from "../lib/petPhoto";
import FavoriteButton from "./FavoriteButton";
import PawIcon from "./PawIcon";

const SPECIES_LABEL = { cat: "Cat", dog: "Dog" };

export default function PetCard({ pet }) {
  const { applications } = useApplications();
  const applied = Boolean(activeApplicationFor(applications, pet.id));
  const photo = petPhotoUrl(pet.photo_path);
  const href = `/pets/${pet.id}`;

  return (
    <article
      className={`relative flex flex-col gap-1 rounded-[28px] p-3 ${applied ? "bg-field" : "bg-cream"}`}
    >
      <Link
        to={href}
        aria-label={
          applied ? `View ${pet.name}, application sent` : `View ${pet.name}`
        }
        className="relative block h-[180px] overflow-hidden rounded-[20px] bg-paw/40"
      >
        {photo ? (
          <img
            src={photo}
            alt={`${pet.name}, ${pet.breed}`}
            loading="lazy"
            className={`size-full object-cover ${applied ? "opacity-60 grayscale" : ""}`}
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <PawIcon className="size-16 fill-brown/40" />
          </span>
        )}
        {applied && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold">
            Application sent
          </span>
        )}
      </Link>

      <FavoriteButton pet={pet} className="absolute right-[22px] top-[22px]" />

      <Link to={href} className="flex flex-col gap-1 px-2 pb-2 pt-2.5">
        <span
          className={`text-xl font-extrabold ${applied ? "text-muted" : ""}`}
        >
          {pet.name}
        </span>
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
