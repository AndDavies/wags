/**
 * Interface for a Hotel record (from your hotels table).
 */
export interface Hotel {
    id: number;
    hotel_chain: string;                // For now, used as the hotel name.
    country_scope?: string;             // May be a comma-separated list of countries.
    pet_fees?: string;
    weight_limits?: string;
    breed_restrictions?: string;
    max_pets_per_room?: string;
    types_of_pets_permitted?: string;
    required_documentation?: string;
    pet_friendly_amenities?: string;
    restrictions?: string;
    additional_notes?: string;
  }
  
  /**
   * Interface for an Airline record (from your airlines table).
   * Adjust these fields to match your actual airlines table schema.
   */
  export interface Airline {
    id: number;
    airline_name: string;
    country_scope?: string;
    pet_policy?: string;
    // Add other fields as needed.
  }
  
  /**
   * Database type that maps table names to their record types.
   */
  export type Database = {
    hotels: {
      Row: Hotel;
      Insert: Omit<Hotel, "id">;
      Update: Partial<Hotel>;
    };
    airlines: {
      Row: Airline;
      Insert: Omit<Airline, "id">;
      Update: Partial<Airline>;
    };
  };
  