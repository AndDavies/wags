"use client";

import React from "react";
import type { Policy as PolicyRow } from "@/types/supabase";

interface PolicyCardProps {
  policy: PolicyRow;
  // We now pass the resolved country name as a separate prop.
  countryName: string;
}

const PolicyCard: React.FC<PolicyCardProps> = ({ policy, countryName }) => {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-xl transition-shadow duration-300 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-1">{countryName}</h2>
      <p className="text-sm text-gray-600 mb-2">Pet Type: {policy.pet_type}</p>
      <div className="space-y-2 text-sm">
        {policy.medical_requirements && (
          <p>
            <strong>Medical Requirements:</strong> {policy.medical_requirements}
          </p>
        )}
        {policy.time_constraints && (
          <p>
            <strong>Time Constraints:</strong> {policy.time_constraints}
          </p>
        )}
        {policy.quarantine && (
          <p>
            <strong>Quarantine:</strong> {policy.quarantine}
          </p>
        )}
        {policy.fees && (
          <p>
            <strong>Fees:</strong> {policy.fees}
          </p>
        )}
        {policy.pet_passports && (
          <p>
            <strong>Pet Passports:</strong> {policy.pet_passports}
          </p>
        )}
        {policy.duration_of_stay && (
          <p>
            <strong>Duration of Stay:</strong> {policy.duration_of_stay}
          </p>
        )}
        {policy.aggregated_sources && (
          <p>
            <strong>Sources:</strong> {policy.aggregated_sources}
          </p>
        )}
      </div>
    </div>
  );
};

export default PolicyCard;
