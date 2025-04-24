import { Suspense } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import PolicyFilters from "@/components/directory/PolicyFilters";
import { createClient } from "@/lib/supabase-server";
import PoliciesClientWrapper from "./PoliciesClientWrapper";

// Explicitly force dynamic rendering for this page
export const dynamic = 'force-dynamic';

// Define and export PetPolicy and CountryData types
export type PetPolicy = {
  policy_id: number;
  country_name: string;
  slug: string;
  external_link: string | null;
  quarantine_info: string | null;
  entry_requirements: Record<string, string | undefined> | null;
  additional_info: Record<string, string | undefined> | null;
  external_links: { title: string; url: string }[] | null;
  flag_path: string;
  created_at: string;
  updated_at: string;
};

export type CountryData = {
  name: string;
  slug: string;
  flag_path: string; // Changed from "flag" to "flag_path"
  quarantine?: string | null;
};

/**
 * Fetches country data from Supabase based *only* on filter parameters (requirements).
 * The search term filtering will be handled on the client side.
 * @param requirements - An array of requirement IDs to filter by.
 * @returns A promise that resolves to an array of CountryData.
 */
async function getInitialCountriesByRequirements(
  requirements: string[]
): Promise<CountryData[]> {
  const supabase = await createClient();
  let query = supabase
    .from("pet_policies")
    .select("country_name, slug, flag_path, quarantine_info, entry_requirements") // Select necessary columns
    .order("country_name", { ascending: true });

  // Apply requirements filters only
  if (requirements.includes('no_quarantine')) {
    // Filter where quarantine_info is NULL, specifically 'None', or contains 'no quarantine' (case-insensitive)
    query = query.or('quarantine_info.is.null,quarantine_info.eq.None,quarantine_info.ilike.%no quarantine%');
  }

  if (requirements.includes('rabies_titer_test')) {
     // Filter where entry_requirements JSONB contains { "rabies_titer_test_required": "true" }
     // Adjust the key and value ('true') based on your actual JSON structure.
     // If it's a boolean true, use: .contains({ rabies_titer_test_required: true })
     query = query.contains('entry_requirements', { rabies_titer_test_required: 'true' });
  }

  // Fetch data
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching initial countries:", error);
    return []; // Return empty array on error
  }

  // Map Supabase data to CountryData type
  const countries: CountryData[] = (data ?? []).map((policy: any) => ({ // Using 'any' for simplicity, consider defining a stricter type
    name: policy.country_name,
    slug: policy.slug,
    flag_path: policy.flag_path,
    quarantine: policy.quarantine_info,
  }));

  return countries;
}

/**
 * Renders the main page for the Policies Directory.
 * Includes header, breadcrumbs, filter controls (server-rendered placeholder, actual controls in client wrapper),
 * and the list of countries wrapped in a client component for dynamic filtering.
 * This page is dynamically rendered due to the use of searchParams for filters.
 * @param searchParams - URL search parameters passed by Next.js.
 */
export default async function PoliciesDirectoryPage({
  searchParams,
}: {
  // Keep the type definition simple, the await handles the resolution
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Await searchParams before accessing properties, as required by Next.js dynamic APIs
  const resolvedSearchParams = await searchParams;

  // Extract requirement filters from resolved searchParams
  const requirementsRaw = resolvedSearchParams.req;
  const requirements = Array.isArray(requirementsRaw)
    ? (requirementsRaw as string[])
    : requirementsRaw
    ? [requirementsRaw as string]
    : [];

  // Fetch the initial list of countries based only on requirements
  const initialCountries = await getInitialCountriesByRequirements(requirements);

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8 max-w-7xl">
      {/* Header Section */}
      <div className="mt-16 md:mt-20" />
      <Card className="bg-teal-50 border border-teal-200 shadow-sm rounded-lg overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <FileText className="h-10 w-10 text-teal-600 flex-shrink-0" />
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight text-black font-sans">
                Country Pet Import Policies
              </CardTitle>
              <p className="mt-1 text-base text-gray-700 font-sans">
                Find specific requirements for bringing pets across borders. Select filters or search below.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Breadcrumbs */}
      <DirectoryBreadcrumb currentCategory="policies" />

      {/* Client Wrapper for Filters and List */}
      {/* Pass the initially fetched countries to the client wrapper */}
      <Suspense fallback={<div className="text-center text-lg text-gray-600 py-10">Loading filters and countries...</div>}>
        <PoliciesClientWrapper initialCountries={initialCountries} />
      </Suspense>

      {/* Contact Section */}
      <div className="mt-16 p-6 sm:p-8 bg-mustard-50 border border-mustard-200 rounded-lg text-center">
        <h2 className="text-2xl font-bold tracking-tight text-black font-sans mb-3">
          Need Help Planning Your Pet's Travel?
        </h2>
        <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto font-sans">
          Our team can help you navigate the complex requirements for international pet travel.
        </p>
        <Button
          asChild
          className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-2 rounded-lg font-medium text-base"
        >
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}

// Revalidate data periodically if needed, although filtering is now client-side
export const revalidate = 300; // Cache initial fetch for 5 minutes