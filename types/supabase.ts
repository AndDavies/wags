/**
 * Interface for an Airline record (example from earlier)
 */
export interface Airline {
  id: number;
  airline: string;
  country?: string;
  pets_in_cabin: boolean;
  pets_in_cargo: boolean;
  crate_carrier_size_max?: string;
  weight_limit?: number;
  breed_restrictions?: string;
  health_cert?: string;
  fees_usd?: number;
  additional_details?: string;
}

/**
 * Interface for a Hotel record (example from earlier)
 */
export interface Hotel {
  id: number;
  hotel_chain: string;
  country_scope?: string;
  pet_fees?: string;
  weight_limits?: string;
  breed_restrictions?: string;
  max_pets_per_room?: string;
  types_of_pets_permitted?: string;
  required_documentation?: string;
  pet_friendly_amenities?: string;
  restrictions?: string;
  additional_notes?: string;
  last_updated?: string; // New column added to the hotels table
}

/**
 * Interface for a Policy record from your pet import policies table.
 *
 * Note: The joined country data is returned as an array.
 */
export interface Policy {
  id: number;
  country_id: number;
  pet_type: string;
  medical_requirements?: string;
  time_constraints?: string;
  quarantine?: string;
  fees?: string;
  pet_passports?: string;
  duration_of_stay?: string;
  aggregated_sources?: string;
  extra_details?: Record<string, unknown>;
  last_updated?: string;
  /** Joined country data as an array */
  countries?: {
    country_name: string;
  }[];
}

/**
 * The Database type maps table names to their record shapes.
 */
export type Database = {
  airlines: {
    Row: Airline;
    Insert: Omit<Airline, "id">;
    Update: Partial<Airline>;
  };
  hotels: {
    Row: Hotel;
    Insert: Omit<Hotel, "id">;
    Update: Partial<Hotel>;
  };
  pet_policies: {
    Row: Policy;
    Insert: Omit<Policy, "id">;
    Update: Partial<Policy>;
  };
};
