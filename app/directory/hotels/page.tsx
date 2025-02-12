// /pet-travel-hub/app/directory/hotels/page.tsx
import React from "react";
import { createClient } from "@/lib/supabase-server";
import HotelList from "@/components/hotels/HotelList";
import type { Database } from "@/types/supabase";

/**
 * HotelsPage Component
 *
 * This server component fetches hotel data from Supabase
 * and renders the HotelList component.
 */
export default async function HotelsPage() {
  const supabase = await createClient();

  // Fetch hotel data from the "hotels" table.
  // Note: The first generic argument is the table name ('hotels'),
  // and the second is the row type from our Database type.
  const { data: hotels, error } = await supabase
    .from<"hotels", Database["hotels"]["Row"]>("hotels")
    .select("*");

  if (error) {
    console.error("Error fetching hotels:", error);
  }

  const hotelsData = hotels ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pet-Friendly Hotels</h1>
      {error ? (
        <p className="text-red-600">Failed to load hotel data.</p>
      ) : (
        <HotelList hotels={hotelsData} />
      )}
    </div>
  );
}
