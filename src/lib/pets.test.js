import { describe, it, expect } from "vitest";
import {
  ageGroup,
  formatAge,
  filterPets,
  sortPets,
  DEFAULT_FILTERS,
} from "./pets";

const shelter = (name, distance_miles) => ({ name, distance_miles });

const pets = [
  {
    name: "Max",
    species: "cat",
    breed: "American Shorthair",
    age_months: 6,
    shelter: shelter("Heart Shelter", 2),
  },
  {
    name: "Rocky",
    species: "dog",
    breed: "Husky",
    age_months: 24,
    shelter: shelter("PetLove Rescue", 4),
  },
  {
    name: "Biscuit",
    species: "dog",
    breed: "Labrador mix",
    age_months: 84,
    shelter: shelter("Hillside Animal Haven", 38),
  },
  {
    name: "Simba",
    species: "cat",
    breed: "Siamese",
    age_months: 96,
    shelter: shelter("Riverbend Shelter", 72),
  },
];

const names = (list) => list.map((pet) => pet.name);
const filter = (overrides) =>
  names(filterPets(pets, { ...DEFAULT_FILTERS, ...overrides }));

describe("ageGroup", () => {
  it("splits ages at 1 year and 3 years", () => {
    expect(ageGroup(11)).toBe("baby");
    expect(ageGroup(12)).toBe("young");
    expect(ageGroup(36)).toBe("young");
    expect(ageGroup(37)).toBe("adult");
  });
});

describe("formatAge", () => {
  it("uses months under a year and whole years after", () => {
    expect(formatAge(1)).toBe("1 month");
    expect(formatAge(6)).toBe("6 months");
    expect(formatAge(12)).toBe("1 year");
    expect(formatAge(24)).toBe("2 years");
  });
});

describe("filterPets", () => {
  it("shows everything within 50 miles by default", () => {
    expect(filter({})).toEqual(["Max", "Rocky", "Biscuit"]);
  });

  it("filters by species", () => {
    expect(filter({ dogs: false })).toEqual(["Max"]);
    expect(filter({ cats: false })).toEqual(["Rocky", "Biscuit"]);
  });

  it("filters by age group, and shows all ages when none is ticked", () => {
    expect(filter({ young: true })).toEqual(["Rocky"]);
    expect(filter({ baby: true, adult: true })).toEqual(["Max", "Biscuit"]);
  });

  it("filters by distance", () => {
    expect(filter({ distance: 25 })).toEqual(["Max", "Rocky"]);
    expect(filter({ distance: 100 })).toEqual([
      "Max",
      "Rocky",
      "Biscuit",
      "Simba",
    ]);
  });

  it("searches name, breed, species and shelter, ignoring case", () => {
    expect(filter({ query: "HUSKY" })).toEqual(["Rocky"]);
    expect(filter({ query: "heart" })).toEqual(["Max"]);
    expect(filter({ distance: 100, query: "cat" })).toEqual(["Max", "Simba"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filter({ query: "zzz" })).toEqual([]);
  });
});

describe("sortPets", () => {
  it("sorts by distance, nearest first", () => {
    expect(names(sortPets([pets[2], pets[0], pets[1]], "distance"))).toEqual([
      "Max",
      "Rocky",
      "Biscuit",
    ]);
  });

  it("sorts by age, youngest first", () => {
    expect(names(sortPets([pets[3], pets[1], pets[0]], "age"))).toEqual([
      "Max",
      "Rocky",
      "Simba",
    ]);
  });

  it("does not change the original list", () => {
    const original = [pets[2], pets[0]];
    sortPets(original, "distance");
    expect(names(original)).toEqual(["Biscuit", "Max"]);
  });
});
