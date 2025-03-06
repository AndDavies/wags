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
// types/supabase.ts
export interface Policy {
  policy_id: number;
  country_id: number;
  pet_type: string;
  quarantine_required: boolean;
  vaccination_required: boolean;
  microchipping_required: boolean;
  import_permits_required: boolean;
  breed_restrictions?: string;
  effective_date?: string;
  last_verified?: string;
  notes?: string;
  source_references?: Record<string, unknown>; // e.g. { flag_local_path: string, ... }
  // Joined country data from the countries table:
  countries?: Array<{
    country_name: string;
    iso_code?: string;
    official_links?: Record<string, unknown>;
    additional_info?: Record<string, unknown>;
  }>;
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
