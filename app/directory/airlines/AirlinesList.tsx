"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import { AirlineData } from "./page";

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

export default function AirlinesList({
  initialAirlines,
}: {
  initialAirlines: AirlineData[];
}) {
  const [airlines, setAirlines] = useState<AirlineData[]>(initialAirlines);
  const [offset, setOffset] = useState(initialAirlines.length);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"popularity" | "alphabetical">("popularity");
  const itemsPerLoad = 12;

  const loadMoreAirlines = useCallback(
    debounce(async () => {
      if (isLoading) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/airlines?offset=${offset}&limit=${itemsPerLoad}`);
        if (!response.ok) throw new Error("Failed to fetch more airlines");
        const newAirlines: AirlineData[] = await response.json();
        if (newAirlines.length < itemsPerLoad) setHasMore(false);
        const uniqueNewAirlines = newAirlines.filter(
          (newAirline) => !airlines.some((existing) => existing.slug === newAirline.slug)
        );
        setAirlines((prev) => {
          const updated = [...prev, ...uniqueNewAirlines];
          return sortBy === "popularity"
            ? updated.sort((a, b) => (b.user_rating ?? -1) - (a.user_rating ?? -1))
            : updated.sort((a, b) => a.airline.localeCompare(b.airline));
        });
        setOffset((prev) => prev + uniqueNewAirlines.length);
      } catch (error) {
        console.error("Error loading more airlines:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [airlines, offset, isLoading, sortBy] // Explicit dependencies
  );

  const handleSortChange = (value: "popularity" | "alphabetical") => {
    setSortBy(value);
    setAirlines((prev) =>
      [...prev].sort((a, b) =>
        value === "popularity"
          ? (b.user_rating ?? -1) - (a.user_rating ?? -1)
          : a.airline.localeCompare(b.airline)
      )
    );
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Select onValueChange={handleSortChange} value={sortBy}>
          <SelectTrigger className="w-[180px] border-brand-teal">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alphabetical">Sort Alphabetically</SelectItem>
            <SelectItem value="popularity">Sort by Popularity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {airlines.map((airline, index) => (
          <Link
            key={airline.slug}
            href={`/directory/airlines/${airline.slug}`}
            className="transition-transform hover:scale-105"
          >
            <Card className="h-[300px] flex flex-col border-none shadow-md hover:shadow-xl transition-shadow">
              <div className="h-40 overflow-hidden">
                <Image
                  src={airline.logo}
                  alt={airline.airline}
                  width={160}
                  height={160}
                  priority={index < 4}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 bg-white flex-grow">
                <h3 className="text-xl font-semibold text-brand-teal">{airline.airline}</h3>
                <p className="text-sm text-offblack">{airline.country || "N/A"}</p>
                {airline.user_rating !== null && (
                  <p className="text-sm text-gray-600">Rating: {airline.user_rating}/100</p>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 bg-white flex-shrink-0">
                <Button
                  variant="link"
                  className="p-0 text-brand-teal hover:text-brand-pink"
                >
                  View Details <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
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
            onClick={loadMoreAirlines}
            disabled={isLoading}
            className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack"
          >
            {isLoading ? "Loading..." : "Load More Airlines"}
          </Button>
        </div>
      )}
    </>
  );
}