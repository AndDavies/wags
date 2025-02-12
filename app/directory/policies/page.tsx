import React from "react";
import { createClient } from "@/lib/supabase-server";
import PolicyList from "@/components/policies/PolicyList";
import type { Database } from "@/types/supabase";

/**
 * PoliciesPage Component
 *
 * Fetches policy data from Supabase and renders the PolicyList component.
 */
export default async function PoliciesPage() {
  const supabase = await createClient();

  // Use two generic parameters: first is the table name ('policies'), second is the row type.
  const { data: policies, error } = await supabase
    .from<"policies", Database["policies"]["Row"]>("policies")
    .select("*");

  if (error) {
    console.error("Error fetching policies:", error);
  }

  const policiesData = policies ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Country Policies on Pet Imports</h1>
      {error ? (
        <p className="text-red-600">Failed to load policy data.</p>
      ) : (
        <PolicyList policies={policiesData} />
      )}
    </div>
  );
}
