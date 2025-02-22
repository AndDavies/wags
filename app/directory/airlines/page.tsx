// app/directory/airlines/page.tsx
import React from "react";
import FilterSidebarAirlines from "@/components/FilterSidebarAirlines";
import DirectoryItemCard from "@/components/DirectoryItemCard";
import { getAirlines } from "@/lib/directory";

// Use the correct icon export from lucide-react.
import { Airplay } from "lucide-react";

export default async function AirlinesSearchPage() {
  const airlines = await getAirlines();
  const filterCounts = {
    countries: [
      { value: "USA", count: 10 },
      { value: "Canada", count: 5 },
      { value: "UK", count: 7 },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Airlines Search</h1>
      <div className="mb-4">
        <Airplay className="h-8 w-8 text-blue-500" />
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <FilterSidebarAirlines countries={filterCounts.countries} />
        <div className="flex-1 grid grid-cols-1 gap-4">
          {airlines.length === 0 ? (
            <p>No airlines found.</p>
          ) : (
            airlines.map((item) => (
              <DirectoryItemCard key={`${item.type}-${item.id}`} item={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
