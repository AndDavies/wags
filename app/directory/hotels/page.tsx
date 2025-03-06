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

export type HotelData = {
  id: number;
  hotel_chain: string;
  country_scope?: string;
  pet_fees?: string;
  weight_limits?: string;
  breed_restrictions?: string;
  max_pets_per_room?: string;
  types_of_pets_permitted?: string;
  required_documentation?: string;
  pet_friendly_amenities?: string;
  restrictions?: string;
  additional_notes?: string;
  last_updated?: string;
  slug: string;
  logo: string;
};

export default async function HotelsDirectoryPage() {
  const supabase = await createClient();

  // Query the hotels table and order by hotel_chain
  const { data: hotels, error } = await supabase
    .from("hotels")
    .select("*")
    .order("hotel_chain", { ascending: true });

  if (error) {
    console.error("Error fetching hotels:", error);
    throw new Error("Failed to fetch hotels");
  }

  const hotelsData: HotelData[] = hotels ?? [];

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
              key === "hotels" ? "text-brand-teal" : "text-offblack hover:text-brand-pink"
            }`}
          >
            {value.title}
          </Link>
        ))}
      </nav>

      {/* (Optional) Hotel Search Component – if implemented */}
      {/* <HotelSearch hotels={hotelsData} /> */}

      {/* Page Title Card */}
      <Card className="bg-brand-pink border-none shadow-md">
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex flex-row items-center space-x-4">
            <Hotel className="h-12 w-12 text-brand-teal" />
            <CardTitle className="text-4xl font-display text-brand-teal">
              Hotel Pet Policies
            </CardTitle>
          </div>
          <p className="text-offblack">
            Discover pet-friendly hotels and learn about their pet policies, fees, and restrictions.
          </p>
        </CardHeader>
      </Card>

      {/* Breadcrumb */}
      <DirectoryBreadcrumb currentCategory="hotels" />

      {/* Hotels Grid */}
      {hotelsData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {hotelsData.map((hotel) => (
            <Link
              key={hotel.id}
              href={`/directory/hotels/${hotel.slug}`}
              className="transition-transform hover:scale-105"
            >
              <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow">
                <div className="relative h-40 bg-gray-100">
                  <Image
                    src={hotel.logo}
                    alt={hotel.hotel_chain}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4 bg-white">
                  <h3 className="text-xl font-semibold text-brand-teal">{hotel.hotel_chain}</h3>
                  {hotel.country_scope && (
                    <p className="text-sm text-offblack">{hotel.country_scope}</p>
                  )}
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
        <p className="text-center text-xl text-offblack">No hotel data available.</p>
      )}

      {/* Call to Action */}
      <div className="text-center mt-16 p-8 bg-brand-pink rounded-2xl">
        <h2 className="text-3xl font-display text-brand-teal mb-4">
          Need Help Finding a Pet-Friendly Hotel?
        </h2>
        <p className="text-xl text-offblack mb-6 max-w-2xl mx-auto">
          Our team can help you navigate the best options for pet-friendly accommodations.
        </p>
        <Button asChild className="bg-brand-teal text-white hover:bg-white hover:text-brand-teal">
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
