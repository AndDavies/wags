import { Suspense } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Airplay, Hotel, FileText } from "lucide-react"; // Add missing imports
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import AirlinesList from "./AirlinesList";
import { createClient } from "@/lib/supabase-server";

// Define and export AirlineData type
export type AirlineData = {
  airline: string;
  slug: string;
  logo: string;
  country: string | null;
  user_rating?: number | null;
};

async function AirlinesData() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("airline_pet_policies_sorted")
    .select("airline, slug, logo, country, user_rating")
    .limit(12);
  return <AirlinesList initialAirlines={data ?? []} />;
}

export default function AirlinesDirectoryPage() {
  return (
    <div className="container mx-auto p-4 space-y-8">
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
              key === "airlines"
                ? "text-brand-teal"
                : "text-offblack hover:text-brand-pink"
            }`}
          >
            {value.title}
          </Link>
        ))}
      </nav>

      <Card className="bg-brand-pink border-none shadow-md">
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center space-x-4">
            <Airplay className="h-12 w-12 text-brand-teal" />
            <CardTitle className="text-4xl font-display text-brand-teal">
              Airline Directory
            </CardTitle>
          </div>
          <p className="text-offblack">
            Browse our directory of airlines. Click on an airline to view
            detailed information including their travel policies and fees.
          </p>
        </CardHeader>
      </Card>

      <DirectoryBreadcrumb currentCategory="airlines" />

      <Suspense fallback={<div className="text-center text-xl">Loading airlines...</div>}>
        <AirlinesData />
      </Suspense>

        <div className="text-center mt-16 p-8 bg-brand-pink rounded-2xl">
          <h2 className="text-3xl font-display text-brand-teal mb-4">
            Need Help Planning Your Flight?
          </h2>
          <p className="text-xl text-offblack mb-6 max-w-2xl mx-auto">
            Our team can help you navigate the complex requirements for
            international air travel with pets.
          </p>
          <Button asChild className="bg-brand-teal text-white hover:bg-white hover:text-brand-teal">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
    </div>
  );
}

export const revalidate = 300; // Cache for 5 minutes