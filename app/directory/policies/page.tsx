import { Suspense } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import CountriesList from "./CountriesList";
import { createClient } from "@/lib/supabase-server";

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

// Exported for use in route.ts and CountriesList.tsx
export type CountryData = {
  name: string;
  slug: string;
  flag: string;
  quarantine?: string | null;
};

async function CountriesData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pet_policies")
    .select("country_name, slug, flag_path, quarantine_info")
    .order("country_name", { ascending: true })
    .limit(12);

  const initialCountries: CountryData[] = (data ?? []).map((policy: any) => ({
    name: policy.country_name,
    slug: policy.slug,
    flag: policy.flag_path,
    quarantine: policy.quarantine_info,
  }));

  return <CountriesList initialCountries={initialCountries} />;
}

export default function PoliciesDirectoryPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="mt-20" />
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
      <DirectoryBreadcrumb currentCategory="policies" />
      <Suspense fallback={<div className="text-center text-xl">Loading countries...</div>}>
        <CountriesData />
      </Suspense>
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

export const revalidate = 300; // Cache for 5 minutes