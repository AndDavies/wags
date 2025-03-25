// components/app/PetFriendlyLocations.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Location {
  name: string;
  address: string;
  phone?: string;
  type: string;
  source: string;
  allowsDogs?: boolean;
  wheelchairAccessibleEntrance?: boolean;
}

interface PetFriendlyLocationsProps {
  destination: string;
  destinationPlaceId: string; // Add place_id to props
}

export default function PetFriendlyLocations({ destination, destinationPlaceId }: PetFriendlyLocationsProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError(null);

      try {
        // Step 1: Use Place Details (New) to get coordinates from place_id
        const placeDetailsResponse = await fetch(
          `https://places.googleapis.com/v1/places/${destinationPlaceId}?fields=location&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`,
          {
            method: "GET",
            headers: {
              "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!,
            },
          }
        );
        const placeDetailsData = await placeDetailsResponse.json();

        if (!placeDetailsData.location) {
          throw new Error("Failed to fetch place details: " + (placeDetailsData.error?.message || "Unknown error"));
        }

        const { latitude: lat, longitude: lng } = placeDetailsData.location;

        // Step 2: Use Nearby Search (New) to find pet-friendly vets
        const nearbyVetsResponse = await fetch(
          `https://places.googleapis.com/v1/places:searchNearby`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!,
              "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.allowsDogs,places.wheelchairAccessibleEntrance",
            },
            body: JSON.stringify({
              locationRestriction: {
                circle: {
                  center: { latitude: lat, longitude: lng },
                  radius: 5000,
                },
              },
              includedTypes: ["veterinary_care"],
              keyword: "pet friendly",
              maxResultCount: 5,
            }),
          }
        );
        const nearbyVetsData = await nearbyVetsResponse.json();

        if (nearbyVetsData.status && nearbyVetsData.status !== "OK") {
          throw new Error("Failed to fetch nearby vets: " + (nearbyVetsData.error?.message || "Unknown error"));
        }

        const vetLocations: Location[] = (nearbyVetsData.places || []).map((place: any) => ({
          name: place.displayName?.text || "Unknown Vet",
          address: place.formattedAddress || "Address not available",
          phone: undefined, // Not fetching phone to stay within cost limits
          type: "vet",
          source: "Google",
          allowsDogs: place.allowsDogs || false,
          wheelchairAccessibleEntrance: place.wheelchairAccessibleEntrance || false,
        }));

        // Step 3: Use Nearby Search (New) to find pet-friendly hotels
        const nearbyHotelsResponse = await fetch(
          `https://places.googleapis.com/v1/places:searchNearby`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!,
              "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.allowsDogs,places.wheelchairAccessibleEntrance",
            },
            body: JSON.stringify({
              locationRestriction: {
                circle: {
                  center: { latitude: lat, longitude: lng },
                  radius: 5000,
                },
              },
              includedTypes: ["lodging"],
              keyword: "pet friendly",
              maxResultCount: 5,
            }),
          }
        );
        const nearbyHotelsData = await nearbyHotelsResponse.json();

        if (nearbyHotelsData.status && nearbyHotelsData.status !== "OK") {
          throw new Error("Failed to fetch nearby hotels: " + (nearbyHotelsData.error?.message || "Unknown error"));
        }

        const hotelLocations: Location[] = (nearbyHotelsData.places || []).map((place: any) => ({
          name: place.displayName?.text || "Unknown Hotel",
          address: place.formattedAddress || "Address not available",
          phone: undefined,
          type: "hotel",
          source: "Google",
          allowsDogs: place.allowsDogs || false,
          wheelchairAccessibleEntrance: place.wheelchairAccessibleEntrance || false,
        }));

        const combinedLocations = [...vetLocations, ...hotelLocations].slice(0, 3); // Limit to 3 results for preview
        setLocations(combinedLocations);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Error fetching pet-friendly locations:", err);
        setError("Failed to load pet-friendly locations: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (destination && destinationPlaceId) {
      fetchLocations();
    }
  }, [destination, destinationPlaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center py-4">{error}</p>;
  }

  if (!locations.length) {
    return (
      <p className="text-offblack/70 text-center py-4">
        No pet-friendly locations found near {destination}.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg text-brand-teal">
            Pet-Friendly Locations Near {destination}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {locations.map((location, index) => (
              <li key={index} className="bg-brand-teal/5 p-3 rounded flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-teal mt-1" />
                <div className="flex-1">
                  <p className="text-offblack font-medium">
                    {location.name} ({location.type.charAt(0).toUpperCase() + location.type.slice(1)})
                  </p>
                  <p className="text-offblack/70 text-sm">{location.address}</p>
                  {location.phone && (
                    <p className="text-offblack/70 text-sm flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${location.phone}`} className="text-brand-teal hover:underline">
                        {location.phone}
                      </a>
                    </p>
                  )}
                  <p className="text-offblack/70 text-sm">
                    Allows Dogs: {location.allowsDogs ? "Yes" : "No"}
                  </p>
                  <p className="text-offblack/70 text-sm">
                    Wheelchair Accessible Entrance: {location.wheelchairAccessibleEntrance ? "Yes" : "No"}
                  </p>
                  <p className="text-offblack/50 text-xs">Source: {location.source}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}