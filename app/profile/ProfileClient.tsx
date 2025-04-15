// app/profile/ProfileClient.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { PawPrint, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardFooter, CardTitle } from "@/components/ui/card";
import TripCard from "@/components/app/TripCard";

interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  medical_history: string | null;
}

interface Trip {
  id: string;
  departure: string;
  destination: string;
  dates: { start: string; end: string };
  method: string;
  travelers: { adults: number; children: number; pets: number };
  archived: boolean;
  status: string;
  user_id: string;
}

interface ProfileClientProps {
  userId: string;
  initialPets: Pet[];
  initialTrips: Trip[];
}

export default function ProfileClient({ userId, initialPets, initialTrips }: ProfileClientProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [trips, setTrips] = useState<Trip[]>(initialTrips); // Add local trips state

  const handleArchiveToggle = (tripId: string) => {
    setTrips((prevTrips) =>
      prevTrips.map((trip) =>
        trip.id === tripId ? { ...trip, archived: !trip.archived } : trip
      )
    );
  };

  const currentTrips = trips.filter((trip) => !trip.archived);
  const archivedTrips = trips.filter((trip) => trip.archived);

  return (
    <div className="md:col-span-2 space-y-6">
      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-xl text-brand-teal">Your Pets</CardTitle>
            <CardDescription>Add and manage your furry travel companions</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <AddPetForm userId={userId} />
          {initialPets.length ? (
            <ul className="space-y-4 mt-4">
              {initialPets.map((pet) => (
                <li key={pet.id} className="flex items-center gap-3 bg-brand-teal/5 p-3 rounded">
                  <PawPrint className="h-5 w-5 text-brand-teal" />
                  <span className="text-offblack">
                    {pet.name} ({pet.breed}, {pet.age} yrs, {pet.weight} lbs)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-brand-pink/10 rounded-full p-4 mb-4">
                <PawPrint className="h-8 w-8 text-brand-teal" />
              </div>
              <h3 className="text-lg font-medium text-offblack mb-2">No pets added yet</h3>
              <p className="text-offblack/70 max-w-md">
                Add your pets to keep track of their travel documents and preferences.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-xl text-brand-teal">Recent Trips</CardTitle>
            <CardDescription>Your pet travel history and documents</CardDescription>
          </div>
          {archivedTrips.length > 0 && (
            <Button
              onClick={() => setShowArchived(!showArchived)}
              variant="outline"
              className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
            >
              {showArchived ? "Hide Archived" : "View Archived"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {currentTrips.length || showArchived ? (
            <>
              {currentTrips.length ? (
                <ul className="space-y-4">
                  {currentTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={{ ...trip, userId }}
                      onArchiveToggle={() => handleArchiveToggle(trip.id)}
                    />
                  ))}
                </ul>
              ) : (
                !showArchived && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-offblack/70 mb-4">
                      No current trips. Trip creation is currently unavailable.
                    </p>
                    <Button
                      variant="outline"
                      className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                      disabled
                    >
                      Trip Planning Coming Soon
                    </Button>
                  </div>
                )
              )}
              {showArchived && archivedTrips.length > 0 && (
                <>
                  <h3 className="text-lg font-medium text-offblack mt-6 mb-4">Archived Trips</h3>
                  <ul className="space-y-4">
                    {archivedTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={{ ...trip, userId }}
                        onArchiveToggle={() => handleArchiveToggle(trip.id)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-offblack/70 mb-4">
                No trips yet. Trip creation is currently unavailable.
              </p>
              <Button
                variant="outline"
                className="border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                disabled
              >
                Trip Planning Coming Soon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// AddPetForm remains unchanged
function AddPetForm({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [petData, setPetData] = useState({
    name: "",
    breed: "",
    age: "",
    weight: "",
    medical_history: "",
  });
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleAddPet = async () => {
    if (!petData.name || !petData.breed || !petData.age || !petData.weight) {
      setError("Please fill in all required fields.");
      return;
    }

    const { error } = await supabase.from("pets").insert({
      user_id: userId,
      name: petData.name,
      breed: petData.breed,
      age: Number(petData.age),
      weight: Number(petData.weight),
      medical_history: petData.medical_history || null,
    });

    if (!error) {
      setIsOpen(false);
      setPetData({ name: "", breed: "", age: "", weight: "", medical_history: "" });
      setError(null);
      window.location.reload(); // TODO: Replace with state update if pets are managed locally
    } else {
      console.error("Error adding pet:", error);
      setError("Failed to add pet. Please try again.");
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="mb-4 bg-brand-teal hover:bg-brand-pink text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Pet
      </Button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-brand-teal">Add a Pet</CardTitle>
              <CardDescription>Your furry travel buddy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-red-500 text-center">{error}</p>}
              <div className="flex items-center gap-2">
                <label className="text-offblack w-24">Name *</label>
                <input
                  value={petData.name}
                  onChange={(e) => setPetData({ ...petData, name: e.target.value })}
                  className="border border-brand-teal/50 rounded p-2 w-full text-offblack"
                  placeholder="e.g., Max"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-offblack w-24">Breed *</label>
                <input
                  value={petData.breed}
                  onChange={(e) => setPetData({ ...petData, breed: e.target.value })}
                  className="border border-brand-teal/50 rounded p-2 w-full text-offblack"
                  placeholder="e.g., Labrador"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-offblack w-24">Age (years) *</label>
                <input
                  type="number"
                  min="0"
                  value={petData.age}
                  onChange={(e) => setPetData({ ...petData, age: e.target.value })}
                  className="border border-brand-teal/50 rounded p-2 w-full text-offblack"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-offblack w-24">Weight (lbs) *</label>
                <input
                  type="number"
                  min="0"
                  value={petData.weight}
                  onChange={(e) => setPetData({ ...petData, weight: e.target.value })}
                  className="border border-brand-teal/50 rounded p-2 w-full text-offblack"
                />
              </div>
              <div className="flex items-start gap-2">
                <label className="text-offblack w-24">Medical History</label>
                <textarea
                  value={petData.medical_history}
                  onChange={(e) => setPetData({ ...petData, medical_history: e.target.value })}
                  className="border border-brand-teal/50 rounded p-2 w-full text-offblack min-h-[80px]"
                  placeholder="e.g., Allergies, medications"
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
                className="border-brand-teal text-brand-teal hover:bg-brand-teal/10 w-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPet}
                className="bg-brand-teal hover:bg-brand-pink text-white w-full"
              >
                Save Pet
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}