"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function DirectoryFilter() {
  // useParams returns the dynamic segments for the current route.
  // In a route like /directory/airlines/country/USA, useParams() might return:
  // { params: ["country", "USA"] }
  const params = useParams<{ params?: string[] }>();
  const router = useRouter();

  // Extract a country filter (if present)
  const segments = params?.params || [];
  const initialCountry = segments[0] === "country" ? segments[1] || "" : "";
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);

  useEffect(() => {
    // Update state if the URL changes externally.
    if (segments[0] === "country") {
      setSelectedCountry(segments[1] || "");
    } else {
      setSelectedCountry("");
    }
  }, [segments]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCountry(value);
    // Build the new URL based on the filter.
    // If a country is selected, the URL becomes /directory/airlines/country/USA.
    // Otherwise, it reverts to /directory/airlines.
    const newPath = value
      ? `/directory/airlines/country/${encodeURIComponent(value)}`
      : "/directory/airlines";
    router.push(newPath);
  };

  return (
    <div className="mb-8 flex justify-center">
      <select
        value={selectedCountry}
        onChange={handleChange}
        className="p-2 border rounded-md"
      >
        <option value="">All Countries</option>
        {/* Hard-coded options; ideally, you would pass these in as props */}
        <option value="USA">USA</option>
        <option value="Canada">Canada</option>
        <option value="UK">UK</option>
      </select>
    </div>
  );
}
