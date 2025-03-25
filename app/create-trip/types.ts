// app/create-trip/types.ts
export interface Vet {
  id: string;
  name: string;
  address: string;
  phone: string;
  location_type: "origin" | "destination" | "profile";
}

export interface TripData {
  tripType: string[];
  travelers: { adults: number; children: number; pets: number };
  pets: string[]; // Array of pet IDs from the pets table
  departure: string;
  destination: string;
  departurePlaceId: string;
  destinationPlaceId: string;
  destinationCountry: string;
  origin_vet_ids: string[]; // Array of vet IDs from the vets table
  destination_vet_ids: string[]; // Array of vet IDs from the vets table
  dates: { start: string | null; end: string | null };
  method: string;
  interests: string[];
}

export interface PetPolicy {
  country_name: string;
  entry_requirements: Array<{
    step: number;
    text: string;
    label: string;
  }>;
  additional_info: {
    pet_passport?: string;
  };
  external_links: Array<{
    url: string;
    title: string;
  }>;
  quarantine_info: string;
}