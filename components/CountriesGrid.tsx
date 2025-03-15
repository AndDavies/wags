"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { CountryData } from "@/app/directory/policies/page";

interface CountriesGridProps {
  countries: CountryData[];
}

export function CountriesGrid({ countries }: CountriesGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
      {countries.map((country) => {
        // Ensure the flag URL starts with a leading slash
        const flagSrc =
          country.flag_path && country.flag_path.startsWith("/")
            ? country.flag_path
            : `/${country.flag_path}`;
        return (
          <Link
            key={country.slug}
            href={`/directory/policies/${country.slug}`}
            className="transition-transform hover:scale-105"
          >
            <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow">
              <div className="relative h-40 bg-gray-100">
                <Image
                  src={flagSrc || `/flags/${country.slug}.jpg`}
                  alt={`${country.name} flag`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" // Responsive sizes
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4 bg-white">
                <h3 className="text-xl font-semibold text-brand-teal">{country.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {country.quarantine || "No quarantine info available"}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 bg-white">
                <Button variant="link" className="p-0 text-brand-teal hover:text-brand-pink">
                  View Requirements
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}