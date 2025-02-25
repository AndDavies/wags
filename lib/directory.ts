/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase-server";

// Define a type for extended select options including the "distinct" property.
type DistinctOptions = {
  distinct: boolean;
  head?: boolean;
  count?: "exact" | "planned" | "estimated";
};

export type DirectoryItem = {
  type: "airlines" | "pet_policies" | "hotels";
  id: number;
  name: string; // For airlines: airline name; for pet_policies: pet type; for hotels: hotel chain
  country?: string; // airlines.country, hotels.country_scope, or from pet_policies joined countries (undefined if not set)
  fee?: number | null;
  last_updated?: string;
  rating?: number; // if available
};

export async function getDirectoryItems(filters: {
  country?: string;
  pet_type?: string;
}): Promise<DirectoryItem[]> {
  const supabase = await createClient();

  // Query Airlines
  let airlinesQuery = supabase
    .from("airlines")
    .select("id, airline, country, fees_usd, last_updated");
  if (filters.country) {
    airlinesQuery = airlinesQuery.ilike("country", `%${filters.country}%`);
  }
  const { data: airlines, error: airlinesErr } = await airlinesQuery;
  if (airlinesErr) console.error("Error fetching airlines:", airlinesErr);
  const airlinesData = airlines || [];

  // Query Pet Policies (with joined country info)
  let petPolicyQuery = supabase
    .from("pet_policies")
    .select("id, pet_type, last_updated, countries(country_name)", { distinct: true } as unknown as DistinctOptions)
    .order("id", { ascending: true });
  if (filters.pet_type) {
    petPolicyQuery = petPolicyQuery.ilike("pet_type", `%${filters.pet_type}%`);
  }
  const { data: policies, error: policiesErr } = await petPolicyQuery;
  if (policiesErr) console.error("Error fetching pet policies:", policiesErr);
  const policiesData = policies || [];

  // Query Hotels
  let hotelQuery = supabase
    .from("hotels")
    .select("id, hotel_chain, country_scope, last_updated");
  if (filters.country) {
    hotelQuery = hotelQuery.ilike("country_scope", `%${filters.country}%`);
  }
  const { data: hotels, error: hotelsErr } = await hotelQuery;
  if (hotelsErr) console.error("Error fetching hotels:", hotelsErr);
  const hotelsData = hotels || [];

  // Combine results
  const unified: DirectoryItem[] = [];

  airlinesData.forEach((item: any) => {
    unified.push({
      type: "airlines",
      id: item.id,
      name: item.airline,
      country: item.country || undefined,
      fee: item.fees_usd,
      last_updated: item.last_updated,
    });
  });
  policiesData.forEach((item: any) => {
    unified.push({
      type: "pet_policies",
      id: item.id,
      name: item.pet_type,
      country:
        item.countries && Array.isArray(item.countries) && item.countries.length > 0
          ? item.countries[0].country_name
          : undefined,
      fee: null,
      last_updated: item.last_updated,
    });
  });
  hotelsData.forEach((item: any) => {
    unified.push({
      type: "hotels",
      id: item.id,
      name: item.hotel_chain,
      country: item.country_scope || undefined,
      fee: null,
      last_updated: item.last_updated,
    });
  });

  // Sort by last_updated descending
  unified.sort((a, b) => {
    const dateA = new Date(a.last_updated || 0).getTime();
    const dateB = new Date(b.last_updated || 0).getTime();
    return dateB - dateA;
  });

  return unified;
}

// Helper functions for each category now accept an optional filters parameter.
export async function getAirlines(filters: { country?: string } = {}): Promise<DirectoryItem[]> {
  const items = await getDirectoryItems(filters);
  return items.filter((item) => item.type === "airlines");
}

export async function getHotels(filters: { country?: string } = {}): Promise<DirectoryItem[]> {
  const items = await getDirectoryItems(filters);
  return items.filter((item) => item.type === "hotels");
}

export async function getPolicies(filters: { country?: string; pet_type?: string } = {}): Promise<DirectoryItem[]> {
  const items = await getDirectoryItems(filters);
  return items.filter((item) => item.type === "pet_policies");
}

// Returns unique countries from all three tables.
export async function getUniqueCountries(): Promise<{ value: string; count: number }[]> {
  const supabase = await createClient();
  
  const { data: airlinesData } = await supabase
    .from("airlines")
    .select("country", { distinct: true } as unknown as DistinctOptions)
    .neq("country", null);
  
  const { data: hotelsData } = await supabase
    .from("hotels")
    .select("country_scope", { distinct: true } as unknown as DistinctOptions)
    .neq("country_scope", null);
  
  const { data: policiesData } = await supabase
    .from("pet_policies")
    .select("countries(country_name)", { distinct: true } as unknown as DistinctOptions)
    .not("countries", "is", null);
  
  const countryMap = new Map<string, number>();
  if (airlinesData) {
    airlinesData.forEach((item: any) => {
      if (item.country) {
        countryMap.set(item.country, (countryMap.get(item.country) || 0) + 1);
      }
    });
  }
  if (hotelsData) {
    hotelsData.forEach((item: any) => {
      if (item.country_scope) {
        countryMap.set(item.country_scope, (countryMap.get(item.country_scope) || 0) + 1);
      }
    });
  }
  if (policiesData) {
    policiesData.forEach((item: any) => {
      if (item.countries && item.countries.length > 0) {
        const country = item.countries[0].country_name;
        if (country) {
          countryMap.set(country, (countryMap.get(country) || 0) + 1);
        }
      }
    });
  }
  return Array.from(countryMap.entries()).map(([value, count]) => ({ value, count }));
}

// Returns unique pet types from pet_policies table.
export async function getUniquePetTypes(): Promise<{ value: string; count: number }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pet_policies")
    .select("pet_type", { distinct: true } as unknown as DistinctOptions)
    .neq("pet_type", null);
  const petTypeMap = new Map<string, number>();
  if (data) {
    data.forEach((item: any) => {
      if (item.pet_type) {
        petTypeMap.set(item.pet_type, (petTypeMap.get(item.pet_type) || 0) + 1);
      }
    });
  }
  return Array.from(petTypeMap.entries()).map(([value, count]) => ({ value, count }));
}

export async function getFilterCounts(filters: { country?: string; pet_type?: string }): Promise<{
  countries: { value: string; count: number }[];
  pet_types: { value: string; count: number }[];
}> {
  const countries = await getUniqueCountries();
  const pet_types = await getUniquePetTypes();
  return { countries, pet_types };
}
