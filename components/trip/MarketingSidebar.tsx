'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Use Shadcn card
import { MapPin, Sun, Target, PlaneTakeoff } from 'lucide-react'; // Added PlaneTakeoff
import { TripData } from '@/store/tripStore'; // Import TripData type

// --- Define Sample Trip Data ---
const exampleTrips: { title: string; image: string; data: Partial<TripData> }[] = [
  {
    title: "Beach Getaway in San Diego (3 Days)",
    image: "/placeholder-sandiego.jpg", // Replace with actual image path
    data: {
      destination: "San Diego",
      destinationCountry: "USA",
      startDate: "2024-08-15", // Use a future date
      endDate: "2024-08-17",
      adults: 2,
      pets: 1,
      petDetails: [{ type: 'Dog', size: 'Small' }],
      interests: ['Water Activities', 'Outdoor Adventures', 'Food Tours'],
      budget: 'Moderate',
      accommodation: 'Hotel',
    }
  },
  {
    title: "Explore Paris with your Pup (5 Days)",
    image: "/placeholder-paris.jpg", // Replace with actual image path
    data: {
      destination: "Paris",
      destinationCountry: "France",
      startDate: "2024-09-10", // Use a future date
      endDate: "2024-09-14",
      adults: 1,
      pets: 1,
      petDetails: [{ type: 'Dog', size: 'Medium' }],
      interests: ['Sightseeing', 'Food Tours', 'Museums', 'Local Experiences'],
      budget: 'Luxury',
      accommodation: 'Apartment',
    }
  }
  // Add more examples as needed
];

// --- Update Props Interface ---
interface MarketingSidebarProps {
  className?: string;
  onSelectExampleTrip: (tripData: Partial<TripData>) => void; // Function to handle example selection
}

/**
 * MarketingSidebar Component
 * Displays suggestions, inspiration, and potentially marketing content in the right sidebar.
 * Now includes clickable example trips.
 * @param {MarketingSidebarProps} props - Component props.
 * @returns {JSX.Element}
 */
const MarketingSidebar: React.FC<MarketingSidebarProps> = ({ className, onSelectExampleTrip }) => {
  // Placeholder data for other sections - replace with dynamic content later
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

  return (
    <div className={cn("h-full bg-gray-50 p-4 overflow-y-auto space-y-6 font-sans", className)}>
      {/* Section: For you in [Location] */} 
      <section>
        <h2 className="text-xl font-bold text-black tracking-tight mb-3 flex items-center">
           <MapPin className="h-5 w-5 mr-2 text-teal-600" /> For you in {destination || 'your destination'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((item, index) => (
            <Card key={index} className="overflow-hidden shadow hover:shadow-md transition-shadow cursor-pointer border-gray-200">
              {/* Placeholder image - replace with next/image later */}
              <div className="h-32 bg-gray-200 flex items-center justify-center">
                 <span className="text-gray-400 text-sm">Image</span>
              </div>
              {/* <img src={item.image} alt={item.title} className="w-full h-32 object-cover" /> */}
              <CardContent className="p-3">
                <p className="font-semibold text-sm text-gray-800 truncate">{item.title}</p>
                <p className="text-xs text-gray-500">{item.type}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section: Example Trips (Replaces Get started) */}
      <section>
        <h2 className="text-xl font-bold text-black tracking-tight mb-3 flex items-center">
           <PlaneTakeoff className="h-5 w-5 mr-2 text-teal-600"/> Get Started with an Example
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exampleTrips.map((trip, index) => (
            <Card 
              key={index} 
              className="overflow-hidden shadow hover:shadow-md transition-shadow cursor-pointer border-gray-200 group"
              onClick={() => onSelectExampleTrip(trip.data)} // Call prop function on click
              // Accessibility: Add role and keyboard interaction
              role="button"
              tabIndex={0} // Make it focusable
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectExampleTrip(trip.data);
                }
              }}
              aria-label={`Start planning: ${trip.title}`}
            >
               {/* Placeholder image - replace with next/image later */}
               <div className="h-32 bg-gray-300 flex items-center justify-center relative">
                 <span className="text-gray-500 text-sm z-0">{trip.title} Image</span>
                 {/* <img src={trip.image} alt={trip.title} className="absolute inset-0 w-full h-full object-cover z-0" /> */}
              </div>
              <CardContent className="p-3">
                {/* Apply hover effect for visual feedback */}
                <p className="font-semibold text-sm text-gray-800 truncate group-hover:text-teal-600 transition-colors">{trip.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section: Get inspired */} 
      <section>
        <h2 className="text-xl font-bold text-black tracking-tight mb-3 flex items-center">
           <Sun className="h-5 w-5 mr-2 text-teal-600"/> Get inspired
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {getInspired.map((item, index) => (
             <Card key={index} className="overflow-hidden shadow hover:shadow-md transition-shadow cursor-pointer border-gray-200">
                <div className="h-32 bg-gray-200 flex items-center justify-center">
                 <span className="text-gray-400 text-sm">Image</span>
               </div>
               {/* <img src={item.image} alt={item.title} className="w-full h-32 object-cover" /> */}
               <CardContent className="p-3">
                 <p className="font-semibold text-sm text-gray-800 truncate">{item.title}</p>
               </CardContent>
             </Card>
          ))}
        </div>
        {/* Optional: Add "See all" link later */}
      </section>
    </div>
  );
};

export default MarketingSidebar; 