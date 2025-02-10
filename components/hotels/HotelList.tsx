"use client";

import React, { useState, useMemo } from "react";
import type { Hotel } from "@/types/supabase"; // Centralized Hotel type
import HotelCard from "./HotelCard";

interface HotelListProps {
  hotels: Hotel[];
}

/**
 * HotelList Component
 *
 * Displays a list of hotels with interactive filtering.
 * - Filters by country (parsed from the country_scope field).
 * - Filters by hotel name (using the hotel_chain field).
 */
const HotelList: React.FC<HotelListProps> = ({ hotels }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  // Compute a unique list of countries by parsing the country_scope field.
  // We assume that country_scope may contain comma-separated country names.
  const allCountries = useMemo(() => {
    const countriesSet = new Set<string>();
    hotels.forEach((hotel) => {
      if (hotel.country_scope) {
        hotel.country_scope.split(",").forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) {
            countriesSet.add(trimmed);
          }
        });
      }
    });
    return Array.from(countriesSet).sort();
  }, [hotels]);

  // Filter hotels by selected country and hotel name search text.
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      // Check for country match.
      let matchesCountry = true;
      if (selectedCountry) {
        // Split country_scope into individual countries and check if any matches.
        matchesCountry = hotel.country_scope
          ?.split(",")
          .map((c) => c.trim().toLowerCase())
          .includes(selectedCountry.toLowerCase()) || false;
      }

      // Check for hotel chain (name) search.
      let matchesSearch = true;
      if (searchText) {
        matchesSearch = hotel.hotel_chain
          .toLowerCase()
          .includes(searchText.toLowerCase());
      }

      return matchesCountry && matchesSearch;
    });
  }, [hotels, selectedCountry, searchText]);

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

        {/* Search by Hotel Name */}
        <div className="flex flex-col">
          <label
            htmlFor="searchText"
            className="mb-1 text-sm font-medium text-gray-700"
          >
            Search by Hotel Name
          </label>
          <input
            id="searchText"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Enter hotel name..."
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

      {/* Render Filtered Hotels */}
      {filteredHotels.length === 0 ? (
        <p className="text-gray-500">No hotels match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HotelList;
