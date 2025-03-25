// app/create-trip/GetReadyStep.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PetFriendlyLocations from "@/components/app/PetFriendlyLocations";
import { CheckCircle, Plane, Car, Hotel, PawPrint, Activity, Upload } from "lucide-react";
import { TripData, PetPolicy } from "./types"; // Import shared types

interface ChecklistItem {
  icon: React.ReactNode;
  text: string;
}

interface GetReadyStepProps {
  tripData: TripData;
  petPolicy: PetPolicy | null;
  isLoggedIn: boolean;
  onSave: () => void;
  onDownload: () => void;
  onBack: () => void;
}

export default function GetReadyStep({
  tripData,
  petPolicy,
  isLoggedIn,
  onSave,
  onDownload,
  onBack,
}: GetReadyStepProps) {
  const getChecklist = (): ChecklistItem[] => {
    const baseChecklist: ChecklistItem[] = [
      { icon: <CheckCircle className="h-5 w-5 text-brand-teal" />, text: "Pet health certificate" },
      { icon: <CheckCircle className="h-5 w-5 text-brand-teal" />, text: "Rabies vaccination" },
    ];
    if (tripData.method === "flight") {
      baseChecklist.push({
        icon: <CheckCircle className="h-5 w-5 text-brand-teal" />,
        text: "Airline pet policy confirmation",
      });
    }
    if (tripData.travelers.pets > 0) {
      baseChecklist.push({
        icon: <CheckCircle className="h-5 w-5 text-brand-teal" />,
        text: "Pet passport or ID tag",
      });
    }
    if (petPolicy) {
      petPolicy.entry_requirements.forEach((req) => {
        if (req.text !== "Not specified") {
          baseChecklist.push({
            icon: <CheckCircle className="h-5 w-5 text-brand-teal" />,
            text: `${req.label} for ${petPolicy.country_name}: ${req.text}`,
          });
        }
      });
      if (petPolicy.quarantine_info && petPolicy.quarantine_info !== "Not specified") {
        baseChecklist.push({
          icon: <CheckCircle className="h-5 w-5 text-brand-teal" />,
          text: `Quarantine info for ${petPolicy.country_name}: ${petPolicy.quarantine_info}`,
        });
      }
    }
    return baseChecklist;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-offblack mb-2">Checklist</h3>
        <ul className="space-y-2">
          {getChecklist().map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              {item.icon}
              <span className="text-offblack">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-medium text-offblack mb-2">Itinerary Preview</h3>
        <Card className="border-none shadow-md">
          <CardContent className="space-y-4 pt-4">
            <div>
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-brand-teal" />
                <h4 className="text-sm font-medium text-offblack">Flight</h4>
              </div>
              <p className="text-offblack/70 mt-1">
                {tripData.departure} to {tripData.destination}
                {tripData.dates.start
                  ? ` on ${new Date(tripData.dates.start).toLocaleDateString()}`
                  : " (TBD)"}
              </p>
              <Button
                variant="outline"
                className="mt-2 border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                onClick={() => alert("Flight booking coming soon!")}
              >
                Book Flight
              </Button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-brand-teal" />
                <h4 className="text-sm font-medium text-offblack">Transport</h4>
              </div>
              <p className="text-offblack/70 mt-1">
                Pet-friendly taxi in {tripData.destination} (Preview)
              </p>
              <Button
                variant="outline"
                className="mt-2 border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                onClick={() => alert("Transport booking coming soon!")}
              >
                Book Transport
              </Button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Hotel className="h-5 w-5 text-brand-teal" />
                <h4 className="text-sm font-medium text-offblack">Hotel</h4>
              </div>
              <p className="text-offblack/70 mt-1">
                Pet-friendly hotel in {tripData.destination} (Preview)
              </p>
              <Button
                variant="outline"
                className="mt-2 border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                onClick={() => alert("Hotel booking coming soon!")}
              >
                Book Hotel
              </Button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-brand-teal" />
                <h4 className="text-sm font-medium text-offblack">Origin Vet</h4>
              </div>
              {tripData.origin_vet.length > 0 ? (
                tripData.origin_vet.map((vet, index) => (
                  <p key={index} className="text-offblack/70 mt-1">
                    {vet.name} ({vet.address})
                    {vet.phone && (
                      <>
                        <br />
                        <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                          {vet.phone}
                        </a>
                      </>
                    )}
                  </p>
                ))
              ) : (
                <p className="text-offblack/70 mt-1">
                  No origin vet specified. We recommend visiting a vet for a health certificate before flying.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-brand-teal" />
                <h4 className="text-sm font-medium text-offblack">Destination Vet</h4>
              </div>
              {tripData.destination_vet.length > 0 ? (
                tripData.destination_vet.map((vet, index) => (
                  <p key={index} className="text-offblack/70 mt-1">
                    {vet.name} ({vet.address})
                    {vet.phone && (
                      <>
                        <br />
                        <a href={`tel:${vet.phone}`} className="text-brand-teal hover:underline">
                          {vet.phone}
                        </a>
                      </>
                    )}
                  </p>
                ))
              ) : (
                <p className="text-offblack/70 mt-1">
                  No destination vet specified. We recommend having a vet contact at your destination for emergencies.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand-teal" />
                <h4 className="text-sm font-medium text-offblack">Activities</h4>
              </div>
              <p className="text-offblack/70 mt-1">
                Pet-friendly {tripData.interests.join(" or ")} activities in {tripData.destination} (Preview)
              </p>
              <Button
                variant="outline"
                className="mt-2 border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                onClick={() => alert("Activity booking coming soon!")}
              >
                Book Activity
              </Button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-brand-teal" />
                <h4 className="text-sm font-medium text-offblack">Documents</h4>
              </div>
              <p className="text-offblack/70 mt-1">
                Upload vaccination records, health certificates, and more.
              </p>
              {!isLoggedIn && (
                <Button
                  variant="outline"
                  className="mt-2 border-brand-teal text-brand-teal hover:bg-brand-teal/10"
                  onClick={() => alert("Please log in to upload documents.")}
                >
                  Log In to Upload
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-medium text-offblack mb-2">Pet-Friendly Locations (Preview)</h3>
        <PetFriendlyLocations
          destination={tripData.destination}
          destinationPlaceId={tripData.destinationPlaceId}
        />
        {!isLoggedIn && (
          <p className="text-offblack/70 text-sm mt-2">
            Log in to see more pet-friendly locations and save your trip.
          </p>
        )}
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
          onClick={onSave}
          className="w-full bg-brand-teal hover:bg-brand-pink text-white"
        >
          Save Trip
        </Button>
        <Button
          onClick={onDownload}
          className="w-full bg-brand-teal hover:bg-brand-pink text-white"
        >
          Download PDF
        </Button>
      </div>
    </div>
  );
}