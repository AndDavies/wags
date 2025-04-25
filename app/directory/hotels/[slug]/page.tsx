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

// Define types for hotel data and FAQs
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

export type FAQ = {
  faq_id: number;
  hotel_id: number;
  question: string;
  answer: string;
};

// Server-side props fetching
export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch hotel data
  const { data: hotelData, error: hotelError } = await supabase
    .from("hotels")
    .select("*")
    .eq("slug", slug)
    .single();

  if (hotelError || !hotelData) {
    console.error("Error fetching hotel data:", hotelError);
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-center text-xl">Hotel data not found.</p>
      </div>
    );
  }

  const hotel = hotelData as HotelData;

  // Fetch FAQs for this hotel
  const { data: faqData, error: faqError } = await supabase
    .from("hotel_faqs")
    .select("*")
    .eq("hotel_id", hotel.id)
    .limit(10);

  const faqs = faqData as FAQ[] || [];

  // Build breadcrumb extra items
  const extraBreadcrumbs = [{ label: hotel.hotel_chain }];

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Spacer for fixed navbar */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <DirectoryBreadcrumb currentCategory="hotels" extraItems={extraBreadcrumbs} />

        {/* Hotel Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-brand-pink rounded-xl p-6 shadow-md">
          <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden rounded-lg shadow-lg">
            <Image
              src={hotel.logo}
              alt={`${hotel.hotel_chain} logo`}
              fill
              sizes="(max-width: 768px) 128px, 192px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display text-brand-teal mb-2">
              {hotel.hotel_chain}
            </h1>
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
              <CardTitle>Pet Policy Details for {hotel.hotel_chain}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {hotel.pet_fees && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Are the Pet Fees at {hotel.hotel_chain}?
                </h2>
                <p className="text-offblack">{hotel.pet_fees}</p>
              </div>
            )}
            {hotel.weight_limits && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  Are There Weight Limits for Pets at {hotel.hotel_chain}?
                </h2>
                <p className="text-offblack">{hotel.weight_limits}</p>
              </div>
            )}
            {hotel.breed_restrictions && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  Does {hotel.hotel_chain} Have Breed Restrictions?
                </h2>
                <p className="text-offblack">{hotel.breed_restrictions}</p>
              </div>
            )}
            {hotel.max_pets_per_room && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  How Many Pets Are Allowed per Room at {hotel.hotel_chain}?
                </h2>
                <p className="text-offblack">{hotel.max_pets_per_room}</p>
              </div>
            )}
            {hotel.types_of_pets_permitted && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Types of Pets Are Permitted at {hotel.hotel_chain}?
                </h2>
                <p className="text-offblack">{hotel.types_of_pets_permitted}</p>
              </div>
            )}
            {hotel.required_documentation && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Documentation Is Required at {hotel.hotel_chain}?
                </h2>
                <p className="text-offblack">{hotel.required_documentation}</p>
              </div>
            )}
            {hotel.pet_friendly_amenities && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Pet-Friendly Amenities Does {hotel.hotel_chain} Offer?
                </h2>
                <p className="text-offblack">{hotel.pet_friendly_amenities}</p>
              </div>
            )}
            {hotel.restrictions && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  Are There Other Restrictions at {hotel.hotel_chain}?
                </h2>
                <p className="text-offblack">{hotel.restrictions}</p>
              </div>
            )}
            {hotel.additional_notes && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Else Should I Know About {hotel.hotel_chain}?
                </h2>
                <p className="text-offblack">{hotel.additional_notes}</p>
              </div>
            )}
            {hotel.last_updated && (
              <div className="text-sm text-offblack/70 pt-4 border-t">
                Last updated:{" "}
                {new Date(hotel.last_updated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-display text-brand-teal">
              Frequently Asked Questions About {hotel.hotel_chain}
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

        {/* Traveler Tips & Experiences (Static Example) */}
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
                      alt="Sarah Johnson"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-brand-teal">Sarah Johnson</h4>
                        <p className="text-sm text-offblack/70">March 5, 2025</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-brand-teal border-brand-teal">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Full Review
                      </Button>
                    </div>
                    <p className="mt-2 text-offblack">
                      Stayed at {hotel.hotel_chain} with my Lab last month – the pet amenities were top-notch!
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
        <div className="pt-4">
          <Button
            variant="outline"
            asChild
            className="border-brand-teal text-brand-teal hover:bg-brand-pink hover:text-offblack"
          >
            <Link href="/directory/hotels" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to All Hotels
            </Link>
          </Button>
        </div>
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
  const { data } = await supabase
    .from("hotels")
    .select("hotel_chain")
    .eq("slug", slug)
    .single();

  const hotelName = data?.hotel_chain || slug.replace(/-/g, " ");
  return {
    title: `Pet-Friendly Policy for ${hotelName} | Wags and Wanders`,
    description: `Explore the pet policy for ${hotelName}, including fees, weight limits, amenities, and traveler tips.`,
    keywords: `pet-friendly ${hotelName}, ${hotelName} dog policy, travel with pets ${hotelName}`,
  };
}