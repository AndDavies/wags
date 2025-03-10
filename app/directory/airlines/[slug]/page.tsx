import Image from "next/image";
import Link from "next/link";
import { Airplay, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { createClient } from "@/lib/supabase-server";

export const revalidate = 0;

// Define props type with Promise for Next.js 15
export default async function AirlinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Unwrap the Promise with await
  const supabase = await createClient();

  // Fetch airline data
  const { data: airline, error } = await supabase
    .from("airline_pet_policies")
    .select(
      "airline, country, logo, user_rating, pets_in_cabin, pets_in_checked_baggage, pets_in_cargo, crate_carrier_size_max, weight_limit, breed_restrictions, health_cert, fees_usd, phone_number, additional_details, last_updated, source, url"
    )
    .eq("slug", slug)
    .single();

  if (error || !airline) {
    console.error("Error fetching airline:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-offblack">Airline not found.</p>
      </div>
    );
  }

  const logoPath = airline.logo || "/default-logo.jpg"; // Fallback for null logo

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Spacer for fixed navbar */}
      <div className="mt-20" />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <DirectoryBreadcrumb
          currentCategory="airlines"
          extraItems={[{ label: airline.airline, href: `/directory/airlines/${slug}` }]}
        />

        {/* Airline Header */}
        <Card className="bg-brand-pink border-none shadow-md">
          <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40 overflow-hidden rounded-lg shadow-lg">
              <Image
                src={logoPath}
                alt={`${airline.airline} logo`}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-4xl md:text-5xl font-display text-brand-teal">
                {airline.airline}
              </h1>
              {airline.country && (
                <p className="text-lg text-offblack">Country: {airline.country}</p>
              )}
              {airline.user_rating !== null && (
                <p className="text-lg text-offblack">
                  User Rating: {airline.user_rating}/100
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Policy Details */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-brand-teal text-white">
            <div className="flex items-center gap-3">
              <Airplay className="h-6 w-6" />
              <CardTitle className="text-2xl">Pet Travel Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid gap-8 md:grid-cols-2">
            {/* Left Column: Policy Options */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-brand-teal mb-2">Pets in Cabin</h3>
                <p className="text-offblack">
                  {airline.pets_in_cabin === true
                    ? "Allowed"
                    : airline.pets_in_cabin === false
                    ? "Not Allowed"
                    : "Information not available"}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-brand-teal mb-2">
                  Pets in Checked Baggage
                </h3>
                <p className="text-offblack">
                  {airline.pets_in_checked_baggage === true
                    ? "Allowed"
                    : airline.pets_in_checked_baggage === false
                    ? "Not Allowed"
                    : "Information not available"}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-brand-teal mb-2">Pets in Cargo</h3>
                <p className="text-offblack">
                  {airline.pets_in_cargo === true
                    ? "Allowed"
                    : airline.pets_in_cargo === false
                    ? "Not Allowed"
                    : "Information not available"}
                </p>
              </div>
            </div>

            {/* Right Column: Restrictions & Additional Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-brand-teal mb-2">
                  Restrictions & Fees
                </h3>
                <ul className="list-disc list-inside text-offblack space-y-1">
                  {airline.crate_carrier_size_max && (
                    <li>
                      <strong>Crate/Carrier Size:</strong> {airline.crate_carrier_size_max}
                    </li>
                  )}
                  {airline.weight_limit !== null && (
                    <li>
                      <strong>Weight Limit:</strong> {airline.weight_limit} lbs
                    </li>
                  )}
                  {airline.breed_restrictions && (
                    <li>
                      <strong>Breed Restrictions:</strong> {airline.breed_restrictions}
                    </li>
                  )}
                  {airline.health_cert && (
                    <li>
                      <strong>Health Certificate:</strong> {airline.health_cert}
                    </li>
                  )}
                  {airline.fees_usd !== null && (
                    <li>
                      <strong>Fees (USD):</strong> ${airline.fees_usd}
                    </li>
                  )}
                  {!airline.crate_carrier_size_max &&
                    airline.weight_limit === null &&
                    !airline.breed_restrictions &&
                    !airline.health_cert &&
                    airline.fees_usd === null && (
                      <li>Information not available</li>
                    )}
                </ul>
              </div>

              {(airline.additional_details || airline.phone_number || airline.url) && (
                <div>
                  <h3 className="text-xl font-semibold text-brand-teal mb-2">
                    Additional Information
                  </h3>
                  <ul className="list-disc list-inside text-offblack space-y-1">
                    {airline.additional_details && (
                      <li>{airline.additional_details}</li>
                    )}
                    {airline.phone_number && (
                      <li>
                        <strong>Phone:</strong> {airline.phone_number}
                      </li>
                    )}
                    {airline.url && (
                      <li>
                        <strong>Website:</strong>{" "}
                        <a
                          href={airline.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-teal hover:text-brand-pink"
                        >
                          Visit Site
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>

          {/* Footer with Source & Last Updated */}
          <div className="p-6 pt-0 text-sm text-offblack/70 border-t">
            
            {airline.last_updated && (
              <p>
                Last updated:{" "}
                {new Date(airline.last_updated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </Card>

        {/* Back Button */}
        <Button
          variant="outline"
          asChild
          className="border-brand-teal text-brand-teal hover:bg-brand-pink hover:text-offblack"
        >
          <Link href="/directory/airlines" className="flex items-center">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to All Airlines
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Generate metadata for SEO (from your provided code)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: airline, error } = await supabase
    .from("airline_pet_policies")
    .select("airline")
    .eq("slug", slug)
    .single();

  if (error || !airline) {
    return {
      title: "Airline Not Found",
    };
  }

  return {
    title: `${airline.airline} Pet Travel Policy`,
  };
}