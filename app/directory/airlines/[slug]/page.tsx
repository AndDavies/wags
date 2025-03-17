import Image from "next/image";
import Link from "next/link";
import { Airplay, ChevronLeft, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { createClient } from "@/lib/supabase-server";

export const revalidate = 0; // Disable caching for fresh data

// Define types based on schema
export type AirlineData = {
  id: number;
  airline: string;
  country: string | null;
  logo: string;
  pets_in_cabin: boolean | null;
  pets_in_cargo: boolean | null;
  crate_carrier_size_max: string | null;
  weight_limit: number | null;
  breed_restrictions: string | null;
  health_cert: string | null;
  fees_usd: number | null;
  additional_details: string | null;
  last_updated: string | null;
  source: string | null;
  url: string | null;
  slug: string;
};

export type FAQ = {
  faq_id: number;
  airline_id: number;
  question: string;
  answer: string;
};

// Server-side props fetching
export default async function AirlinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch airline data (adjusted to schema)
  const { data: airlineData, error: airlineError } = await supabase
    .from("airline_pet_policies")
    .select(
      "id, airline, country, logo, pets_in_cabin, pets_in_cargo, crate_carrier_size_max, weight_limit, breed_restrictions, health_cert, fees_usd, additional_details, last_updated, source, url, slug"
    )
    .eq("slug", slug)
    .single();

  if (airlineError || !airlineData) {
    console.error("Error fetching airline:", airlineError);
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-xl text-offblack">Airline not found.</p>
      </div>
    );
  }

  const airline = airlineData as AirlineData;
  const logoPath = airline.logo || "/default-logo.jpg"; // Fallback if empty string fails

  // Fetch FAQs
  const { data: faqData, error: faqError } = await supabase
    .from("airline_faqs")
    .select("*")
    .eq("airline_id", airline.id)
    .limit(10);

  const faqs = faqData as FAQ[] || [];

  return (
    <div className="min-h-screen bg-offwhite">
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
                sizes="(max-width: 768px) 128px, 160px"
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
            </div>
          </CardContent>
        </Card>

        {/* Policy Details */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-brand-teal text-white">
            <div className="flex items-center gap-3">
              <Airplay className="h-6 w-6" />
              <CardTitle className="text-2xl">Pet Travel Policy for {airline.airline}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 grid gap-8 md:grid-cols-2">
            {/* Left Column: Policy Options */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  Can Pets Travel in the Cabin with {airline.airline}?
                </h2>
                <p className="text-offblack">
                  {airline.pets_in_cabin === true
                    ? "Allowed"
                    : airline.pets_in_cabin === false
                    ? "Not Allowed"
                    : "Information not available"}
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  Can Pets Travel in Cargo with {airline.airline}?
                </h2>
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
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Are the Restrictions and Fees for {airline.airline}?
                </h2>
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

              {(airline.additional_details || airline.url || airline.source) && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-brand-teal">
                    What Additional Information Is Available for {airline.airline}?
                  </h2>
                  <ul className="list-disc list-inside text-offblack space-y-1">
                    {airline.additional_details && (
                      <li>{airline.additional_details}</li>
                    )}
                    {airline.source && (
                      <li>
                        <strong>Source:</strong> {airline.source}
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

          {/* Footer with Last Updated */}
          {airline.last_updated && (
            <div className="p-6 pt-0 text-sm text-offblack/70 border-t">
              <p>
                Last updated:{" "}
                {new Date(airline.last_updated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </Card>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-display text-brand-teal">
              Frequently Asked Questions About {airline.airline}
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.faq_id}>
                  <h3 className="text-xl font-semibold text-brand-teal">{faq.question}</h3>
                  <p className="text-offblack">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Traveler Tips & Experiences */}
        <div className="space-y-6">
          <h2 className="text-3xl font-display text-brand-teal flex items-center gap-2">
            <MessageSquare className="h-7 w-7" />
            Traveler Tips & Experiences
          </h2>
          <div className="space-y-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative h-12 w-12">
                    <Image
                      src="/placeholders/user1.jpg"
                      alt="Lisa Carter"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-brand-teal">Lisa Carter</h4>
                        <p className="text-sm text-offblack/70">March 10, 2025</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-brand-teal border-brand-teal">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Full Review
                      </Button>
                    </div>
                    <p className="mt-2 text-offblack">
                      Flew with {airline.airline} and my cat loved the cabin experience – smooth process!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center">
            <Button className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
              Share Your Experience
            </Button>
          </div>
        </div>

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

      {/* FAQ Schema Markup */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map((faq) => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer,
                },
              })),
            }),
          }}
        />
      )}
    </div>
  );
}

// Metadata Generation
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
      title: "Airline Not Found | Wags and Wanders",
    };
  }

  return {
    title: `${airline.airline} Pet Travel Policy | Wags and Wanders`,
    description: `Explore ${airline.airline}'s pet travel policy, including cabin and cargo options, fees, and traveler tips.`,
    keywords: `${airline.airline} pet policy, pet-friendly ${airline.airline}, travel with pets ${airline.airline}`,
  };
}