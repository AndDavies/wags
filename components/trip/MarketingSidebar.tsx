'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Use Shadcn card
import { MapPin, Sun, Target } from 'lucide-react'; // Example icons

interface MarketingSidebarProps {
  className?: string;
  // Add props later to receive dynamic data, e.g., destination
  // destination?: string | null;
}

/**
 * MarketingSidebar Component
 * Displays suggestions, inspiration, and potentially marketing content in the right sidebar.
 * @param {MarketingSidebarProps} props - Component props.
 * @returns {JSX.Element}
 */
const MarketingSidebar: React.FC<MarketingSidebarProps> = ({ className }) => {
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

      {/* Section: Get started */}
      <section>
        <h2 className="text-xl font-bold text-black tracking-tight mb-3 flex items-center">
           <Target className="h-5 w-5 mr-2 text-teal-600"/> Get started
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {getStarted.map((item, index) => (
            <Card key={index} className="overflow-hidden shadow hover:shadow-md transition-shadow cursor-pointer border-gray-200">
               <div className="h-32 bg-gray-200 flex items-center justify-center">
                 <span className="text-gray-400 text-sm">Image</span>
              </div>
              {/* <img src={item.image} alt={item.title} className="w-full h-32 object-cover" /> */}
              <CardContent className="p-3 bg-gradient-to-t from-black/30 to-transparent relative -mt-10">
                <p className="font-semibold text-sm text-white truncate relative z-10">{item.title}</p>
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