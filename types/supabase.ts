/**
 * Define the interface for a Hotel record as stored in your Supabase "hotels" table.
 */
export interface Hotel {
    id: number;
    hotel_chain: string;                // Now used as the individual hotel name.
    country_scope?: string;             // Region or country where the hotel operates.
    pet_fees?: string;                  // Details about pet fees.
    weight_limits?: string;             // Weight limits for pets.
    breed_restrictions?: string;        // Any breed restrictions.
    max_pets_per_room?: string;         // Maximum pets allowed per room.
    types_of_pets_permitted?: string;   // Types of pets permitted.
    required_documentation?: string;    // Required documentation (e.g., vaccination records).
    pet_friendly_amenities?: string;     // Amenities provided for pets.
    restrictions?: string;              // Other restrictions.
    additional_notes?: string;          // Additional notes or comments.
  }
  
  /**
   * Define a Database type that maps table names to their record types.
   */
  export type Database = {
    hotels: {
      Row: Hotel;                 // The shape of a single hotel record.
      Insert: Omit<Hotel, 'id'>;    // For inserts, omit the auto-generated id.
      Update: Partial<Hotel>;       // For updates, every field is optional.
    };
    // You can add additional tables here as your project grows.
  };
  