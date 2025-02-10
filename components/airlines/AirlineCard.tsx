// components/airlines/AirlineCard.tsx
import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

type Airline = {
  id: number;
  airline: string;
  country: string;
  pets_in_cabin: boolean;
  pets_in_cargo: boolean;
  crate_carrier_size_max: string;
  weight_limit: number;
  breed_restrictions: string;
  health_cert: string;
  fees_usd: number;
  additional_details: string;
};

type AirlineCardProps = {
  airline: Airline;
};

export default function AirlineCard({ airline }: AirlineCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <h2 className="text-xl font-semibold">{airline.airline}</h2>
      <p className="text-sm text-gray-500">{airline.country}</p>
      
      <div className="mt-2">
        <p className="text-sm">
          Pets in Cabin:{" "}
          {airline.pets_in_cabin ? (
            <span className="inline-flex items-center text-green-600">
              <CheckCircleIcon className="w-4 h-4 mr-1" /> Yes
            </span>
          ) : (
            <span className="inline-flex items-center text-red-600">
              <XCircleIcon className="w-4 h-4 mr-1" /> No
            </span>
          )}
        </p>
        <p className="text-sm">
          Pets in Cargo:{" "}
          {airline.pets_in_cargo ? (
            <span className="inline-flex items-center text-green-600">
              <CheckCircleIcon className="w-4 h-4 mr-1" /> Yes
            </span>
          ) : (
            <span className="inline-flex items-center text-red-600">
              <XCircleIcon className="w-4 h-4 mr-1" /> No
            </span>
          )}
        </p>
      </div>

      <p className="mt-2 text-sm">Fee: ${airline.fees_usd}</p>

      {airline.additional_details && (
        <p className="mt-2 text-sm text-gray-700">
          {airline.additional_details}
        </p>
      )}
    </div>
  );
}
