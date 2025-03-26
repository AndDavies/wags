"use client";

import type React from "react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plane, ArrowRight, CalendarIcon, PawPrint, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase-client";
import type { TripData, PetPolicy, Vet } from "./types";
import { cn } from "@/lib/utils";
import { RangeCalendar } from "@/components/ui/calendar-rac";
import { getLocalTimeZone, today, type DateValue } from "@internationalized/date";
import type { DateRange } from "react-aria-components";
import { AnimatePresence, motion } from "framer-motion";
import "./calendar-styles.css";

interface PlaceResult {
  formatted_address?: string;
  place_id?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface GooglePlacesResponse {
  status: string;
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    phone?: string;
  }>;
}

interface MapboxResponse {
  features: Array<{
    id: string;
    place_name: string;
  }>;
}

interface WhereToGoStepProps {
  tripData: TripData;
  setTripData: React.Dispatch<React.SetStateAction<TripData>>;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onNext: () => void;
  onBack: () => void;
  autocompleteLoaded: boolean;
  petPolicy: PetPolicy | null;
  setPetPolicy: React.Dispatch<React.SetStateAction<PetPolicy | null>>;
  userVets: Vet[];
}

export default function WhereToGoStep({
  tripData,
  setTripData,
  errors,
  setErrors,
  onNext,
  onBack,
  autocompleteLoaded,
  petPolicy,
  setPetPolicy,
  userVets,
}: WhereToGoStepProps) {
  const supabase = createClient();
  const departureInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const departureAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const now = today(getLocalTimeZone());
  const [showCalendar, setShowCalendar] = useState(false);
  const [originVetSuggestions, setOriginVetSuggestions] = useState<Vet[]>([]);
  const [destinationVetSuggestions, setDestinationVetSuggestions] = useState<Vet[]>([]);

  const [dateRange, setDateRange] = useState<DateRange | null>(
    tripData.dates.start && tripData.dates.end
      ? {
          start: parseDate(tripData.dates.start),
          end: parseDate(tripData.dates.end),
        }
      : null,
  );

  function parseDate(dateString: string | null): DateValue {
    if (!dateString) return now;
    const date = new Date(dateString);
    return today(getLocalTimeZone()).set({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    });
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const handleDateRangeChange = (range: DateRange | null) => {
    setDateRange(range);
    if (range) {
      const startISO = range.start.toDate(getLocalTimeZone()).toISOString();
      const endISO = range.end.toDate(getLocalTimeZone()).toISOString();
      setTripData((prev) => ({
        ...prev,
        dates: { start: startISO, end: endISO },
      }));
    } else {
      setTripData((prev) => ({
        ...prev,
        dates: { start: null, end: null },
      }));
    }
  };

  const clearDateRange = () => {
    setDateRange(null);
    setTripData((prev) => ({
      ...prev,
      dates: { start: null, end: null },
    }));
  };

  const fetchVetSuggestions = async (location: string, type: "origin" | "destination") => {
    if (!location) return;

    const { data: cachedData, error: cacheError } = await supabase
      .from("locations")
      .select("results")
      .eq("query", `pet friendly vets near ${location}`)
      .eq("source", "Google Places")
      .single();

    if (cacheError && cacheError.code !== "PGRST116") {
      console.error("[Google Places] Error checking cache:", cacheError);
      toast({
        title: "Error",
        description: "Failed to check cached vet locations.",
        variant: "destructive",
      });
      return;
    }

    let vetResults: Vet[] = [];
    if (cachedData) {
      console.log(`[Google Places] Using cached vet results for ${location}:`, cachedData.results);
      vetResults = cachedData.results.map((result: Vet) => ({
        id: result.id,
        name: result.name,
        address: result.address,
        phone: result.phone || "",
        location_type: type,
      }));
    } else {
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=pet+friendly+vets+near+${encodeURIComponent(
          location,
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`,
      );
      const googleData: GooglePlacesResponse = await googleResponse.json();
      console.log(`[Google Places] Vet search response for ${location}:`, googleData);

      if (googleData.status === "OK") {
        vetResults = googleData.results.map((result) => ({
          id: result.place_id,
          name: result.name,
          address: result.formatted_address,
          phone: result.phone || "",
          location_type: type,
        }));

        await supabase.from("locations").insert({
          query: `pet friendly vets near ${location}`,
          source: "Google Places",
          results: vetResults,
        });
      } else {
        console.error("[Google Places] Vet search failed:", googleData.status);
        toast({
          title: "Error",
          description: `Failed to fetch vet suggestions: ${googleData.status}`,
          variant: "destructive",
        });
      }

      const mapboxResponse = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/pet%20friendly%20vets%20near%20${encodeURIComponent(
          location,
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API_KEY}`,
      );
      const mapboxData: MapboxResponse = await mapboxResponse.json();
      console.log(`[Mapbox] Vet search response for ${location}:`, mapboxData);

      if (mapboxData.features) {
        const mapboxVets = mapboxData.features.map((feature) => ({
          id: feature.id,
          name: feature.place_name,
          address: feature.place_name,
          phone: "",
          location_type: type,
        }));
        vetResults = [...vetResults, ...mapboxVets];

        await supabase.from("locations").insert({
          query: `pet friendly vets near ${location}`,
          source: "Mapbox",
          results: mapboxVets,
        });
      }
    }

    if (type === "origin") {
      setOriginVetSuggestions(vetResults);
    } else {
      setDestinationVetSuggestions(vetResults);
    }
  };

  useEffect(() => {
    console.log("[Google Places] Autocomplete loaded:", autocompleteLoaded);
    if (autocompleteLoaded && departureInputRef.current && destinationInputRef.current) {
      departureAutocompleteRef.current = new google.maps.places.Autocomplete(departureInputRef.current, {
        types: ["(cities)"],
      });
      destinationAutocompleteRef.current = new google.maps.places.Autocomplete(destinationInputRef.current, {
        types: ["(cities)"],
      });

      departureAutocompleteRef.current.addListener("place_changed", () => {
        const place = departureAutocompleteRef.current!.getPlace() as PlaceResult;
        console.log("[Google Places] Departure place selected:", place);
        if (place.formatted_address && place.place_id) {
          setTripData((prev: TripData) => ({
            ...prev,
            departure: place.formatted_address!,
            departurePlaceId: place.place_id!,
          }));
          fetchVetSuggestions(place.formatted_address!, "origin");
        } else {
          console.error("[Google Places] Invalid departure place:", place);
          toast({
            title: "Error",
            description: "Please select a valid departure city from the suggestions.",
            variant: "destructive",
          });
        }
      });

      destinationAutocompleteRef.current.addListener("place_changed", async () => {
        const place = destinationAutocompleteRef.current!.getPlace() as PlaceResult;
        console.log("[Google Places] Destination place selected:", place);
        if (place.formatted_address && place.place_id) {
          setTripData((prev: TripData) => ({
            ...prev,
            destination: place.formatted_address!,
            destinationPlaceId: place.place_id!,
          }));
          fetchVetSuggestions(place.formatted_address!, "destination");

          const countryComponent = place.address_components?.find((component) =>
            component.types.includes("country"),
          );
          const country = countryComponent?.long_name || "";
          console.log("[Google Places] Extracted country:", country);

          if (country) {
            setTripData((prev: TripData) => ({
              ...prev,
              destinationCountry: country,
            }));

            const { data, error } = await supabase
              .from("pet_policies")
              .select("*")
              .eq("country_name", country)
              .single();

            if (error) {
              console.error("[Supabase] Error fetching pet policy:", error);
              toast({
                title: "Error",
                description: "Failed to fetch pet travel policies for " + country,
                variant: "destructive",
              });
            } else if (data) {
              console.log("[Supabase] Pet policy fetched:", data);
              setPetPolicy(data);
            }
          }
        } else {
          console.error("[Google Places] Invalid destination place:", place);
          toast({
            title: "Error",
            description: "Please select a valid destination city from the suggestions.",
            variant: "destructive",
          });
        }
      });
    }

    return () => {
      if (departureAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(departureAutocompleteRef.current);
      }
      if (destinationAutocompleteRef.current) {
        google.maps.event.clearInstanceListeners(destinationAutocompleteRef.current);
      }
    };
  }, [autocompleteLoaded, setTripData, supabase, setPetPolicy]);

  const addVet = async (type: "origin" | "destination", vet: Vet) => {
    const { data, error } = await supabase
      .from("vets")
      .insert({
        name: vet.name,
        address: vet.address,
        phone: vet.phone,
        location_type: type,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error saving vet:", error);
      toast({
        title: "Error",
        description: "Failed to save vet information.",
        variant: "destructive",
      });
      return;
    }

    if (type === "origin") {
      setTripData((prev: TripData) => ({
        ...prev,
        origin_vet_ids: [...prev.origin_vet_ids, data.id],
      }));
    } else {
      setTripData((prev: TripData) => ({
        ...prev,
        destination_vet_ids: [...prev.destination_vet_ids, data.id],
      }));
    }
  };

  const removeVet = (type: "origin" | "destination", vetId: string) => {
    if (type === "origin") {
      setTripData((prev: TripData) => ({
        ...prev,
        origin_vet_ids: prev.origin_vet_ids.filter((id) => id !== vetId),
      }));
    } else {
      setTripData((prev: TripData) => ({
        ...prev,
        destination_vet_ids: prev.destination_vet_ids.filter((id) => id !== vetId),
      }));
    }
  };

  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tripData.departure) newErrors.departure = "Departure location is required.";
    if (!tripData.destination) newErrors.destination = "Destination is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextWithValidation = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative mb-8">
        <div className="bg-gradient-to-r from-brand-teal/5 to-brand-pink/5 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-medium text-brand-teal mb-4">Plan Your Journey</h3>

          <div className="relative">
            <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden rounded-lg">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <pattern id="map-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="none" stroke="#249ab4" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="1" fill="#249ab4" />
                </pattern>
                <rect x="0" y="0" width="100%" height="100%" fill="url(#map-pattern)" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
              <div className="md:col-span-2">
                <div className="relative">
                  <Label className="text-brand-teal font-medium mb-2 block">From</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-teal">
                      <Plane className="h-5 w-5 -rotate-45" />
                    </div>
                    <Input
                      ref={departureInputRef}
                      value={tripData.departure}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTripData((prev: TripData) => ({ ...prev, departure: e.target.value }))
                      }
                      placeholder="City of departure"
                      className={cn(
                        "pl-10 py-6 border-2 bg-white/80 backdrop-blur-sm focus:border-brand-teal transition-all",
                        errors.departure ? "border-red-500" : "border-brand-teal/30",
                      )}
                    />
                  </div>
                  {errors.departure && <p className="text-red-500 text-sm mt-1">{errors.departure}</p>}
                </div>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-brand-teal/10 flex items-center justify-center">
                  <ArrowRight className="h-6 w-6 text-brand-teal" />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="relative">
                  <Label className="text-brand-teal font-medium mb-2 block">To</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-teal">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <Input
                      ref={destinationInputRef}
                      value={tripData.destination}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTripData((prev: TripData) => ({ ...prev, destination: e.target.value }))
                      }
                      placeholder="City of destination"
                      className={cn(
                        "pl-10 py-6 border-2 bg-white/80 backdrop-blur-sm focus:border-brand-teal transition-all",
                        errors.destination ? "border-red-500" : "border-brand-teal/30",
                      )}
                    />
                  </div>
                  {errors.destination && <p className="text-red-500 text-sm mt-1">{errors.destination}</p>}
                </div>
              </div>
            </div>

            <div className="mt-8 relative">
              <Label className="text-brand-teal font-medium mb-2 block flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                When are you traveling?
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={cn(
                    "flex items-center border-2 border-brand-teal/30 rounded-md p-3 bg-white/80 backdrop-blur-sm cursor-pointer transition-all",
                    showCalendar && "border-brand-teal",
                  )}
                  onClick={() => setShowCalendar(true)}
                >
                  <CalendarIcon className="h-6 w-6 text-brand-teal mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-brand-teal/70">Departure Date</p>
                    <p className="text-lg font-medium">
                      {tripData.dates.start ? formatDate(tripData.dates.start) : "Select date"}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center border-2 border-brand-teal/30 rounded-md p-3 bg-white/80 backdrop-blur-sm cursor-pointer transition-all",
                    showCalendar && "border-brand-teal",
                  )}
                  onClick={() => setShowCalendar(true)}
                >
                  <CalendarIcon className="h-6 w-6 text-brand-teal mr-3" />
                  <div className="flex-1">
                    <p className="text-sm text-brand-teal/70">Return Date</p>
                    <p className="text-lg font-medium">
                      {tripData.dates.end ? formatDate(tripData.dates.end) : "Select date"}
                    </p>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showCalendar && (
                  <motion.div
                    className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-brand-teal/20 p-4 w-full"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-brand-teal font-medium">Select Travel Dates</h4>
                      <div className="flex items-center gap-2">
                        {dateRange && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearDateRange}
                            className="text-brand-teal hover:text-brand-pink hover:bg-transparent"
                          >
                            Clear
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowCalendar(false)}
                          className="h-8 w-8 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-full md:w-auto mx-auto range-calendar-wrapper">
                        <RangeCalendar
                          className="rounded-md border border-brand-teal/20 p-2 shadow-sm"
                          value={dateRange}
                          onChange={handleDateRangeChange}
                        />
                      </div>

                      <div className="w-full md:w-1/3 bg-brand-teal/5 p-4 rounded-lg border border-brand-teal/20">
                        <h4 className="text-brand-teal font-medium mb-2">Don't know your dates yet?</h4>
                        <p className="text-offblack/70 text-sm">
                          No problem! You can still plan your trip without specific dates. Our system will provide
                          valuable information about pet travel requirements, recommended accommodations, and
                          activities.
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCalendar(false)}
                          className="mt-3 text-brand-teal hover:text-brand-pink hover:bg-transparent"
                        >
                          Continue without dates
                        </Button>
                      </div>
                    </div>

                    {dateRange && (
                      <div className="mt-4 bg-brand-teal/10 p-3 rounded-md flex items-center">
                        <CalendarIcon className="h-5 w-5 text-brand-teal mr-2" />
                        <span className="text-brand-teal">
                          {dateRange.start.toDate(getLocalTimeZone()).toLocaleDateString()} -{" "}
                          {dateRange.end.toDate(getLocalTimeZone()).toLocaleDateString()}
                          <span className="text-offblack/70 text-sm ml-2">
                            (
                            {Math.round(
                              (dateRange.end.toDate(getLocalTimeZone()).getTime() -
                                dateRange.start.toDate(getLocalTimeZone()).getTime()) /
                                (1000 * 60 * 60 * 24),
                            )}{" "}
                            days)
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => setShowCalendar(false)}
                        className="bg-brand-teal hover:bg-brand-pink text-white"
                      >
                        Apply
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-brand-teal flex items-center">
            <PawPrint className="h-5 w-5 mr-2 text-brand-teal" />
            Origin Vet(s) <span className="text-sm font-normal ml-2 text-offblack/70">(Optional)</span>
          </h3>
          <p className="text-offblack/70 text-sm">
            We recommend having a vet visit for a health certificate before your trip.
          </p>
          {tripData.origin_vet_ids.length > 0 && (
            <div className="space-y-2">
              {tripData.origin_vet_ids.map((vetId) => {
                const vet = [...userVets, ...originVetSuggestions].find((v) => v.id === vetId);
                if (!vet) return null;
                return (
                  <div
                    key={vetId}
                    className="flex items-center justify-between border border-brand-teal/30 rounded-md p-4 bg-white/80 shadow-sm"
                  >
                    <div>
                      <p className="text-offblack">{vet.name}</p>
                      <p className="text-offblack/70 text-sm">{vet.address}</p>
                      {vet.phone && (
                        <p className="text-offblack/70 text-sm">
                          <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                            {vet.phone}
                          </a>
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeVet("origin", vetId)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-offblack">Suggested Vets Near {tripData.departure}</h4>
            {originVetSuggestions.map((vet) => (
              <div
                key={vet.id}
                className="flex items-center justify-between border border-brand-teal/30 rounded-md p-4 bg-white/80 shadow-sm"
              >
                <div>
                  <p className="text-offblack">{vet.name}</p>
                  <p className="text-offblack/70 text-sm">{vet.address}</p>
                  {vet.phone && (
                    <p className="text-offblack/70 text-sm">
                      <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                        {vet.phone}
                      </a>
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                  onClick={() => addVet("origin", vet)}
                  disabled={tripData.origin_vet_ids.includes(vet.id)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
          {userVets.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-offblack">Your Saved Vets</h4>
              {userVets.map((vet) => (
                <div
                  key={vet.id}
                  className="flex items-center justify-between border border-brand-teal/30 rounded-md p-4 bg-white/80 shadow-sm"
                >
                  <div>
                    <p className="text-offblack">{vet.name}</p>
                    <p className="text-offblack/70 text-sm">{vet.address}</p>
                    {vet.phone && (
                      <p className="text-offblack/70 text-sm">
                        <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                          {vet.phone}
                        </a>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                    onClick={() => addVet("origin", vet)}
                    disabled={tripData.origin_vet_ids.includes(vet.id)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-brand-teal flex items-center">
            <PawPrint className="h-5 w-5 mr-2 text-brand-teal" />
            Destination Vet(s) <span className="text-sm font-normal ml-2 text-offblack/70">(Optional)</span>
          </h3>
          <p className="text-offblack/70 text-sm">
            We recommend having a vet contact at your destination for emergencies.
          </p>
          {tripData.destination_vet_ids.length > 0 && (
            <div className="space-y-2">
              {tripData.destination_vet_ids.map((vetId) => {
                const vet = [...userVets, ...destinationVetSuggestions].find((v) => v.id === vetId);
                if (!vet) return null;
                return (
                  <div
                    key={vetId}
                    className="flex items-center justify-between border border-brand-teal/30 rounded-md p-4 bg-white/80 shadow-sm"
                  >
                    <div>
                      <p className="text-offblack">{vet.name}</p>
                      <p className="text-offblack/70 text-sm">{vet.address}</p>
                      {vet.phone && (
                        <p className="text-offblack/70 text-sm">
                          <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                            {vet.phone}
                          </a>
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeVet("destination", vetId)}
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-offblack">Suggested Vets Near {tripData.destination}</h4>
            {destinationVetSuggestions.map((vet) => (
              <div
                key={vet.id}
                className="flex items-center justify-between border border-brand-teal/30 rounded-md p-4 bg-white/80 shadow-sm"
              >
                <div>
                  <p className="text-offblack">{vet.name}</p>
                  <p className="text-offblack/70 text-sm">{vet.address}</p>
                  {vet.phone && (
                    <p className="text-offblack/70 text-sm">
                      <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                        {vet.phone}
                      </a>
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                  onClick={() => addVet("destination", vet)}
                  disabled={tripData.destination_vet_ids.includes(vet.id)}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
          {userVets.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-offblack">Your Saved Vets</h4>
              {userVets.map((vet) => (
                <div
                  key={vet.id}
                  className="flex items-center justify-between border border-brand-teal/30 rounded-md p-4 bg-white/80 shadow-sm"
                >
                  <div>
                    <p className="text-offblack">{vet.name}</p>
                    <p className="text-offblack/70 text-sm">{vet.address}</p>
                    {vet.phone && (
                      <p className="text-offblack/70 text-sm">
                        <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                          {vet.phone}
                        </a>
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                    onClick={() => addVet("destination", vet)}
                    disabled={tripData.destination_vet_ids.includes(vet.id)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal/10"
          disabled={true}
        >
          Back
        </Button>
        <Button
          onClick={handleNextWithValidation}
          className="w-full bg-brand-teal hover:bg-brand-pink text-white py-6"
        >
          Continue to Travelers
        </Button>
      </div>
    </div>
  );
}