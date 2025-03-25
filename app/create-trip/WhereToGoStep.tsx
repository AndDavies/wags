// app/create-trip/WhereToGoStep.tsx
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase-client";

interface PlaceResult {
  formatted_address?: string;
  place_id?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface WhereToGoStepProps {
  tripData: {
    departure: string;
    destination: string;
    departurePlaceId: string;
    destinationPlaceId: string;
    destinationCountry: string;
    origin_vet: { name: string; address: string; phone: string }[];
    destination_vet: { name: string; address: string; phone: string }[];
    method: string;
  };
  setTripData: React.Dispatch<React.SetStateAction<any>>;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onNext: () => void;
  onBack: () => void;
  autocompleteLoaded: boolean;
  petPolicy: any;
  setPetPolicy: React.Dispatch<React.SetStateAction<any>>;
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
}: WhereToGoStepProps) {
  const supabase = createClient();
  const departureInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  let departureAutocomplete: google.maps.places.Autocomplete | null = null;
  let destinationAutocomplete: google.maps.places.Autocomplete | null = null;

  if (autocompleteLoaded && departureInputRef.current && destinationInputRef.current) {
    departureAutocomplete = new google.maps.places.Autocomplete(departureInputRef.current, {
      types: ["(cities)"],
    });
    destinationAutocomplete = new google.maps.places.Autocomplete(destinationInputRef.current, {
      types: ["(cities)"],
    });

    departureAutocomplete.addListener("place_changed", () => {
      const place = departureAutocomplete!.getPlace() as PlaceResult;
      if (place.formatted_address && place.place_id) {
        setTripData((prev: any) => ({
          ...prev,
          departure: place.formatted_address!,
          departurePlaceId: place.place_id!,
        }));
      }
    });

    destinationAutocomplete.addListener("place_changed", async () => {
      const place = destinationAutocomplete!.getPlace() as PlaceResult;
      if (place.formatted_address && place.place_id) {
        setTripData((prev: any) => ({
          ...prev,
          destination: place.formatted_address!,
          destinationPlaceId: place.place_id!,
        }));

        const countryComponent = place.address_components?.find((component) =>
          component.types.includes("country")
        );
        const country = countryComponent?.long_name || "";

        if (country) {
          setTripData((prev: any) => ({
            ...prev,
            destinationCountry: country,
          }));

          const { data, error } = await supabase
            .from("pet_policies")
            .select("*")
            .eq("country_name", country)
            .single();

          if (error) {
            console.error("Error fetching pet policy:", error);
            toast({
              title: "Error",
              description: "Failed to fetch pet travel policies for " + country,
              variant: "destructive",
            });
          } else if (data) {
            setPetPolicy(data);
          }
        }
      }
    });
  }

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

  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};
    if (!tripData.departure) newErrors.departure = "Departure location is required.";
    if (!tripData.destination) newErrors.destination = "Destination is required.";
    tripData.origin_vet.forEach((vet, index) => {
      if (vet.phone && !/^\d{3}-\d{3}-\d{4}$/.test(vet.phone)) {
        newErrors[`origin_vet_${index}_phone`] = "Phone must be in format 123-456-7890.";
      }
    });
    tripData.destination_vet.forEach((vet, index) => {
      if (vet.phone && !/^\d{3}-\d{3}-\d{4}$/.test(vet.phone)) {
        newErrors[`destination_vet_${index}_phone`] = "Phone must be in format 123-456-7890.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextWithValidation = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Departure</Label>
        <Input
          ref={departureInputRef}
          value={tripData.departure}
          onChange={(e) => setTripData({ ...tripData, departure: e.target.value })}
          placeholder="e.g., New York"
          className="border-brand-teal/50"
        />
        {errors.departure && <p className="text-red-500 text-sm">{errors.departure}</p>}
      </div>
      <div>
        <Label>Destination</Label>
        <Input
          ref={destinationInputRef}
          value={tripData.destination}
          onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
          placeholder="e.g., Paris"
          className="border-brand-teal/50"
        />
        {errors.destination && <p className="text-red-500 text-sm">{errors.destination}</p>}
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-offblack">Origin Vet(s) (Optional)</h3>
        <p className="text-offblack/70 text-sm">
          We recommend having a vet visit for a health certificate before your trip.
        </p>
        {tripData.origin_vet.map((vet, index) => (
          <div key={index} className="space-y-2 border border-brand-teal/50 rounded-md p-4">
            <div className="flex items-center gap-2">
              <Label className="w-24">Name</Label>
              <Input
                value={vet.name}
                onChange={(e) => updateVet("origin", index, "name", e.target.value)}
                placeholder="e.g., Downtown Vet Clinic"
                className="border-brand-teal/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24">Address</Label>
              <Input
                value={vet.address}
                onChange={(e) => updateVet("origin", index, "address", e.target.value)}
                placeholder="e.g., 123 Main St, New York, NY"
                className="border-brand-teal/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24">Phone</Label>
              <Input
                value={vet.phone}
                onChange={(e) => updateVet("origin", index, "phone", e.target.value)}
                placeholder="e.g., 555-123-4567"
                className="border-brand-teal/50"
              />
              {errors[`origin_vet_${index}_phone`] && (
                <p className="text-red-500 text-sm">{errors[`origin_vet_${index}_phone`]}</p>
              )}
            </div>
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700"
              onClick={() => removeVet("origin", index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          onClick={() => addVet("origin")}
          className="bg-brand-teal hover:bg-brand-pink text-white"
        >
          Add Origin Vet
        </Button>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-offblack">Destination Vet(s) (Optional)</h3>
        <p className="text-offblack/70 text-sm">
          We recommend having a vet contact at your destination for emergencies.
        </p>
        {tripData.destination_vet.map((vet, index) => (
          <div key={index} className="space-y-2 border border-brand-teal/50 rounded-md p-4">
            <div className="flex items-center gap-2">
              <Label className="w-24">Name</Label>
              <Input
                value={vet.name}
                onChange={(e) => updateVet("destination", index, "name", e.target.value)}
                placeholder="e.g., Uptown Vet Clinic"
                className="border-brand-teal/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24">Address</Label>
              <Input
                value={vet.address}
                onChange={(e) => updateVet("destination", index, "address", e.target.value)}
                placeholder="e.g., 456 Oak St, Paris, FR"
                className="border-brand-teal/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-24">Phone</Label>
              <Input
                value={vet.phone}
                onChange={(e) => updateVet("destination", index, "phone", e.target.value)}
                placeholder="e.g., 555-987-6543"
                className="border-brand-teal/50"
              />
              {errors[`destination_vet_${index}_phone`] && (
                <p className="text-red-500 text-sm">{errors[`destination_vet_${index}_phone`]}</p>
              )}
            </div>
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700"
              onClick={() => removeVet("destination", index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          onClick={() => addVet("destination")}
          className="bg-brand-teal hover:bg-brand-pink text-white"
        >
          Add Destination Vet
        </Button>
      </div>
      <div>
        <Label>Travel Method (Optional)</Label>
        <Select
          value={tripData.method}
          onValueChange={(value) => setTripData({ ...tripData, method: value })}
        >
          <SelectTrigger className="border-brand-teal/50">
            <SelectValue placeholder="Select travel method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="flight">Flight</SelectItem>
            <SelectItem value="car">Car</SelectItem>
            <SelectItem value="train">Train</SelectItem>
            <SelectItem value="ferry">Ferry</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
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
          className="w-full bg-brand-teal hover:bg-brand-pink text-white"
        >
          Next
        </Button>
      </div>
    </div>
  );
}