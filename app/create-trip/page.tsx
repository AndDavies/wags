// app/create-trip/page.tsx
"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, MapPin, Calendar as CalendarIcon, PawPrint, Plus, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface TripData {
  travelers: { adults: number; children: number; pets: number };
  departure: string;
  destination: string;
  origin_vet: { name: string; address: string; phone: string }[];
  destination_vet: { name: string; address: string; phone: string }[];
  dates: { start: Date | null; end: Date | null };
  method: string;
}

interface ChecklistItem {
  icon: React.ReactNode;
  text: string;
}

export default function CreateTrip() {
  const [step, setStep] = useState(1);
  const [tripData, setTripData] = useState<TripData>({
    travelers: { adults: 0, children: 0, pets: 0 },
    departure: "",
    destination: "",
    origin_vet: [], // Initialize as empty array
    destination_vet: [], // Initialize as empty array
    dates: { start: null, end: null },
    method: "",
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };
  const handleBack = () => setStep(step - 1);

  const validateStep = () => {
    if (step === 1 && (tripData.travelers.adults < 1 && tripData.travelers.pets < 1)) {
      setError("Please add at least one adult or pet.");
      return false;
    }
    if (step === 2 && (!tripData.departure || !tripData.destination)) {
      setError("Please enter both departure and destination.");
      return false;
    }
    if (step === 4 && (!tripData.dates.start || !tripData.method)) {
      setError("Please select a start date and travel method.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      console.error("Error fetching user:", userError);
      setError("Authentication failed. Please log in again.");
      return;
    }

    const { error: insertError } = await supabase.from("trips").insert({
      user_id: user.id,
      travelers: tripData.travelers,
      departure: tripData.departure,
      destination: tripData.destination,
      origin_vet: tripData.origin_vet,
      destination_vet: tripData.destination_vet,
      dates: {
        start: tripData.dates.start?.toISOString().split("T")[0],
        end: tripData.dates.end?.toISOString().split("T")[0] || null,
      },
      method: tripData.method,
      archived: false,
      status: "upcoming",
    });

    if (insertError) {
      console.error("Error saving trip:", insertError);
      setError("Failed to save trip. Please try again.");
    } else {
      setStep(5);
    }
  };

  const getChecklist = (): ChecklistItem[] => {
    const baseChecklist: ChecklistItem[] = [
      { icon: <CalendarIcon className="h-5 w-5 text-brand-teal" />, text: "Pet health certificate" },
      { icon: <CalendarIcon className="h-5 w-5 text-brand-teal" />, text: "Rabies vaccination" },
    ];
    if (tripData.method === "flight") {
      baseChecklist.push({
        icon: <CalendarIcon className="h-5 w-5 text-brand-teal" />,
        text: "Airline pet policy confirmation",
      });
    }
    if (tripData.travelers.pets > 0) {
      baseChecklist.push({
        icon: <CalendarIcon className="h-5 w-5 text-brand-teal" />,
        text: "Pet passport or ID tag",
      });
    }
    return baseChecklist;
  };

  const addVet = (type: "origin" | "destination") => {
    const newVet = { name: "", address: "", phone: "" };
    if (type === "origin") {
      setTripData({
        ...tripData,
        origin_vet: [...tripData.origin_vet, newVet],
      });
    } else {
      setTripData({
        ...tripData,
        destination_vet: [...tripData.destination_vet, newVet],
      });
    }
  };

  const removeVet = (type: "origin" | "destination", index: number) => {
    if (type === "origin") {
      setTripData({
        ...tripData,
        origin_vet: tripData.origin_vet.filter((_, i) => i !== index),
      });
    } else {
      setTripData({
        ...tripData,
        destination_vet: tripData.destination_vet.filter((_, i) => i !== index),
      });
    }
  };

  const updateVet = (type: "origin" | "destination", index: number, field: string, value: string) => {
    if (type === "origin") {
      const updatedVets = [...tripData.origin_vet];
      updatedVets[index] = { ...updatedVets[index], [field]: value };
      setTripData({ ...tripData, origin_vet: updatedVets });
    } else {
      const updatedVets = [...tripData.destination_vet];
      updatedVets[index] = { ...updatedVets[index], [field]: value };
      setTripData({ ...tripData, destination_vet: updatedVets });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-brand-teal/5 to-brand-pink/5 py-20">
      <div className="container mx-auto px-4 pt-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-display text-brand-teal mb-2">Plan Your Trip</h1>
            <p className="text-offblack">Create a pet-friendly travel itinerary</p>
          </div>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-brand-teal">
                Step {step} of 5
              </CardTitle>
              <CardDescription>
                {step === 1 && "Who’s traveling with you?"}
                {step === 2 && "Where are you going?"}
                {step === 3 && "Add vet(s) for your trip"}
                {step === 4 && "When and how are you traveling?"}
                {step === 5 && "Your Travel Checklist"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {error && <p className="text-red-500 text-center mb-4">{error}</p>}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-brand-teal" />
                    <label className="text-offblack w-24">Adults</label>
                    <input
                      type="number"
                      min="0"
                      value={tripData.travelers.adults}
                      onChange={(e) =>
                        setTripData({
                          ...tripData,
                          travelers: { ...tripData.travelers, adults: Number(e.target.value) },
                        })
                      }
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-brand-teal" />
                    <label className="text-offblack w-24">Children</label>
                    <input
                      type="number"
                      min="0"
                      value={tripData.travelers.children}
                      onChange={(e) =>
                        setTripData({
                          ...tripData,
                          travelers: { ...tripData.travelers, children: Number(e.target.value) },
                        })
                      }
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-brand-teal" />
                    <label className="text-offblack w-24">Pets</label>
                    <input
                      type="number"
                      min="0"
                      value={tripData.travelers.pets}
                      onChange={(e) =>
                        setTripData({
                          ...tripData,
                          travelers: { ...tripData.travelers, pets: Number(e.target.value) },
                        })
                      }
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                    />
                  </div>
                  <Button
                    onClick={handleNext}
                    className="bg-brand-teal hover:bg-brand-pink text-white w-full py-3 rounded-md"
                  >
                    Next
                  </Button>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-brand-teal" />
                    <label className="text-offblack w-24">Departure</label>
                    <input
                      value={tripData.departure}
                      onChange={(e) => setTripData({ ...tripData, departure: e.target.value })}
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                      placeholder="e.g., New York"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-brand-teal" />
                    <label className="text-offblack w-24">Destination</label>
                    <input
                      value={tripData.destination}
                      onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                      placeholder="e.g., Paris"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal/10 w-full py-3 rounded-md"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="bg-brand-teal hover:bg-brand-pink text-white w-full py-3 rounded-md"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-offblack">Origin Vet(s)</h3>
                    {tripData.origin_vet.map((vet, index) => (
                      <div key={index} className="space-y-2 border border-brand-teal/50 rounded-md p-4">
                        <div className="flex items-center gap-2">
                          <label className="text-offblack w-24">Name</label>
                          <input
                            value={vet.name}
                            onChange={(e) => updateVet("origin", index, "name", e.target.value)}
                            className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                            placeholder="e.g., Downtown Vet Clinic"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-offblack w-24">Address</label>
                          <input
                            value={vet.address}
                            onChange={(e) => updateVet("origin", index, "address", e.target.value)}
                            className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                            placeholder="e.g., 123 Main St, New York, NY"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-offblack w-24">Phone</label>
                          <input
                            value={vet.phone}
                            onChange={(e) => updateVet("origin", index, "phone", e.target.value)}
                            className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                            placeholder="e.g., 555-123-4567"
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeVet("origin", index)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => addVet("origin")}
                      className="bg-brand-teal hover:bg-brand-pink text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Origin Vet
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-offblack">Destination Vet(s)</h3>
                    {tripData.destination_vet.map((vet, index) => (
                      <div key={index} className="space-y-2 border border-brand-teal/50 rounded-md p-4">
                        <div className="flex items-center gap-2">
                          <label className="text-offblack w-24">Name</label>
                          <input
                            value={vet.name}
                            onChange={(e) => updateVet("destination", index, "name", e.target.value)}
                            className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                            placeholder="e.g., Uptown Vet Clinic"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-offblack w-24">Address</label>
                          <input
                            value={vet.address}
                            onChange={(e) => updateVet("destination", index, "address", e.target.value)}
                            className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                            placeholder="e.g., 456 Oak St, Paris, FR"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-offblack w-24">Phone</label>
                          <input
                            value={vet.phone}
                            onChange={(e) => updateVet("destination", index, "phone", e.target.value)}
                            className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                            placeholder="e.g., 555-987-6543"
                          />
                        </div>
                        <Button
                          variant="outline"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeVet("destination", index)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => addVet("destination")}
                      className="bg-brand-teal hover:bg-brand-pink text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Destination Vet
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal/10 w-full py-3 rounded-md"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="bg-brand-teal hover:bg-brand-pink text-white w-full py-3 rounded-md"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-offblack flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6 text-brand-teal" />
                      Start Date
                    </label>
                    <DatePicker
                      selected={tripData.dates.start}
                      onChange={(date: Date | null) =>
                        setTripData({
                          ...tripData,
                          dates: { ...tripData.dates, start: date },
                        })
                      }
                      dateFormat="yyyy-MM-dd"
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                      placeholderText="Select start date"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-offblack flex items-center gap-2">
                      <CalendarIcon className="h-6 w-6 text-brand-teal" />
                      End Date (Optional)
                    </label>
                    <DatePicker
                      selected={tripData.dates.end}
                      onChange={(date: Date | null) =>
                        setTripData({
                          ...tripData,
                          dates: { ...tripData.dates, end: date },
                        })
                      }
                      dateFormat="yyyy-MM-dd"
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                      placeholderText="Select end date"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-offblack w-24">Travel Method</label>
                    <select
                      value={tripData.method}
                      onChange={(e) => setTripData({ ...tripData, method: e.target.value })}
                      className="border border-brand-teal/50 rounded-md p-3 w-full text-offblack"
                    >
                      <option value="">Select Method</option>
                      <option value="flight">Flight</option>
                      <option value="car">Car</option>
                      <option value="train">Train</option>
                      <option value="ferry">Ferry</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal/10 w-full py-3 rounded-md"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-brand-teal hover:bg-brand-pink text-white w-full py-3 rounded-md"
                    >
                      Save Trip
                    </Button>
                  </div>
                </div>
              )}
              {step === 5 && (
                <div className="space-y-6 text-center">
                  <PawPrint className="h-12 w-12 text-brand-teal mx-auto mb-4" />
                  <h2 className="text-2xl font-display text-brand-teal">
                    Your Trip to {tripData.destination} is Ready!
                  </h2>
                  <p className="text-offblack/70 mt-2">
                    Here’s your pet-friendly checklist to get started.
                  </p>
                  <ul className="space-y-4">
                    {getChecklist().map((item, index) => (
                      <li key={index} className="flex items-center gap-3 bg-brand-teal/5 p-3 rounded">
                        {item.icon}
                        <span className="text-offblack">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => router.push("/profile")}
                    className="bg-brand-teal hover:bg-brand-pink text-white w-full py-3 rounded-md"
                  >
                    Back to Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}