// app/create-trip/types.ts
export interface TripData {
    tripType: string[];
    travelers: { adults: number; children: number; pets: number };
    departure: string;
    destination: string;
    departurePlaceId: string;
    destinationPlaceId: string;
    destinationCountry: string;
    origin_vet: { name: string; address: string; phone: string }[];
    destination_vet: { name: string; address: string; phone: string }[];
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