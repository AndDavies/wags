import Image from "next/image";
import Link from "next/link";
import ReactMarkdown, { Components } from "react-markdown";
import {
  FileText,
  ExternalLink,
  Info,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { createClient } from "@/lib/supabase-server";

// Define types for pet policy and FAQ data
export type EntryRequirement = {
  step: number;
  label: string;
  text: string;
};

export type FAQ = {
  faq_id: number;
  policy_id: number;
  question: string;
  answer: string;
};

export type PetPolicy = {
  policy_id: number;
  country_name: string;
  slug: string;
  external_link: string | null;
  quarantine_info: string | null;
  entry_requirements: EntryRequirement[] | null;
  additional_info: Record<string, string | undefined> | null;
  external_links: { title: string; url: string }[] | null;
  flag_path: string;
  created_at: string;
  updated_at: string;
};

// Custom markdown components for spacing
const markdownComponents: Components = {
  a: ({ node, ...props }) => (
    <a {...props} className="mr-2 text-brand-teal hover:text-brand-pink" />
  ),
};

export default async function CountryPolicyPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const supabase = await createClient();

  // Fetch policy data
  const { data: policyData, error: policyError } = await supabase
    .from("pet_policies")
    .select("*")
    .eq("slug", country)
    .single();

  if (policyError || !policyData) {
    return (
      <div className="min-h-screen bg-offwhite flex items-center justify-center">
        <p className="text-center text-xl">Policy not found for this country.</p>
      </div>
    );
  }

  const policy = policyData as PetPolicy;

  // Fetch FAQs for this country
  const { data: faqData, error: faqError } = await supabase
    .from("country_faqs")
    .select("*")
    .eq("policy_id", policy.policy_id)
    .limit(10);

  const faqs = (faqData as FAQ[]) || [];

  const {
    country_name,
    flag_path,
    external_link,
    quarantine_info,
    entry_requirements,
    additional_info,
    external_links,
    updated_at,
  } = policy;

  return (
    <div className="min-h-screen bg-offwhite">
      <div className="mt-20" />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Breadcrumb */}
        <DirectoryBreadcrumb currentCategory="policies" extraItems={[{ label: country_name }]} />

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-brand-pink rounded-xl p-6 shadow-md">
          <div className="relative w-32 h-32 md:w-48 md:h-48 overflow-hidden rounded-lg shadow-lg">
            <Image
              src={flag_path}
              alt={`${country_name} flag`}
              fill
              sizes="(max-width: 768px) 128px, 192px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-display text-brand-teal mb-2">{country_name}</h1>
            <p className="text-xl text-offblack mb-4">Pet Travel Policy Information</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Badge className="bg-brand-teal text-white">Pet Friendly</Badge>
              {quarantine_info && quarantine_info.includes("no quarantine") ? (
                <Badge className="bg-brand-teal/80 text-white">No Quarantine</Badge>
              ) : (
                <Badge className="bg-brand-pink/80 text-offblack">Quarantine Possible</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-brand-teal text-white">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <CardTitle>Pet Travel Requirements for {country_name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {entry_requirements && entry_requirements.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Are the Pet Entry Requirements for {country_name}?
                </h2>
                <ul className="list-disc pl-5 text-offblack space-y-2">
                  {entry_requirements.map((req) => (
                    <li key={req.step}>
                      <strong>
                        Step {req.step}
                        {req.label ? `: ${req.label}` : ""}:
                      </strong>{" "}
                      <ReactMarkdown components={markdownComponents}>{req.text}</ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {quarantine_info && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  Is Quarantine Required for Pets in {country_name}?
                </h2>
                <div className="text-offblack">
                  <ReactMarkdown components={markdownComponents}>{quarantine_info}</ReactMarkdown>
                </div>
              </div>
            )}
            {additional_info && Object.keys(additional_info).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  What Additional Information Do I Need for {country_name}?
                </h2>
                <ul className="list-disc pl-5 text-offblack space-y-2">
                  {Object.entries(additional_info).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong>{" "}
                      <ReactMarkdown components={markdownComponents}>{value || "Not specified"}</ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {external_link && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">
                  Where Can I Find Official Resources for {country_name}?
                </h2>
                <a
                  href={external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-teal hover:text-brand-pink flex items-center gap-2"
                >
                  Visit Official Site <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
            {external_links && external_links.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-brand-teal">Related Resources</h2>
                <div className="flex flex-col gap-2">
                  {external_links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-teal hover:text-brand-pink flex items-center gap-2"
                    >
                      {link.title} <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="text-sm text-offblack/70 pt-4 border-t">
              Last updated:{" "}
              {new Date(updated_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-display text-brand-teal">
              Frequently Asked Questions About Pet Travel to {country_name}
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
            <FileText className="h-7 w-7" />
            Traveler Tips & Experiences
          </h2>
          <div className="space-y-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative h-12 w-12">
                    <Image
                      src="/placeholders/user1.jpg"
                      alt="Emily Parker"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-brand-teal">Emily Parker</h4>
                        <p className="text-sm text-offblack/70">February 12, 2025</p>
                      </div>
                      <Badge className="bg-brand-pink text-offblack flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 10v12" />
                          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                        </svg>
                        24
                      </Badge>
                    </div>
                    <p className="mt-2 text-offblack">
                      I visited {country_name} last year with my French Bulldog and found the process straightforward and well-documented.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="relative h-12 w-12">
                    <Image
                      src="/placeholders/user2.jpg"
                      alt="Michael Chen"
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-brand-teal">Michael Chen</h4>
                        <p className="text-sm text-offblack/70">January 3, 2025</p>
                      </div>
                      <Badge className="bg-brand-pink text-offblack flex items-center gap-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 10v12" />
                          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                        </svg>
                        18
                      </Badge>
                    </div>
                    <p className="mt-2 text-offblack">
                      Air travel to {country_name} was a breeze and my cat had no issues. Highly recommend booking early!
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
            <Link href="/directory/policies" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to All Countries
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
export async function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("pet_policies")
    .select("country_name")
    .eq("slug", country)
    .single();

  const countryName = data?.country_name || country.replace(/-/g, " ");
  return {
    title: `Pet Travel Policy for ${countryName} | Wags and Wanders`,
    description: `Discover the pet travel requirements for ${countryName}, including entry rules, quarantine info, and tips from real travelers.`,
    keywords: `pet travel ${countryName}, dog friendly travel ${countryName}, pet policy ${countryName}`,
  };
}
