import React from "react";
import { createClient } from "@/lib/supabase-server";
import AirlineList from "@/components/airlines/AirlineList";
import type { Database } from "@/types/supabase";

/**
 * AirlinesPage Component
 *
 * Fetches airline data from Supabase and renders the AirlineList component.
 */
export default async function AirlinesPage() {
  const supabase = await createClient();

  // Use two generic parameters:
  //  - First: the table name as a literal ('airlines')
  //  - Second: the row type from our Database type.
  const { data: airlines, error } = await supabase
    .from<"airlines", Database["airlines"]["Row"]>("airlines")
    .select("*");

  if (error) {
    console.error("Error fetching airlines:", error);
  }

  const airlinesData = airlines ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pet-Friendly Airlines</h1>
      {error ? (
        <p className="text-red-600">Failed to load airline data.</p>
      ) : (
        <AirlineList airlines={airlinesData} />
      )}
    </div>
  );
}
