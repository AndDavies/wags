"use client";

import React, { useState, useMemo } from "react";
import type { Policy as PolicyRow } from "@/types/supabase";
// Note: Our returned policy rows now come from pet_policies, which do not have a "country" field;
// instead, the joined "countries" field holds the country information.
import PolicyCard from "./PolicyCard";

interface PolicyListProps {
  policies: PolicyRow[];
}

/**
 * Extracts a country name from a policy row.
 * The joined data from the countries table is assumed to be in a property "countries".
 * If present, it can be either an array (with at least one object having a "country_name" field)
 * or a single object.
 */
const getPolicyCountry = (policy: PolicyRow): string => {
  // We use a type-cast because our PolicyRow type does not include the join.
  const joined = (policy as any).countries;
  if (joined) {
    if (Array.isArray(joined)) {
      return (joined[0]?.country_name as string) || "Unknown";
    } else if (typeof joined === "object" && joined.country_name) {
      return joined.country_name as string;
    }
  }
  return "Unknown";
};

/**
 * PolicyList Component
 *
 * Displays a list of policies with interactive filtering.
 */
const PolicyList: React.FC<PolicyListProps> = ({ policies }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchPetType, setSearchPetType] = useState<string>("");

  // Build a unique list of countries from the joined "countries" data.
  const allCountries = useMemo(() => {
    const countriesSet = new Set<string>();
    policies.forEach((policy) => {
      const countryName = getPolicyCountry(policy).trim();
      if (countryName) countriesSet.add(countryName);
    });
    return Array.from(countriesSet).sort();
  }, [policies]);

  // Filter policies based on selected country and pet type.
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      let matchesCountry = true;
      if (selectedCountry) {
        const countryName = getPolicyCountry(policy).toLowerCase();
        matchesCountry = countryName.includes(selectedCountry.toLowerCase());
      }
      let matchesPetType = true;
      if (searchPetType) {
        matchesPetType = policy.pet_type.toLowerCase().includes(searchPetType.toLowerCase());
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
            <PolicyCard key={policy.id} policy={policy} countryName={getPolicyCountry(policy)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PolicyList;
