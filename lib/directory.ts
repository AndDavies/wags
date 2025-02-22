// lib/directory.ts
import { createClient } from "@/lib/supabase-server";

export type DirectoryItem = {
  type: "airlines" | "pet_policies" | "hotels";
  id: number;
  name: string; // For airlines: airline name; for pet_policies: pet type; for hotels: hotel chain
  country?: string; // airlines.country, hotels.country_scope, or from pet_policies joined countries
  fee?: number | null;
  last_updated?: string;
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
  if (airlinesErr) {
    console.error("Error fetching airlines:", airlinesErr);
  }
  const airlinesData = airlines || [];

  // Query Pet Policies (with joined country info)
  let petPolicyQuery = supabase
    .from("pet_policies")
    .select("id, pet_type, last_updated, countries(country_name)")
    .order("id", { ascending: true });
  if (filters.pet_type) {
    petPolicyQuery = petPolicyQuery.ilike("pet_type", `%${filters.pet_type}%`);
  }
  const { data: policies, error: policiesErr } = await petPolicyQuery;
  if (policiesErr) {
    console.error("Error fetching pet policies:", policiesErr);
  }
  const policiesData = policies || [];

  // Query Hotels
  let hotelQuery = supabase
    .from("hotels")
    .select("id, hotel_chain, country_scope, last_updated");
  if (filters.country) {
    hotelQuery = hotelQuery.ilike("country_scope", `%${filters.country}%`);
  }
  const { data: hotels, error: hotelsErr } = await hotelQuery;
  if (hotelsErr) {
    console.error("Error fetching hotels:", hotelsErr);
  }
  const hotelsData = hotels || [];

  // Process results to produce a unified array
  const unified: DirectoryItem[] = [];

  airlinesData.forEach((item) => {
    unified.push({
      type: "airlines",
      id: item.id,
      name: item.airline,
      country: item.country,
      fee: item.fees_usd,
      last_updated: item.last_updated,
    });
  });
  policiesData.forEach((item) => {
    unified.push({
      type: "pet_policies",
      id: item.id,
      name: item.pet_type,
      country:
        item.countries && Array.isArray(item.countries) && item.countries.length > 0
          ? item.countries[0].country_name
          : null,
      fee: null,
      last_updated: item.last_updated,
    });
  });
  hotelsData.forEach((item) => {
    unified.push({
      type: "hotels",
      id: item.id,
      name: item.hotel_chain,
      country: item.country_scope,
      fee: null,
      last_updated: item.last_updated,
    });
  });

  // Sort by last_updated descending (newest first)
  unified.sort((a, b) => {
    const dateA = new Date(a.last_updated || 0).getTime();
    const dateB = new Date(b.last_updated || 0).getTime();
    return dateB - dateA;
  });

  return unified;
}

// New helper: getAirlines returns only airline items.
export async function getAirlines(): Promise<DirectoryItem[]> {
  const items = await getDirectoryItems({});
  return items.filter((item) => item.type === "airlines");
}

// Dummy getFilterCounts function. Replace with real aggregations as needed.
export async function getFilterCounts(filters: {
  country?: string;
  pet_type?: string;
}) {
  return {
    countries: [
      { value: "USA", count: 10 },
      { value: "Canada", count: 5 },
      { value: "UK", count: 7 },
    ],
    pet_types: [
      { value: "Dog", count: 8 },
      { value: "Cat", count: 4 },
      { value: "Bird", count: 3 },
      { value: "Other", count: 2 },
    ],
  };
}
