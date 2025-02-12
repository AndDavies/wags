"use client";

import React from "react";
import type { Hotel } from "@/types/supabase";

interface HotelCardProps {
  hotel: Hotel;
}

/**
 * HotelCard Component
 *
 * Renders a card view for a single hotel record,
 * showing details like the hotel name, location, pet fees, and other relevant information.
 */
const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Display the hotel name (stored in hotel_chain) */}
      <h2 className="text-xl font-semibold">{hotel.hotel_chain}</h2>

      {/* Display location, if available */}
      {hotel.country_scope && (
        <p className="text-sm text-gray-500">Location: {hotel.country_scope}</p>
      )}

      {/* Display pet fee information */}
      {hotel.pet_fees && (
        <p className="text-sm">Pet Fees: {hotel.pet_fees}</p>
      )}

      {/* Display weight limits */}
      {hotel.weight_limits && (
        <p className="text-sm">Weight Limits: {hotel.weight_limits}</p>
      )}

      {/* Display breed restrictions */}
      {hotel.breed_restrictions && (
        <p className="text-sm">Breed Restrictions: {hotel.breed_restrictions}</p>
      )}

      {/* Display maximum pets per room */}
      {hotel.max_pets_per_room && (
        <p className="text-sm">Max Pets/Room: {hotel.max_pets_per_room}</p>
      )}

      {/* Display types of pets permitted */}
      {hotel.types_of_pets_permitted && (
        <p className="text-sm">Permitted Pets: {hotel.types_of_pets_permitted}</p>
      )}

      {/* Display required documentation */}
      {hotel.required_documentation && (
        <p className="text-sm">Required Docs: {hotel.required_documentation}</p>
      )}

      {/* Display pet-friendly amenities */}
      {hotel.pet_friendly_amenities && (
        <p className="text-sm">Amenities: {hotel.pet_friendly_amenities}</p>
      )}

      {/* Display other restrictions */}
      {hotel.restrictions && (
        <p className="text-sm">Restrictions: {hotel.restrictions}</p>
      )}

      {/* Display additional notes */}
      {hotel.additional_notes && (
        <p className="mt-2 text-sm text-gray-700">{hotel.additional_notes}</p>
      )}
    </div>
  );
};

export default HotelCard;
