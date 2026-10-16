import { Link, useParams } from "react-router-dom";
import PawIcon from "../components/PawIcon";
import { usePet } from "../hooks/usePet";
import { formatAge } from "../lib/pets";
import { petPhotoUrl } from "../lib/petPhoto";
import FavoriteButton from "../components/FavoriteButton";
import AdoptPanel from "../components/AdoptPanel";
import { useApplications } from "../hooks/useApplications";
import { useWaitingList } from "../hooks/useWaitingList";

const SPECIES_LABEL = { cat: "Cat", dog: "Dog" };
const SEX_LABEL = { female: "Female", male: "Male" };

function BackLink() {
  return (
    <Link
      to="/explore"
      className="flex min-h-11 items-center gap-2 self-start font-semibold"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5"
      >
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      Back to results
    </Link>
  );
}

function EnergyLevel({ level }) {
  return (
    <span
      role="img"
      aria-label={`Energy level ${level} of 5`}
      className="flex gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <PawIcon
          key={n}
          className={`size-[22px] ${n <= level ? "fill-brand" : "fill-[#D9D2C7]"}`}
        />
      ))}
    </span>
  );
}

function Stat({ label, children }) {
  return (
    <div className="flex flex-col gap-1 rounded-[18px] bg-cream px-[18px] py-3">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="font-extrabold">{children}</span>
    </div>
  );
}

function waitingText(count) {
  if (count === 0) return "No one yet";
  return count === 1 ? "1 person" : `${count} people`;
}

export default function PetDetail() {
  const { id } = useParams();
  const { pet, loading, error } = usePet(id);
  const { applications } = useApplications();
  const { list: waitingList, loading: waitingLoading } = useWaitingList(
    id,
    applications,
  );

  const shell = "flex flex-col gap-5 rounded-[40px] bg-white px-8 pb-10 pt-6";

  if (loading) {
    return (
      <section className={shell}>
        <BackLink />
        <p role="status">Loading pet…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={shell}>
        <BackLink />
        <p
          role="alert"
          className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {error}
        </p>
      </section>
    );
  }

  if (!pet) {
    return (
      <section className={shell}>
        <BackLink />
        <h1 className="text-[32px] font-extrabold">
          We couldn&apos;t find this pet
        </h1>
        <p className="text-muted">
          It may have been adopted, or the link may be wrong.
        </p>
      </section>
    );
  }

  const photo = petPhotoUrl(pet.photo_path);
  const steps = [
    { title: "Apply", text: `You join ${pet.name}'s waiting list.` },
    { title: "Meet and greet", text: "The shelter meets you in person." },
    { title: "Home visit", text: "The shelter checks the home is a fit." },
    { title: "Decision", text: "The shelter confirms or declines." },
  ];

  return (
    <section className={shell}>
      <BackLink />

      <div className="relative flex h-[360px] items-end overflow-hidden rounded-[32px] bg-paw/40 p-6">
        {photo ? (
          <img
            src={photo}
            alt={`${pet.name}, ${pet.breed}`}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <PawIcon className="size-24 fill-brown/40" />
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <article
          aria-label={`About ${pet.name}`}
          className="flex min-w-0 flex-[1_1_420px] flex-col gap-5"
        >
          <div>
            <h1 className="text-[44px] font-extrabold tracking-tight">
              {pet.name}
            </h1>
            <p className="mt-1 text-base text-muted">
              {SPECIES_LABEL[pet.species]} · {pet.breed} ·{" "}
              {formatAge(pet.age_months)} · {SEX_LABEL[pet.sex]} ·{" "}
              {pet.shelter.city}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Stat label="Energy level">
              <EnergyLevel level={pet.energy} />
            </Stat>
            <Stat label="Waiting list">
              {waitingLoading ? "…" : waitingText(waitingList.length)}
            </Stat>
            <Stat label="Visits needed">2 (meet and home)</Stat>
          </div>

          <h2 className="mt-2 text-[22px] font-extrabold">Introduction</h2>
          <p className="text-base leading-relaxed text-[#3A3A3A]">
            {pet.intro}
          </p>

          <h2 className="mt-2 text-[22px] font-extrabold">Adoption process</h2>
          <ol className="grid grid-cols-2 gap-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex items-start gap-3 rounded-[20px] bg-cream px-4 py-3.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand font-extrabold">
                  {index + 1}
                </span>
                <span className="text-[15px] leading-normal">
                  <b>{step.title}</b>
                  <br />
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        </article>

        <aside
          aria-label={`Adopt ${pet.name}`}
          className="flex w-[340px] shrink-0 flex-col gap-4 rounded-[32px] bg-cream p-7"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xl font-extrabold">{pet.shelter.name}</span>
            {pet.shelter.phone && (
              <a
                href={`tel:${pet.shelter.phone}`}
                className="text-sm text-muted underline"
              >
                {pet.shelter.phone}
              </a>
            )}
            {pet.shelter.email && (
              <a
                href={`mailto:${pet.shelter.email}`}
                className="text-sm text-muted underline"
              >
                {pet.shelter.email}
              </a>
            )}
          </div>
        </aside>
        <AdoptPanel pet={pet} waitingList={waitingList} />
        {pet.photo_credit && (
          <span className="relative rounded-full bg-white/85 px-3.5 py-1.5 text-[13px]">
            {pet.photo_credit}
          </span>
        )}
        <FavoriteButton
          pet={pet}
          size="lg"
          className="absolute right-5 top-5"
        />
      </div>
    </section>
  );
}
