// app/create-trip/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import TravelDetailsStep from "./TravelDetailsStep";
import GetReadyStep from "./GetReadyStep";
import StepIndicator from "./StepIndicator";
import Chatbot from "./Chatbot";

interface TripData {
  tripType: string[];
  travelers: { adults: number; children: number; pets: number };
  departure: string;
  destination: string;
  departurePlaceId: string;
  destinationPlaceId: string;
  destinationCountry: string;
  origin_vet: { name: string; address: string; phone: string }[];
  destination_vet: { name: string; address: string; phone: string }[];
  dates: { start: string | null; end: string | null };
  method: string;
  interests: string[];
}

interface PetPolicy {
  country_name: string;
  entry_requirements: Array<{
    step: number;
    text: string;
    label: string;
  }>;
  additional_info: {
    pet_passport?: string;
  };
  external_links: Array<{
    url: string;
    title: string;
  }>;
  quarantine_info: string;
}

export default function CreateTripPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [tripData, setTripData] = useState<TripData>({
    tripType: [],
    travelers: { adults: 0, children: 0, pets: 0 },
    departure: "",
    destination: searchParams.get("destination") || "",
    departurePlaceId: "",
    destinationPlaceId: "",
    destinationCountry: "",
    origin_vet: [],
    destination_vet: [],
    dates: { start: null, end: null },
    method: "",
    interests: [],
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({}); // Define errors state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [showItineraryUpload, setShowItineraryUpload] = useState(false);
  const [itineraryFile, setItineraryFile] = useState<File | null>(null);
  const [autocompleteLoaded, setAutocompleteLoaded] = useState(false);
  const [petPolicy, setPetPolicy] = useState<PetPolicy | null>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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
          departure: tripData.departure,
          destination: tripData.destination,
          origin_vet: tripData.origin_vet,
          destination_vet: tripData.destination_vet,
          dates: tripData.dates,
          method: tripData.method,
          archived: false,
          status: "upcoming",
        })
        .select()
        .single();

      if (error) throw error;

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
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, itineraryFile);

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
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`}
        onLoad={() => setAutocompleteLoaded(true)}
      />
      <div className="min-h-screen bg-gradient-to-r from-brand-teal/5 to-brand-pink/5 py-12">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6">
          {/* Chatbot Sidebar */}
          <div className="lg:w-1/4 w-full">
            <Chatbot isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} />
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4 w-full max-w-5xl mx-auto">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl text-brand-teal">
                  {step === 1 && "Where to Go"}
                  {step === 2 && "Who’s Traveling"}
                  {step === 3 && "Travel Details"}
                  {step === 4 && "Get Ready"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StepIndicator currentStep={step} totalSteps={4} />
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
                  />
                )}
                {step === 3 && (
                  <TravelDetailsStep
                    tripData={tripData}
                    setTripData={setTripData}
                    errors={errors}
                    setErrors={setErrors}
                    onNext={handleNext}
                    onBack={handleBack}
                  />
                )}
                {step === 4 && (
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
    </>
  );
}