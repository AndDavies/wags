"use client";

import React, { useState, useMemo } from "react";
import type { Hotel } from "@/types/supabase";
import HotelCard from "./HotelCard";

interface HotelListProps {
  hotels: Hotel[];
}

/**
 * HotelList Component
 *
 * Displays a list of hotels with filtering capabilities:
 * - Filter by country (parsed from the country_scope field)
 * - Search by hotel name (using the hotel_chain field)
 */
const HotelList: React.FC<HotelListProps> = ({ hotels }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  // Create a unique list of countries from the country_scope field.
  // If country_scope contains a comma-separated list, split and trim it.
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

  // Filter hotels based on selected country and hotel name search.
  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      let matchesCountry = true;
      if (selectedCountry) {
        // Handle comma-separated country_scope values.
        matchesCountry =
          hotel.country_scope
            ?.split(",")
            .map((c) => c.trim().toLowerCase())
            .includes(selectedCountry.toLowerCase()) || false;
      }
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
      {/* Filtering Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
        {/* Country Filter Dropdown */}
        <div className="flex flex-col">
          <label htmlFor="countryFilter" className="mb-1 text-sm font-medium text-gray-700">
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

        {/* Search by Hotel Name Input */}
        <div className="flex flex-col">
          <label htmlFor="searchText" className="mb-1 text-sm font-medium text-gray-700">
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

        {/* Reset Filters Button */}
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

      {/* Render the Filtered Hotels */}
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
