// app/directory/airlines/[slug]/page.tsx

import Image from "next/image";
import Link from "next/link";
import {
  Airplay,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { use } from "react";
import { createClient } from "@/lib/supabase-server";

// We expect the incoming props.params to be a Promise that resolves to an object with a "slug" string.
type Props = {
  params: Promise<{ slug: string }>;
};

// export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
//   // Unwrap the promised params using the experimental "use" hook.
//   const { slug } = use(params);
//   return {
//     title: `Airlines: ${slug.replace(/-/g, " ")}`,
//   };
// }

export default function AirlinePage({ params }: Props) {
  // Use the experimental "use" hook to synchronously unwrap the promised params.
  const { slug } = use(params);

  // Create a Supabase client (assuming createClient returns a Promise).
  const supabase = use(createClient());

  // Query the "airlines" table for a single record matching the slug.
  // We wrap the promise in "use()" so that the component suspends until the data is fetched.
  const { data: airline, error } = use(
    supabase
      .from("airlines")
      .select("*")
      .eq("slug", slug)
      .single()
  );

  if (error || !airline) {
    console.error("Error fetching airline:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Airline not found.</p>
      </div>
    );
  }

  // The logo path is stored in the database.
  const logoPath = airline.logo;

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Spacer for fixed navbar */}
      <div className="mt-20" />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <DirectoryBreadcrumb
          currentCategory="airlines"
          extraItems={[{ label: airline.airline, href: "/directory/airlines" }]}
        />

        {/* Airline Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-brand-pink rounded-xl p-6 shadow-md">
          <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden rounded-lg shadow-lg">
            <Image
              src={logoPath}
              alt={`${airline.airline} logo`}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display text-brand-teal mb-2">
              {airline.airline}
            </h1>
            <p className="text-xl text-offblack mb-4">
              Learn about pet travel policies for {airline.airline}.
            </p>
          </div>
        </div>

        {/* Airline Details Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-brand-teal text-white">
            <div className="flex items-center gap-3">
              <Airplay className="h-6 w-6" />
              <CardTitle>Airline Pet Travel Policy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-teal">Country Scope</h3>
                <p className="text-offblack">{airline.country_scope}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-teal">Pet Fees</h3>
                <p className="text-offblack">{airline.pet_fees}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-teal">Additional Information</h3>
                <p className="text-offblack">{airline.additional_information}</p>
              </div>
            </div>
            {airline.external_link && (
              <div className="flex gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-brand-teal">
                    Official Resources
                  </h3>
                  <a
                    href={airline.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-teal hover:text-brand-pink flex items-center gap-2"
                  >
                    Visit Official Website
                  </a>
                </div>
              </div>
            )}
            <div className="text-sm text-offblack/70 pt-4 border-t">
              Last updated:{" "}
              {new Date(airline.last_updated).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="pt-4">
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
    </div>
  );
}
