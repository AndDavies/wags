"use client";

import React from "react";
import type { Airline } from "@/types/supabase";

interface AirlineCardProps {
  airline: Airline;
}

/**
 * AirlineCard Component
 *
 * Renders a card view for a single airline.
 */
const AirlineCard: React.FC<AirlineCardProps> = ({ airline }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-semibold">{airline.airline_name}</h2>
      {airline.country_scope && (
        <p className="text-sm text-gray-500">Country: {airline.country_scope}</p>
      )}
      {airline.pet_policy && (
        <p className="text-sm">Pet Policy: {airline.pet_policy}</p>
      )}
      {/* Add additional fields as needed */}
    </div>
  );
};

export default AirlineCard;
