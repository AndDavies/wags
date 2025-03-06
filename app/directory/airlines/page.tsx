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
import { Airplay, Hotel, FileText, ChevronRight } from "lucide-react";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { createClient } from "@/lib/supabase-server";

// Disable caching so data is always fresh
export const revalidate = 0;

// Define a type for airline rows
export type AirlineData = {
  id: number;
  airline: string;
  slug: string;
  logo: string;
  country: string;
  fees_usd?: number | null;
  last_updated?: string;
};

// Airlines Directory Page Component
export default async function AirlinesDirectoryPage() {
  const supabase = await createClient();

  // Query the airlines table and order by airline name
  const { data: airlines, error } = await supabase
    .from("airlines")
    .select("*")
    .order("airline", { ascending: true });

  if (error) {
    console.error("Error fetching airlines:", error);
    throw new Error("Failed to fetch airlines");
  }

  const airlinesData: AirlineData[] = airlines ?? [];

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
              key === "airlines" ? "text-brand-teal" : "text-offblack hover:text-brand-pink"
            }`}
          >
            {value.title}
          </Link>
        ))}
      </nav>

      {/* (Optional) Inline Filter: For example, a simple search input */}
      <div className="mb-8 flex justify-center">
        <input
          type="text"
          placeholder="Search airlines..."
          className="p-2 border rounded-md border-brand-teal text-offblack"
        />
        <Button type="submit" className="ml-4 bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
          Search
        </Button>
      </div>

      {/* Page Title Card */}
      <Card className="bg-brand-pink border-none shadow-md">
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center space-x-4">
            <Airplay className="h-12 w-12 text-brand-teal" />
            <CardTitle className="text-4xl font-display text-brand-teal">
              Airline Directory
            </CardTitle>
          </div>
          <p className="text-offblack">
            Browse our directory of airlines. Click on an airline to view detailed information including their travel policies and fees.
          </p>
        </CardHeader>
      </Card>

      {/* Breadcrumb */}
      <DirectoryBreadcrumb currentCategory="airlines" />

      {/* Airlines Grid */}
      {airlinesData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {airlinesData.map((airline) => (
            <Link
              key={airline.id}
              href={`/directory/airlines/${airline.slug}`}
              className="transition-transform hover:scale-105"
            >
              <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow">
                <div className="relative h-40 bg-gray-100">
                  <Image
                    src={airline.logo}
                    alt={airline.airline}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4 bg-white">
                  <h3 className="text-xl font-semibold text-brand-teal">{airline.airline}</h3>
                  <p className="text-sm text-offblack">{airline.country}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 bg-white">
                  <Button variant="link" className="p-0 text-brand-teal hover:text-brand-pink">
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-xl text-offblack">No airline data available.</p>
      )}

      {/* Call to Action */}
      <div className="text-center mt-16 p-8 bg-brand-pink rounded-2xl">
        <h2 className="text-3xl font-display text-brand-teal mb-4">
          Need Help Planning Your Flight?
        </h2>
        <p className="text-xl text-offblack mb-6 max-w-2xl mx-auto">
          Our team can help you navigate the complex requirements for international air travel with pets.
        </p>
        <Button asChild className="bg-brand-teal text-white hover:bg-white hover:text-brand-teal">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
