"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CountryData } from "@/app/directory/policies/page";

interface CountrySearchProps {
  countries: CountryData[];
}

export default function CountrySearch({ countries }: CountrySearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCountries, setFilteredCountries] = useState<CountryData[]>(countries);

  useEffect(() => {
    setFilteredCountries(
      countries.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, countries]);

  return (
    <div className="mb-8 flex flex-col items-center">
      <input
        type="text"
        placeholder="Search Countries..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="p-2 border rounded-md border-brand-teal text-offblack mb-4 w-full max-w-md"
      />
      <div className="flex flex-wrap gap-2">
        {filteredCountries.map((country) => (
          <Link
            key={country.slug}
            href={`/directory/policies/${country.slug}`}
            className="px-4 py-2 bg-white border rounded-md text-brand-teal hover:bg-brand-pink hover:text-offblack transition-colors"
          >
            {country.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
