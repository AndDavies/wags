"use client";

import React from "react";
import type { Airline } from "@/types/supabase";

interface AirlineCardProps {
  airline: Airline;
}

/**
 * AirlineCard Component
 *
 * Renders a card view for a single airline record.
 */
const AirlineCard: React.FC<AirlineCardProps> = ({ airline }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Display the airline's name */}
      <h2 className="text-xl font-semibold">{airline.airline}</h2>

      {/* Display the country if available */}
      {airline.country && (
        <p className="text-sm text-gray-500">Country: {airline.country}</p>
      )}

      {/* Display pets allowed information */}
      <p className="text-sm">
        Pets in Cabin: {airline.pets_in_cabin ? "Yes" : "No"}
      </p>
      <p className="text-sm">
        Pets in Cargo: {airline.pets_in_cargo ? "Yes" : "No"}
      </p>

      {/* Optionally display fees if available */}
      {airline.fees_usd !== null && airline.fees_usd !== undefined && (
        <p className="text-sm">Fee (USD): ${airline.fees_usd}</p>
      )}

      {/* Display additional details */}
      {airline.additional_details && (
        <p className="mt-2 text-sm text-gray-700">
          {airline.additional_details}
        </p>
      )}
    </div>
  );
};

export default AirlineCard;
