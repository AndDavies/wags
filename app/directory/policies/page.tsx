import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Airplay, Hotel, FileText } from "lucide-react";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { createClient } from "@/lib/supabase-server";
import CountrySearch from "@/components/CountrySearch";
import { CountriesGrid } from "@/components/CountriesGrid";

// Disable caching so data is always fresh.
export const revalidate = 0;

// Updated PetPolicy type to match the new schema
export type PetPolicy = {
  policy_id: number;
  country_name: string;
  slug: string;
  external_link: string | null;
  quarantine_info: string | null;
  entry_requirements: Record<string, string | undefined> | null; // jsonb
  additional_info: Record<string, string | undefined> | null; // jsonb
  external_links: { title: string; url: string }[] | null; // jsonb
  flag_path: string;
  created_at: string;
  updated_at: string;
};

// CountryData that our UI components expect
export type CountryData = {
  name: string;
  slug: string;
  flag: string;
  quarantine?: string | null; // Optional: add quarantine info for display
};

export default async function PoliciesDirectoryPage() {
  const supabase = await createClient();

  // Query all pet policies, ordering by country name
  const { data: policies, error } = await supabase
    .from("pet_policies")
    .select("*")
    .order("country_name", { ascending: true });

  if (error) {
    console.error("Error fetching pet policies:", error);
    throw new Error("Failed to fetch pet policies");
  }

  const policiesData: PetPolicy[] = policies ?? [];

  // Map each policy row to CountryData, adding quarantine info
  const countries: CountryData[] = policiesData.map((policy) => ({
    name: policy.country_name,
    slug: policy.slug,
    flag: policy.flag_path,
    quarantine: policy.quarantine_info, // Pass quarantine for filtering/display
  }));

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Spacer for fixed navbar */}
      <div className="mt-20" />

      {/* Directory Navigation Tabs */}
      <nav className="flex justify-center gap-8 mb-8">
        {Object.entries({
          airlines: { title: "Airlines", icon: Airplay },
          hotels: { title: "Hotels", icon: Hotel },
          policies: { title: "Policies", icon: FileText },
        }).map(([key, value]) => (
          <Link
            key={key}
            href={`/directory/${key}`}
            className={`text-xl font-bold ${
              key === "policies" ? "text-brand-teal" : "text-offblack hover:text-brand-pink"
            }`}
          >
            {value.title}
          </Link>
        ))}
      </nav>

      {/* Inline Country Search Filter */}
      <CountrySearch countries={countries} />

      {/* Page Title Card */}
      <Card className="bg-brand-pink border-none shadow-md">
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center space-x-4">
            <FileText className="h-12 w-12 text-brand-teal" />
            <CardTitle className="text-4xl font-display text-brand-teal">
              Country Import Policies
            </CardTitle>
          </div>
          <p className="text-offblack">
            Each country has specific requirements for bringing pets across their borders.
            Select a country to learn about vaccination requirements, quarantine periods,
            and necessary documentation.
          </p>
        </CardHeader>
      </Card>

      {/* Breadcrumb */}
      <DirectoryBreadcrumb currentCategory="policies" />

      {/* Countries Grid */}
      {countries.length > 0 ? (
        <CountriesGrid countries={countries} />
      ) : (
        <p className="text-center text-xl text-offblack">No pet policy data available.</p>
      )}

      {/* Call to Action */}
      <div className="text-center mt-16 p-8 bg-brand-pink rounded-2xl">
        <h2 className="text-3xl font-display text-brand-teal mb-4">
          Need Help Planning Your Pet's Travel?
        </h2>
        <p className="text-xl text-offblack mb-6 max-w-2xl mx-auto">
          Our team can help you navigate the complex requirements for international pet travel.
        </p>
        <Button asChild className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}