// app/create-trip/TravelersStep.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TravelersStepProps {
  tripData: {
    travelers: { adults: number; children: number; pets: number };
  };
  setTripData: React.Dispatch<React.SetStateAction<any>>;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onNext: () => void;
  onBack: () => void;
}

export default function TravelersStep({
  tripData,
  setTripData,
  errors,
  setErrors,
  onNext,
  onBack,
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
        <Input
          type="number"
          min="0"
          value={tripData.travelers.pets}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTripData({
              ...tripData,
              travelers: { ...tripData.travelers, pets: Number(e.target.value) },
            })
          }
          className="border-brand-teal/50"
        />
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