import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TripData } from "./types";

interface TravelersStepProps {
  tripData: TripData;
  setTripData: React.Dispatch<React.SetStateAction<TripData>>;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onNext: () => void;
  onBack: () => void;
  userPets: { id: string; name: string }[];
}

export default function TravelersStep({
  tripData,
  setTripData,
  errors,
  setErrors,
  onNext,
  onBack,
  userPets,
}: TravelersStepProps) {
  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (tripData.travelers.adults + tripData.travelers.pets === 0) {
      newErrors.travelers = "At least one adult or pet is required.";
    }
    if (tripData.travelers.adults < 0 || tripData.travelers.children < 0 || tripData.travelers.pets < 0) {
      newErrors.travelers = "Traveler counts cannot be negative.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextWithValidation = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const handleInterestToggle = (interest: string) => {
    setTripData((prev: TripData) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i: string) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handlePetToggle = (petId: string) => {
    setTripData((prev: TripData) => {
      const newPets = prev.pets.includes(petId)
        ? prev.pets.filter((id) => id !== petId)
        : [...prev.pets, petId];
      return {
        ...prev,
        pets: newPets,
        travelers: {
          ...prev.travelers,
          pets: newPets.length, // Update pet count
        },
      };
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Adults</Label>
        <Input
          type="number"
          min="0"
          value={tripData.travelers.adults}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTripData({
              ...tripData,
              travelers: { ...tripData.travelers, adults: Number(e.target.value) },
            })
          }
          className="border-brand-teal/50"
        />
      </div>
      <div>
        <Label>Children</Label>
        <Input
          type="number"
          min="0"
          value={tripData.travelers.children}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTripData({
              ...tripData,
              travelers: { ...tripData.travelers, children: Number(e.target.value) },
            })
          }
          className="border-brand-teal/50"
        />
      </div>
      <div>
        <Label>Pets</Label>
        {userPets.length > 0 ? (
          <div className="space-y-2">
            {userPets.map((pet) => (
              <div key={pet.id} className="flex items-center space-x-2">
                <Checkbox
                  id={pet.id}
                  checked={tripData.pets.includes(pet.id)}
                  onCheckedChange={() => handlePetToggle(pet.id)}
                />
                <Label htmlFor={pet.id}>{pet.name}</Label>
              </div>
            ))}
          </div>
        ) : (
          <Input
            type="number"
            min="0"
            value={tripData.travelers.pets}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTripData({
                ...tripData,
                travelers: { ...tripData.travelers, pets: Number(e.target.value) },
                pets: [], // Clear pet IDs if manually setting
              })
            }
            className="border-brand-teal/50"
          />
        )}
      </div>
      <div>
        <Label>What activities are you interested in? (Optional)</Label>
        <div className="flex flex-wrap gap-2">
          {[
            "Relaxing Beach",
            "Adventure and Exploration",
            "Cultural Immersion",
            "Romantic Getaway",
            "Family-Friendly",
            "Luxury Stay",
            "Budget-Friendly",
            "Solo Travel",
            "Historical Tour",
            "Culinary Experience",
            "Wellness Retreat",
            "Eco-Tourism",
            "Other",
          ].map((interest) => (
            <Button
              key={interest}
              variant={tripData.interests.includes(interest) ? "default" : "outline"}
              className={
                tripData.interests.includes(interest)
                  ? "bg-brand-teal text-white hover:bg-brand-pink"
                  : "border-brand-teal text-brand-teal hover:bg-brand-teal/10"
              }
              onClick={() => handleInterestToggle(interest)}
            >
              {interest}
            </Button>
          ))}
        </div>
      </div>
      {errors.travelers && <p className="text-red-500 text-sm">{errors.travelers}</p>}
      <div className="flex gap-2">
        <Button
          onClick={onBack}
          variant="outline"
          className="w-full border-brand-teal text-brand-teal hover:bg-brand-teal/10"
        >
          Back
        </Button>
        <Button
          onClick={handleNextWithValidation}
          className="w-full bg-brand-teal hover:bg-brand-pink text-white"
        >
          Next
        </Button>
      </div>
    </div>
  );
}