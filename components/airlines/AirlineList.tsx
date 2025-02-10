"use client";

import React, { useState, useMemo } from "react";
import type { Airline } from "@/types/supabase";
import AirlineCard from "./AirlineCard";

interface AirlineListProps {
  airlines: Airline[];
}

/**
 * AirlineList Component
 *
 * Displays a list of airlines with filters for country and airline name.
 */
const AirlineList: React.FC<AirlineListProps> = ({ airlines }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  // Compute a unique list of countries from the country_scope field.
  const allCountries = useMemo(() => {
    const countriesSet = new Set<string>();
    airlines.forEach((airline) => {
      if (airline.country_scope) {
        airline.country_scope.split(",").forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) countriesSet.add(trimmed);
        });
      }
    });
    return Array.from(countriesSet).sort();
  }, [airlines]);

  // Filter airlines by selected country and search text.
  const filteredAirlines = useMemo(() => {
    return airlines.filter((airline) => {
      let matchesCountry = true;
      if (selectedCountry) {
        matchesCountry =
          airline.country_scope
            ?.split(",")
            .map((c) => c.trim().toLowerCase())
            .includes(selectedCountry.toLowerCase()) || false;
      }

      let matchesSearch = true;
      if (searchText) {
        matchesSearch = airline.airline_name
          .toLowerCase()
          .includes(searchText.toLowerCase());
      }
      return matchesCountry && matchesSearch;
    });
  }, [airlines, selectedCountry, searchText]);

  return (
    <div>
      {/* Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        {/* Country Filter */}
        <div className="flex flex-col">
          <label
            htmlFor="countryFilter"
            className="mb-1 text-sm font-medium text-gray-700"
          >
            Filter by Country
          </label>
          <select
            id="countryFilter"
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

        {/* Search by Airline Name */}
        <div className="flex flex-col">
          <label
            htmlFor="searchText"
            className="mb-1 text-sm font-medium text-gray-700"
          >
            Search by Airline Name
          </label>
          <input
            id="searchText"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter airline name..."
            className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedCountry("");
              setSearchText("");
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Render Filtered Airlines */}
      {filteredAirlines.length === 0 ? (
        <p className="text-gray-500">No airlines match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredAirlines.map((airline) => (
            <AirlineCard key={airline.id} airline={airline} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AirlineList;
