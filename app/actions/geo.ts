"use server";

import { Country, State, City } from "country-state-city";

export interface GeoOption {
  label: string;
  value: string;
}

export async function getCountries(): Promise<GeoOption[]> {
  const countries = Country.getAllCountries();
  return countries.map((c) => ({
    label: c.name,
    value: c.isoCode,
  }));
}

export async function getStates(countryIso: string): Promise<GeoOption[]> {
  if (!countryIso) return [];
  const states = State.getStatesOfCountry(countryIso);
  if (!states) return [];
  return states.map((s) => ({
    label: s.name,
    value: s.isoCode,
  }));
}

export async function getCities(
  countryIso: string,
  stateIso?: string
): Promise<GeoOption[]> {
  if (!countryIso) return [];

  let cities;
  if (stateIso) {
    cities = City.getCitiesOfState(countryIso, stateIso);
  } else {
    // Fallback if no state selected (though UI should enforce it ideally, or loose listing)
    // Actually listing ALL cities of a country is too heavy usually, but we keep fallback logic.
    cities = City.getCitiesOfCountry(countryIso);
  }

  if (!cities) return [];

  // Deduplicate cities by name to avoid React "duplicate key" errors
  const uniqueNames = new Set<string>();
  const uniqueCities: GeoOption[] = [];

  for (const c of cities) {
    const name = c.name.trim(); // Normalize equality check
    if (!uniqueNames.has(name)) {
      uniqueNames.add(name);
      uniqueCities.push({
        label: c.name, // Keep original label
        value: c.name, // Use name as value
      });
    }
  }

  return uniqueCities;
}
