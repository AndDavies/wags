"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Script from "next/script";
import WhereToGoStep from "./WhereToGoStep";
import TravelersStep from "./TravelersStep";
import GetReadyStep from "./GetReadyStep";
import StepIndicator from "./StepIndicator";
import Chatbot from "./Chatbot";
import type { TripData, PetPolicy, Vet } from "./types";

// Create a component to handle useSearchParams
function CreateTripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [tripData, setTripData] = useState<TripData>({
    tripType: [],
    travelers: { adults: 0, children: 0, pets: 0 },
    pets: [], // Initialize pets array
    departure: "",
    destination: searchParams.get("destination") || "",
    departurePlaceId: "",
    destinationPlaceId: "",
    destinationCountry: "",
    origin_vet_ids: [], // Use vet IDs
    destination_vet_ids: [], // Use vet IDs
    dates: { start: null, end: null },
    method: "",
    interests: [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [showItineraryUpload, setShowItineraryUpload] = useState(false);
  const [itineraryFile, setItineraryFile] = useState<File | null>(null);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const [petPolicy, setPetPolicy] = useState<PetPolicy | null>(null);
  const [userPets, setUserPets] = useState<{ id: string; name: string }[]>([]); // Store user's pets
  const [userVets, setUserVets] = useState<Vet[]>([]); // Store user's profile vets

  // Fetch user authentication status and profile data
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (session) {
        // Fetch user's pets
        const { data: petsData, error: petsError } = await supabase
          .from("pets")
          .select("id, name")
          .eq("user_id", session.user.id);

        if (petsError) {
          console.error("Error fetching pets:", petsError);
          toast({
            title: "Error",
            description: "Failed to fetch your pets.",
            variant: "destructive",
          });
        } else {
          setUserPets(petsData || []);
        }

        // Fetch user's profile vets
        const { data: vetsData, error: vetsError } = await supabase
          .from("vets")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("location_type", "profile");

        if (vetsError) {
          console.error("Error fetching vets:", vetsError);
          toast({
            title: "Error",
            description: "Failed to fetch your vets.",
            variant: "destructive",
          });
        } else {
          setUserVets(vetsData || []);
        }
      }
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session && localStorage.getItem("pendingTrip")) {
        const pendingTrip = JSON.parse(localStorage.getItem("pendingTrip")!);
        setTripData(pendingTrip);
        localStorage.removeItem("pendingTrip");
        handleSaveTrip();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSaveTrip = async () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      const { data: insertedData, error } = await supabase
        .from("trips")
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          travelers: tripData.travelers,
          pets: tripData.pets, // Save selected pet IDs
          departure: tripData.departure,
          destination: tripData.destination,
          dates: tripData.dates,
          method: tripData.method,
          archived: false,
          status: "upcoming",
        })
        .select()
        .single();

      if (error) throw error;

      // Update trip with vet IDs
      await supabase
        .from("trips")
        .update({
          origin_vet_ids: tripData.origin_vet_ids,
          destination_vet_ids: tripData.destination_vet_ids,
        })
        .eq("id", insertedData.id);

      setSavedTripId(insertedData.id);
      setShowItineraryUpload(true);

      toast({
        title: "Trip Saved",
        description: `Your trip to ${tripData.destination} has been saved.`,
        variant: "default",
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error",
        description: "Failed to save trip: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    // Placeholder for PDF download (premium feature)
    alert("PDF download is a premium feature - coming soon!");
  };

  const handleItineraryUpload = async () => {
    if (!itineraryFile) {
      toast({
        title: "Error",
        description: "Please select an itinerary file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Placeholder for OCR integration (Google Vision API)
      const extractedData = {
        hotel: "Fairmont Royal York Hotel",
        checkInDate: "2025-03-31",
        checkInTime: "13:00",
      };

      const { error } = await supabase
        .from("trips")
        .update({
          hotel: extractedData.hotel,
          dates: {
            start: extractedData.checkInDate,
            end: tripData.dates.end,
          },
        })
        .eq("id", savedTripId);

      if (error) throw error;

      const filePath = `${savedTripId}/itinerary-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, itineraryFile);

      if (uploadError) throw uploadError;

      await supabase.from("documents").insert({
        trip_id: savedTripId,
        file_name: itineraryFile.name,
        file_path: filePath,
      });

      toast({
        title: "Itinerary Updated",
        description: "Your itinerary has been updated with the booked details.",
        variant: "default",
      });

      router.push("/profile");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Error",
        description: "Failed to process itinerary: " + errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLoginRedirect = () => {
    localStorage.setItem("pendingTrip", JSON.stringify(tripData));
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-brand-teal/5 to-brand-pink/5 pt-24 pb-12">
      <div className="container max-w-[1400px] mx-auto px-4 flex flex-col lg:flex-row gap-6">
        {/* Chatbot Sidebar */}
        <div className="lg:w-1/5 w-full">
          <Chatbot />
        </div>

        {/* Main Content */}
        <div className="lg:w-4/5 w-full mx-auto">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-brand-teal">
                {step === 1 && "Where to Go"}
                {step === 2 && "Who's Traveling"}
                {step === 3 && "Get Ready"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StepIndicator currentStep={step} totalSteps={3} />
              {step === 1 && (
                <WhereToGoStep
                  tripData={tripData}
                  setTripData={setTripData}
                  errors={errors}
                  setErrors={setErrors}
                  onNext={handleNext}
                  onBack={handleBack}
                  autocompleteLoaded={autocompleteLoaded}
                  petPolicy={petPolicy}
                  setPetPolicy={setPetPolicy}
                  userVets={userVets} // Pass user's profile vets
                />
              )}
              {step === 2 && (
                <TravelersStep
                  tripData={tripData}
                  setTripData={setTripData}
                  errors={errors}
                  setErrors={setErrors}
                  onNext={handleNext}
                  onBack={handleBack}
                  userPets={userPets} // Pass user's pets
                />
              )}
              {step === 3 && (
                <GetReadyStep
                  tripData={tripData}
                  petPolicy={petPolicy}
                  isLoggedIn={isLoggedIn}
                  onSave={handleSaveTrip}
                  onDownload={handleDownloadPDF}
                  onBack={handleBack}
                />
              )}

              {showLoginPrompt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-sm border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl text-brand-teal">Log In to Continue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-offblack/70 mb-4">
                        Please log in to save your trip, upload documents, or download the itinerary.
                      </p>
                      <Button
                        onClick={handleLoginRedirect}
                        className="w-full bg-brand-teal hover:bg-brand-pink text-white"
                      >
                        Log In
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              {showItineraryUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-sm border-none shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl text-brand-teal">Upload Your Booked Itinerary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-offblack/70 mb-4">
                        Upload your booked itinerary (e.g., from Booking.com) to update your trip details.
                      </p>
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setItineraryFile(e.target.files?.[0] || null)
                        }
                        className="border-brand-teal/50 mb-4"
                      />
                      <Button
                        onClick={handleItineraryUpload}
                        className="w-full bg-brand-teal hover:bg-brand-pink text-white"
                        disabled={!itineraryFile}
                      >
                        Upload and Update
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CreateTripPage() {
  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`}
        onLoad={() => {}}
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
          </div>
        }
      >
        <CreateTripContent />
      </Suspense>
    </>
  );
}