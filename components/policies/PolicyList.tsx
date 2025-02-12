"use client";

import React, { useState, useMemo } from "react";
import type { Policy } from "@/types/supabase";
import PolicyCard from "./PolicyCard";

interface PolicyListProps {
  policies: Policy[];
}

/**
 * PolicyList Component
 *
 * Displays a list of policies with interactive filtering.
 */
const PolicyList: React.FC<PolicyListProps> = ({ policies }) => {
  // Local filtering state for country and pet type.
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchPetType, setSearchPetType] = useState<string>("");

  // Build a unique list of countries from the "country" field.
  const allCountries = useMemo(() => {
    const countriesSet = new Set<string>();
    policies.forEach((policy) => {
      if (policy.country) {
        policy.country.split(",").forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) countriesSet.add(trimmed);
        });
      }
    });
    return Array.from(countriesSet).sort();
  }, [policies]);

  // Filter policies based on selected country and pet type.
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      let matchesCountry = true;
      if (selectedCountry) {
        matchesCountry =
          policy.country
            .toLowerCase()
            .includes(selectedCountry.toLowerCase());
      }
      let matchesPetType = true;
      if (searchPetType) {
        // Use includes to handle multiple values or extra spaces.
        matchesPetType =
          policy.pet_type.toLowerCase().includes(searchPetType.toLowerCase());
      }
      return matchesCountry && matchesPetType;
    });
  }, [policies, selectedCountry, searchPetType]);

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        {/* Country Filter */}
        <div className="flex flex-col">
          <label htmlFor="policyCountryFilter" className="mb-1 text-sm font-medium text-gray-700">
            Filter by Country
          </label>
          <select
            id="policyCountryFilter"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Countries</option>
            {allCountries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Pet Type Filter */}
        <div className="flex flex-col">
          <label htmlFor="policyPetTypeFilter" className="mb-1 text-sm font-medium text-gray-700">
            Filter by Pet Type
          </label>
          <select
            id="policyPetTypeFilter"
            value={searchPetType}
            onChange={(e) => setSearchPetType(e.target.value)}
            className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Pet Types</option>
            <option value="Dog">Dog</option>
            <option value="Cat">Cat</option>
            <option value="Bird">Bird</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedCountry("");
              setSearchPetType("");
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Render Filtered Policies */}
      {filteredPolicies.length === 0 ? (
        <p className="text-gray-500">No policies match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => (
            <PolicyCard key={policy.id} policy={policy} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PolicyList;
