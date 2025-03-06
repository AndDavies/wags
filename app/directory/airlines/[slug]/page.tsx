import Image from "next/image";
import Link from "next/link";
import {
  Airplay,
  ExternalLink,
  Info,
  DollarSign,
  Clock,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { createClient } from "@/lib/supabase-server";

export type AirlineData = {
  id: number;
  airline: string;
  slug: string;
  logo: string;
  country: string;
  fees_usd?: number | null;
  last_updated?: string;
  external_link?: string | null;
};

export default async function AirlineDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const supabase = await createClient();

  // Query the airlines table for the airline with the matching slug.
  const { data: airline, error } = await supabase
    .from("airlines")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !airline) {
    console.error("Error fetching airline:", error);
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-center text-xl">Airline not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Spacer for fixed navbar */}
      <div className="mt-20" />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <DirectoryBreadcrumb currentCategory="airlines" extraItems={[{ label: airline.airline, href: `/directory/airlines/${airline.slug}` }]} />

        {/* Airline Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-brand-pink rounded-xl p-6 shadow-md">
          <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden rounded-lg shadow-lg">
            <Image
              src={airline.logo}
              alt={`${airline.airline} logo`}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display text-brand-teal mb-2">{airline.airline}</h1>
            <p className="text-xl text-offblack mb-4">{airline.country}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {/* Static badges – these can be later replaced by dynamic data */}
              <span className="bg-brand-teal text-white rounded-md px-2 py-1">Pet Friendly</span>
              {airline.fees_usd && (
                <span className="bg-brand-teal/80 text-white rounded-md px-2 py-1">
                  ${airline.fees_usd} fee
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Airline Information Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-brand-teal text-white">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6" />
              <CardTitle>Airline Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {airline.external_link && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <ExternalLink className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Official Website</h3>
                  <a
                    href={airline.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-teal hover:text-brand-pink flex items-center gap-2"
                  >
                    Visit {airline.airline} website
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
            {airline.fees_usd && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <DollarSign className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Fees</h3>
                  <p className="text-offblack">${airline.fees_usd}</p>
                </div>
              </div>
            )}
            {airline.last_updated && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <Clock className="h-6 w-6 text-brand-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal mb-2">Last Updated</h3>
                  <p className="text-offblack">
                    {new Date(airline.last_updated).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="pt-4">
          <Button variant="outline" asChild className="border-brand-teal text-brand-teal hover:bg-brand-pink hover:text-offblack">
            <Link href="/directory/airlines" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to All Airlines
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
