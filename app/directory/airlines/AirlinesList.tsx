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

  const loadMoreAirlines = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/airlines?offset=${offset}&limit=${itemsPerLoad}`
      );
      if (!response.ok) throw new Error("Failed to fetch more airlines");

      const newAirlines: AirlineData[] = await response.json();
      console.log("Loaded more airlines:", newAirlines);

      if (newAirlines.length === 0 || newAirlines.length < itemsPerLoad) {
        setHasMore(false);
      }

      const uniqueNewAirlines = newAirlines.filter(
        (newAirline) =>
          !airlines.some((existing) => existing.slug === newAirline.slug)
      );

      const sortedNewAirlines = [...airlines, ...uniqueNewAirlines].sort((a, b) => {
        if (sortBy === "popularity") {
          const ratingA = a.user_rating ?? -1; // Nulls last
          const ratingB = b.user_rating ?? -1;
          return ratingB - ratingA; // Descending
        } else {
          return a.airline.localeCompare(b.airline); // Ascending
        }
      });

      setAirlines(sortedNewAirlines);
      setOffset((prev) => prev + uniqueNewAirlines.length);
    } catch (error) {
      console.error("Error loading more airlines:", error);
    } finally {
      setIsLoading(false);
    }
  }, [airlines, offset, isLoading, sortBy]);

  const handleSortChange = (value: "popularity" | "alphabetical") => {
    setSortBy(value);
    const sortedAirlines = [...airlines].sort((a, b) => {
      if (value === "popularity") {
        const ratingA = a.user_rating ?? -1; // Nulls last
        const ratingB = b.user_rating ?? -1;
        return ratingB - ratingA; // Descending
      } else {
        return a.airline.localeCompare(b.airline); // Ascending
      }
    });
    setAirlines(sortedAirlines);
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

      {airlines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {airlines.map((airline, index) => (
            <Link
              key={`${airline.slug}-${index}`}
              href={`/directory/airlines/${airline.slug}`}
              className="transition-transform hover:scale-105"
            >
              <Card className="h-full overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow">
                <div className="relative h-40 bg-gray-100">
                  <Image
                    src={airline.logo}
                    alt={airline.airline}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4 bg-white">
                  <h3 className="text-xl font-semibold text-brand-teal">
                    {airline.airline}
                  </h3>
                  <p className="text-sm text-offblack">
                    {airline.country || "N/A"}
                  </p>
                  {airline.user_rating !== null && (
                    <p className="text-sm text-gray-600">
                      Rating: {airline.user_rating}/100
                    </p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 bg-white">
                  <Button
                    variant="link"
                    className="p-0 text-brand-teal hover:text-brand-pink"
                  >
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-xl text-offblack">No airlines available.</p>
      )}

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