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
import AirlinesList from "./AirlinesList";

export const revalidate = 0;

export type AirlineData = {
  airline: string;
  slug: string;
  logo: string;
  country: string | null;
  fees_usd?: number | null;
  last_updated?: string | null;
  user_rating?: number | null;
};

export default async function AirlinesDirectoryPage() {
  const supabase = await createClient();
  const initialItemsPerPage = 12;

  // Fetch initial page from the sorted view
  const { data: initialAirlines, error } = await supabase
    .from("airline_pet_policies_sorted")
    .select("airline, slug, logo, country, fees_usd, last_updated, user_rating")
    .limit(initialItemsPerPage);

  if (error) {
    console.error("Error fetching initial airlines:", error);
    throw new Error("Failed to fetch airlines");
  }

  const airlinesData: AirlineData[] = initialAirlines ?? [];
  console.log("Initial airlines:", airlinesData);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="mt-20" />
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

      <div className="mb-8 flex justify-center">
        <input
          type="text"
          placeholder="Search airlines..."
          className="p-2 border rounded-md border-brand-teal text-offblack"
        />
        <Button
          type="submit"
          className="ml-4 bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack"
        >
          Search
        </Button>
      </div>

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

      <AirlinesList initialAirlines={airlinesData} />

      <div className="text-center mt-16 p-8 bg-brand-pink rounded-2xl">
        <h2 className="text-3xl font-display text-brand-teal mb-4">
          Need Help Planning Your Flight?
        </h2>
        <p className="text-xl text-offblack mb-6 max-w-2xl mx-auto">
          Our team can help you navigate the complex requirements for
          international air travel with pets.
        </p>
        <Button
          asChild
          className="bg-brand-teal text-white hover:bg-white hover:text-brand-teal"
        >
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}