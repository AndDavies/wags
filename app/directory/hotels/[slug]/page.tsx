import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  ExternalLink,
  Info,
  AlertTriangle,
  DollarSign,
  Clock,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { createClient } from "@/lib/supabase-server";

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

export default async function HotelDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const supabase = await createClient();

  // Query the hotel record by slug
  const { data: hotel, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !hotel) {
    console.error("Error fetching hotel data:", error);
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-center text-xl">Hotel data not found.</p>
      </div>
    );
  }

  // Build breadcrumb extra items – the hotel name
  const extraBreadcrumbs = [{ label: hotel.hotel_chain }];

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Spacer for fixed navbar */}
      <div className="mt-20" />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <DirectoryBreadcrumb currentCategory="hotels" extraItems={extraBreadcrumbs} />

        {/* Hotel Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-brand-pink rounded-xl p-6 shadow-md">
          <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden rounded-lg shadow-lg">
            <Image src={hotel.logo} alt={`${hotel.hotel_chain} logo`} fill className="object-cover" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display text-brand-teal mb-2">{hotel.hotel_chain}</h1>
            {hotel.country_scope && (
              <p className="text-xl text-offblack mb-4">{hotel.country_scope}</p>
            )}
          </div>
        </div>

        {/* Hotel Policy Details */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-brand-teal text-white">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <CardTitle>Hotel Pet Policy Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {hotel.pet_fees && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <DollarSign className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Pet Fees</h3>
                  <p className="text-offblack">{hotel.pet_fees}</p>
                </div>
              </div>
            )}
            {hotel.weight_limits && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Weight Limits</h3>
                  <p className="text-offblack">{hotel.weight_limits}</p>
                </div>
              </div>
            )}
            {hotel.breed_restrictions && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <AlertTriangle className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Breed Restrictions</h3>
                  <p className="text-offblack">{hotel.breed_restrictions}</p>
                </div>
              </div>
            )}
            {hotel.max_pets_per_room && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Max Pets per Room</h3>
                  <p className="text-offblack">{hotel.max_pets_per_room}</p>
                </div>
              </div>
            )}
            {hotel.types_of_pets_permitted && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Types of Pets Permitted</h3>
                  <p className="text-offblack">{hotel.types_of_pets_permitted}</p>
                </div>
              </div>
            )}
            {hotel.required_documentation && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <FileText className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Required Documentation</h3>
                  <p className="text-offblack">{hotel.required_documentation}</p>
                </div>
              </div>
            )}
            {hotel.pet_friendly_amenities && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Pet Friendly Amenities</h3>
                  <p className="text-offblack">{hotel.pet_friendly_amenities}</p>
                </div>
              </div>
            )}
            {hotel.restrictions && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Other Restrictions</h3>
                  <p className="text-offblack">{hotel.restrictions}</p>
                </div>
              </div>
            )}
            {hotel.additional_notes && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Info className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Additional Notes</h3>
                  <p className="text-offblack">{hotel.additional_notes}</p>
                </div>
              </div>
            )}
            {/* Last Updated */}
            <div className="text-sm text-offblack/70 pt-4 border-t">
              Last updated:{" "}
              {new Date(hotel.last_updated).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="pt-4">
          <Button variant="outline" asChild className="border-brand-teal text-brand-teal hover:bg-brand-pink hover:text-offblack">
            <Link href="/directory/hotels" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to All Hotels
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
