"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { CountryData } from "./page";

/**
 * Displays a grid of country cards based on the provided data.
 * Links each card to the specific country's policy page.
 *
 * @param {object} props - Component props.
 * @param {CountryData[]} props.countries - Array of country data objects to display.
 */
export default function CountriesList({
  countries,
}: {
  countries: CountryData[];
}) {
  if (!countries || countries.length === 0) {
    return (
      <div className="text-center py-10 text-gray-600">
        <p className="text-lg mb-2">No countries match your current filters.</p>
        <p className="text-sm">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {countries.map((country, index) => {
        const flagSrc = country.flag_path
          ? country.flag_path.startsWith("/")
            ? country.flag_path
            : `/${country.flag_path}`
          : "/placeholder-flag.png";

        return (
          <Link
            key={country.slug}
            href={`/directory/policies/${country.slug}`}
            passHref
            legacyBehavior={false}
            className="block transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 rounded-lg"
            aria-label={`View pet import policies for ${country.name}`}
          >
            <Card className="h-full flex flex-col overflow-hidden border border-gray-200 hover:border-teal-300 rounded-lg shadow hover:shadow-md transition-all duration-200 bg-white">
              <div className="relative h-40 w-full bg-gray-100">
                <Image
                  src={flagSrc}
                  alt={`${country.name} flag`}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 23vw"
                  priority={index < 8}
                  className="object-cover"
                  unoptimized={flagSrc.startsWith('data:')}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-flag.png'; }}
                />
              </div>
              <CardContent className="p-4 flex-grow">
                <h3 className="text-lg font-semibold text-black tracking-tight font-sans">{country.name}</h3>
              </CardContent>
              <CardFooter className="p-4 pt-0 border-t border-gray-100 mt-auto">
                <div className="flex items-center text-sm font-medium text-teal-600 hover:text-teal-700">
                  View Requirements
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}