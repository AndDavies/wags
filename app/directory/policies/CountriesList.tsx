"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { CountryData } from "./page";

// Debounce utility with explicit types
const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): ((...args: T) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function CountriesList({
  initialCountries,
}: {
  initialCountries: CountryData[];
}) {
  const [countries, setCountries] = useState<CountryData[]>(initialCountries);
  const [offset, setOffset] = useState(initialCountries.length);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerLoad = 12;

  const loadMoreCountries = useCallback(
    debounce(async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/policies?offset=${offset}&limit=${itemsPerLoad}`);
        if (!response.ok) throw new Error("Failed to fetch more countries");
        const newCountries: CountryData[] = await response.json();
        if (newCountries.length < itemsPerLoad) setHasMore(false);
        const uniqueNewCountries = newCountries.filter(
          (newCountry) => !countries.some((existing) => existing.slug === newCountry.slug)
        );
        setCountries((prev) => [...prev, ...uniqueNewCountries].sort((a, b) => a.name.localeCompare(b.name)));
        setOffset((prev) => prev + uniqueNewCountries.length);
      } catch (error) {
        console.error("Error loading more countries:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [countries, offset, isLoading]
  );

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {countries.map((country, index) => {
          const flagSrc = country.flag && country.flag.startsWith("/")
            ? country.flag
            : `/${country.flag}`;
          return (
            <Link
              key={country.slug}
              href={`/directory/policies/${country.slug}`}
              className="transition-transform hover:scale-105"
            >
              <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow">
                <div className="relative h-40 bg-gray-100">
                  <Image
                    src={flagSrc || `/flags/${country.slug}`}
                    alt={`${country.name} flag`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    priority={index < 4}
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
        {isLoading &&
          Array(4)
            .fill(0)
            .map((_, i) => (
              <Card key={`loading-${i}`} className="h-[300px] bg-gray-200 animate-pulse" />
            ))}
      </div>
      {hasMore && (
        <div className="text-center mt-8">
          <Button
            onClick={loadMoreCountries}
            disabled={isLoading}
            className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack"
          >
            {isLoading ? "Loading..." : "Load More Countries"}
          </Button>
        </div>
      )}
    </>
  );
}