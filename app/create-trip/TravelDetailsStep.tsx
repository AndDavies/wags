// app/create-trip/TravelDetailsStep.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

interface TravelDetailsStepProps {
  tripData: {
    dates: { start: string | null; end: string | null };
    interests: string[];
  };
  setTripData: React.Dispatch<React.SetStateAction<any>>;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onNext: () => void;
  onBack: () => void;
}

export default function TravelDetailsStep({
  tripData,
  setTripData,
  errors,
  setErrors,
  onNext,
  onBack,
}: TravelDetailsStepProps) {
  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (tripData.interests.length === 0) {
      newErrors.interests = "Please select at least one interest.";
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
    setTripData((prev: any) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i: string) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Start Date (Optional)</Label>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand-teal" />
          <DatePicker
            selected={tripData.dates.start ? new Date(tripData.dates.start) : null}
            onChange={(date: Date | null) =>
              setTripData({
                ...tripData,
                dates: { ...tripData.dates, start: date ? date.toISOString() : null },
              })
            }
            className="border border-brand-teal/50 rounded p-2 w-full text-offblack"
            placeholderText="Select start date"
          />
        </div>
      </div>
      <div>
        <Label>End Date (Optional)</Label>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-brand-teal" />
          <DatePicker
            selected={tripData.dates.end ? new Date(tripData.dates.end) : null}
            onChange={(date: Date | null) =>
              setTripData({
                ...tripData,
                dates: { ...tripData.dates, end: date ? date.toISOString() : null },
              })
            }
            className="border border-brand-teal/50 rounded p-2 w-full text-offblack"
            placeholderText="Select end date"
          />
        </div>
        <p className="text-offblack/70 text-sm mt-2">
          Don’t know your dates yet? You can proceed without them, and we’ll provide the best itinerary based on your input.
        </p>
      </div>
      <div>
        <Label>What activities are you interested in?</Label>
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
        {errors.interests && <p className="text-red-500 text-sm">{errors.interests}</p>}
      </div>
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