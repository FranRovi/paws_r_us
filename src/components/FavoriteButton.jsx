import { useFavorites } from "../hooks/useFavorites";

const SIZES = {
  md: { button: "size-11", icon: "size-[22px]" },
  lg: { button: "size-[52px]", icon: "size-[26px]" },
};

export default function FavoriteButton({ pet, size = "md", className = "" }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(pet.id);
  const { button, icon } = SIZES[size];

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove ${pet.name} from favorites`
          : `Save ${pet.name} to favorites`
      }
      onClick={() => toggleFavorite(pet.id)}
      className={`flex cursor-pointer items-center justify-center rounded-full bg-white text-text ${button} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`${icon} ${saved ? "fill-brand" : "fill-none"}`}
      >
        <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" />
      </svg>
    </button>
  );
}
