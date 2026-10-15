export const DEFAULT_FILTERS = {
  dogs: true,
  cats: true,
  baby: false,
  young: false,
  adult: false,
  distance: 50,
  query: "",
  sort: "distance",
};

// Baby: under 1 year. Young: 1 to 3 years. Adult and senior: older than 3.
export function ageGroup(ageMonths) {
  if (ageMonths < 12) return "baby";
  if (ageMonths <= 36) return "young";
  return "adult";
}

export function formatAge(ageMonths) {
  if (ageMonths < 12)
    return ageMonths === 1 ? "1 month" : `${ageMonths} months`;
  const years = Math.floor(ageMonths / 12);
  return years === 1 ? "1 year" : `${years} years`;
}

// With no age box ticked, every age is shown (same as the design).
export function filterPets(pets, filters) {
  const anyAge = filters.baby || filters.young || filters.adult;
  const query = filters.query.trim().toLowerCase();

  return pets.filter((pet) => {
    if (pet.species === "dog" ? !filters.dogs : !filters.cats) return false;
    if (anyAge && !filters[ageGroup(pet.age_months)]) return false;
    if (pet.shelter.distance_miles > filters.distance) return false;

    if (query) {
      const text =
        `${pet.name} ${pet.breed} ${pet.species} ${pet.shelter.name}`.toLowerCase();
      if (!text.includes(query)) return false;
    }
    return true;
  });
}

// Returns a new array. Ties are broken by name so the order is always the same.
export function sortPets(pets, sort) {
  const byName = (a, b) => a.name.localeCompare(b.name);
  const copy = [...pets];

  if (sort === "age") {
    return copy.sort((a, b) => a.age_months - b.age_months || byName(a, b));
  }
  return copy.sort(
    (a, b) =>
      a.shelter.distance_miles - b.shelter.distance_miles || byName(a, b),
  );
}
