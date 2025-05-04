'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Use Shadcn card
import { MapPin, Sun, Target, Lightbulb, Zap } from 'lucide-react'; // Example icons
import { TripData } from '@/store/tripStore'; // Import TripData type

/**
 * Type definition for the props expected by MarketingSidebar.
 */
interface MarketingSidebarProps {
  className?: string;
  // NEW: Callback function when an example trip is selected
  onSelectExampleTrip?: (exampleTripData: Partial<TripData>) => void;
}

/**
 * MarketingSidebar Component
 * Displays suggestions, inspiration, and potentially marketing content in the right sidebar.
 * @param {MarketingSidebarProps} props - Component props.
 * @returns {JSX.Element}
 */
const MarketingSidebar: React.FC<MarketingSidebarProps> = ({ className, onSelectExampleTrip }) => {
  // Placeholder data - replace with dynamic content later
  const destination = "Mount Hope"; // Example - Fetch from store or props later
  const suggestions = [
    { title: "Checked Flag Bar & Grill", type: "American", image: "/placeholder-image.jpg" },
    { title: "The Pigeon", type: "Fusion", image: "/placeholder-image.jpg" },
  ];
  const getStarted = [
    { title: "Take our travel quiz", image: "/placeholder-start-1.jpg" },
    { title: "Create a trip", image: "/placeholder-start-2.jpg" },
  ];
  const getInspired = [
    { title: "San Diego in 72 Hours", image: "/placeholder-inspire-1.jpg" },
    { title: "Asia's 50 Best Bars 2023", image: "/placeholder-inspire-2.jpg" },
  ];

  // --- Example Trip Data ---
  const exampleTrips: Array<Partial<TripData> & { title: string; description: string; imageUrl: string; durationEstimate?: string }> = [
    {
      title: "Parisian Paws: City Break",
      description: "Explore iconic sights & dog-friendly cafes.",
      imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Placeholder Paris image
      durationEstimate: "4 days",
      destination: "Paris",
      destinationCountry: "France",
      interests: ["Sightseeing", "Food Tours", "Local Experiences"],
      budget: "Moderate",
      accommodation: "Hotel",
      adults: 2,
      pets: 1,
      petDetails: [{ type: 'Dog', size: 'Small' }]
    },
    {
      title: "Rocky Mountain Rover",
      description: "Adventure awaits with hikes and scenic drives.",
      imageUrl: "https://images.unsplash.com/photo-1617020896981-31General0fe8cc9a1c?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Placeholder Mountain image
      durationEstimate: "7 days",
      destination: "Banff National Park",
      destinationCountry: "Canada",
      interests: ["Outdoor Adventures", "Photography", "Wildlife Viewing"],
      budget: "Moderate",
      accommodation: "Cabin",
      adults: 2,
      pets: 1,
      petDetails: [{ type: 'Dog', size: 'Large' }]
    },
     {
      title: "Coastal Canine Getaway",
      description: "Relax on dog-friendly beaches and coastal trails.",
      imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", // Placeholder Beach image
      durationEstimate: "5 days",
      destination: "Cornwall",
      destinationCountry: "UK",
      interests: ["Water Activities", "Outdoor Adventures", "Local Experiences"],
      budget: "Budget",
      accommodation: "Home",
      adults: 2,
      pets: 1,
      petDetails: [{ type: 'Dog', size: 'Medium' }]
    },
  ];

  return (
    <div className={cn("h-full bg-white p-4 md:p-6 overflow-y-auto scrollbar-thin", className)}>
      <h2 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Get Inspired</h2>

      {/* Example Trips Section */}
      <div className="space-y-4 mb-6">
        {exampleTrips.map((trip, index) => (
          <div
            key={index}
            onClick={() => onSelectExampleTrip?.(trip)} // Call callback on click
            className="relative rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-300 cursor-pointer group h-40" // Fixed height
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${trip.imageUrl})` }}
            />
            {/* Dark Overlay for text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
            {/* Content */}
            <div className="absolute bottom-0 left-0 p-3 text-white w-full">
              <h3 className="text-base font-semibold mb-1 line-clamp-1">{trip.title}</h3>
              <p className="text-xs text-gray-200 line-clamp-1">{trip.description}</p>
              {trip.durationEstimate && (
                  <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded mt-1 inline-block">{trip.durationEstimate}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tips Section - Keep existing structure */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Planning Tips</h2>
      <div className="space-y-4">
        <div className="flex items-start p-3 bg-teal-50 rounded-lg border border-teal-100">
          <Lightbulb className="h-5 w-5 text-teal-600 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-sm text-teal-800 mb-1">Check Regulations Early</h3>
            <p className="text-xs text-teal-700 leading-snug">
              Pet import rules vary by country (and even region!). Look up microchip, vaccination, and quarantine requirements well in advance.
            </p>
          </div>
        </div>

        <div className="flex items-start p-3 bg-mustard-50 rounded-lg border border-mustard-100">
          <Zap className="h-5 w-5 text-mustard-600 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-sm text-mustard-800 mb-1">Pet-Friendly Filters Are Key</h3>
            <p className="text-xs text-mustard-700 leading-snug">
              When booking flights or hotels, always use pet-friendly filters and double-check the specific policies (size limits, fees, allowed areas).
            </p>
          </div>
        </div>

        <div className="flex items-start p-3 bg-sky-50 rounded-lg border border-sky-100">
          <MapPin className="h-5 w-5 text-sky-600 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-sm text-sky-800 mb-1">Plan for Breaks</h3>
            <p className="text-xs text-sky-700 leading-snug">
              Long car rides or layovers? Schedule extra time for potty breaks, water, and short walks to keep your furry friend comfortable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingSidebar; 