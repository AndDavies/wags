'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useTripStore, Activity, ItineraryDay, PolicyRequirementStep, GeneralPreparationItem, TripData } from '@/store/tripStore';
import * as Toast from '@radix-ui/react-toast';
import { createClient } from '@/lib/supabase-client';
import { PostgrestError } from '@supabase/supabase-js';
import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  AlertTriangle,
  Car,
  CheckCircle,
  ChevronDown,
  ClipboardCheck,
  Coffee,
  Dog,
  ExternalLink,
  Hotel,
  Landmark,
  MapPin,
  Minus,
  Mountain,
  Palette,
  Plane,
  Plus,
  Sandwich,
  ShoppingBag,
  Stethoscope,
  Utensils,
  Waves,
  Wind,
  X,
  Zap,
  Loader2,
  ArrowLeft,
  Save,
  Clock,
  DollarSign,
  Phone,
  Info,
  Bed,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { Map, Marker, Popup, LngLatBounds } from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Timeline, TimelineItem, TimelineContent, TimelineHeader,
  TimelineSeparator, TimelineDate, TimelineTitle, TimelineIndicator
} from "@/components/ui/timeline";
import { ActivitySuggestion } from '@/app/api/trip/suggest-activity/route';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

// --- Interfaces (matching store/API) ---
interface ItineraryViewProps {
  session: { user: { id: string } } | null;
  onBackToPlanning?: () => void;
  onTriggerSave?: () => Promise<void>;
}

// --- Helper Function & Components ---

const getActivityIcon = (activity: Activity): React.ReactNode => {
  const lowerName = activity.name.toLowerCase();
  const lowerDesc = activity.description.toLowerCase();
  const type = activity.type;

  if (type === 'flight') return <Plane className="h-5 w-5 text-blue-600" />;
  if (type === 'transfer') return <Car className="h-5 w-5 text-purple-600" />;
  if (type === 'accommodation') return <Hotel className="h-5 w-5 text-cyan-600" />;
  if (type === 'preparation') return <ClipboardCheck className="h-5 w-5 text-yellow-700" />;
  if (type === 'meal') {
    if (lowerName.includes('breakfast') || lowerName.includes('cafe') || lowerName.includes('coffee')) return <Coffee className="h-5 w-5 text-yellow-800" />;
    if (lowerName.includes('lunch')) return <Sandwich className="h-5 w-5 text-orange-500" />;
    if (lowerName.includes('dinner') || lowerName.includes('restaurant')) return <Utensils className="h-5 w-5 text-red-600" />;
    return <Utensils className="h-5 w-5 text-orange-600" />;
  }
  if (lowerName.includes('park') || lowerName.includes('hike') || lowerName.includes('outdoor') || lowerDesc.includes('walk')) return <Mountain className="h-5 w-5 text-green-600" />;
  if (lowerName.includes('museum') || lowerName.includes('gallery') || lowerName.includes('art')) return <Palette className="h-5 w-5 text-indigo-600" />;
  if (lowerName.includes('landmark') || lowerName.includes('historical') || lowerName.includes('sightseeing')) return <Landmark className="h-5 w-5 text-purple-700" />;
  if (lowerName.includes('shop') || lowerName.includes('market')) return <ShoppingBag className="h-5 w-5 text-pink-600" />;
  if (lowerName.includes('vet') || lowerDesc.includes('vet')) return <Stethoscope className="h-5 w-5 text-red-700" />;
  if (lowerName.includes('beach') || lowerName.includes('water')) return <Waves className="h-5 w-5 text-blue-500" />;
  if (lowerName.includes('nightlife') || lowerName.includes('bar')) return <Zap className="h-5 w-5 text-yellow-500" />;
  if (type === 'placeholder' || lowerName.includes('relax') || lowerName.includes('free')) return <Wind className="h-5 w-5 text-gray-400" />;
  return <MapPin className="h-5 w-5 text-gray-500" />;
};

function CollapsibleCard({ title, icon: Icon, children, startExpanded = false }: { title: string; icon: React.ElementType; children: React.ReactNode; startExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const handleToggle = () => setIsExpanded(!isExpanded);

  return (
    <Card className="mb-6 overflow-hidden shadow-sm">
      <button onClick={handleToggle} className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
        <CardTitle className="flex items-center text-gray-700 text-lg font-semibold">
          <Icon className="h-5 w-5 mr-2 text-teal-600" /> {title}
        </CardTitle>
        <ChevronDown className={cn("h-5 w-5 transition-transform text-gray-500", isExpanded && "transform rotate-180")} />
      </button>
      {isExpanded && (
        <CardContent className="p-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function PolicyRequirementsSteps({ steps }: { steps: PolicyRequirementStep[] | undefined }) {
  if (!steps || steps.length === 0) {
    return <p className="text-gray-500 text-xs italic px-2">No specific entry requirement steps found for this destination country.</p>;
  }
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="pt-0 pb-0 px-0">
        <ol className="space-y-3">
          {steps.sort((a, b) => a.step - b.step).map((item) => (
            <li key={item.step} className="flex items-start">
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-teal-500 text-white font-bold text-xs mr-3 mt-0.5 flex-shrink-0">{item.step}</span>
              <div>
                <h4 className="font-semibold text-teal-700 text-sm">{item.label}</h4>
                <p className="text-gray-700 text-xs" dangerouslySetInnerHTML={{ __html: item.text.replace(/\\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:underline">$1</a>') }}></p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function GeneralPreparationInfo({ items }: { items: GeneralPreparationItem[] | undefined }) {
  if (!items || items.length === 0) { return null; }
  return (
    <Card className="border-0 shadow-none bg-transparent mt-4">
      <CardContent className="pt-0 pb-0 px-0">
        <ul className="space-y-2.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start">
              <AlertCircle className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-700 text-sm">{item.requirement}</h4>
                {typeof item.details === 'string' ? (
                  <p className="text-gray-700 text-xs">{item.details}</p>
                ) : (item.details && typeof item.details === 'object' && 'url' in item.details && 'title' in item.details) ? (
                  <a href={item.details.url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">
                    {item.details.title} <ExternalLink className="inline-block h-3 w-3 ml-1" />
                  </a>
                ) : (
                  <p className="text-gray-500 text-xs italic">[Invalid details format]</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function BookingOptionCard({ title, icon, url }: { title: string; icon: React.ReactNode; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all text-center h-full hover:border-teal-400 group">
      <div className="bg-mustard-100 p-2 rounded-full mb-1.5 text-mustard-600 group-hover:bg-mustard-500 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="font-medium text-gray-700 text-xs group-hover:text-teal-600 transition-colors">{title}</span>
    </a>
  );
}

function ItineraryDayAccordion({
    day,
    index,
    isExpanded,
    onToggle,
    onAddActivityClick,
    onDeleteActivity,
    onOpenBookingModal,
    tripData
}: { 
    day: ItineraryDay; 
    index: number; 
    isExpanded: boolean; 
    onToggle: () => void; 
    onAddActivityClick: () => void;
    onDeleteActivity: (actIndex: number) => void; 
    onOpenBookingModal: (activity: Activity) => void;
    tripData: TripData | null;
}) {
  const [expandedActivityIndex, setExpandedActivityIndex] = useState<number | null>(null);

  const validActivities = (day.activities || []).filter((activity, actIndex) => {
    const isValid = activity && typeof activity.name === 'string' && activity.name.trim() !== '' && typeof activity.location === 'string' /* && activity.location.trim() !== '' && activity.coordinates */ ;
    if (!isValid) {
      console.warn(`[ItineraryView] Filtering out invalid activity at Day ${day.day}, Index ${actIndex}:`, activity);
    }
    return isValid;
  });

  const toggleActivityDetails = (actIndex: number) => {
      setExpandedActivityIndex(prev => prev === actIndex ? null : actIndex);
  };

  return (
    <div className="mb-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <button onClick={onToggle} className={cn("w-full text-left p-3 flex justify-between items-center hover:bg-gray-50 transition-colors", isExpanded ? "border-b border-gray-200" : "")}>
        <div>
          <h3 className="text-lg font-bold text-teal-700">Day {day.day}: {day.date}</h3>
          <p className="text-sm text-gray-600 mt-0.5">{day.city?.split(',')[0] || 'Unknown City'}</p> 
        </div>
        <ChevronDown className={cn("h-5 w-5 transition-transform text-gray-500", isExpanded && "transform rotate-180")} />
      </button>
      
      {isExpanded && (
        <div className="p-3">
          {day.narrative_intro && (
            <p className="text-sm text-gray-700 italic mb-3 bg-teal-50 p-2.5 rounded-md border border-teal-100">{day.narrative_intro}</p>
          )}
          
          {day.travel && (
             <div className="mb-3 bg-blue-50 p-2.5 rounded-md border border-blue-200">
               <h4 className="font-semibold flex items-center text-blue-700 text-sm"><Plane className="h-4 w-4 mr-1.5" /> Travel Details</h4>
               <p className="text-gray-700 mt-1 text-sm">{day.travel}</p>
             </div>
           )}

          <div className="space-y-1">
            {validActivities.length > 0 ? (
              validActivities.map((activity, actIndex) => {
                const isDetailsExpanded = expandedActivityIndex === actIndex;
                const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
                const photoRef = activity.photo_references?.[0]?.photo_reference;
                const imageUrl = googleApiKey && photoRef 
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${photoRef}&key=${googleApiKey}`
                    : null;

                let actionButton: React.ReactNode = null;
                if (activity.type === 'accommodation') {
                  actionButton = (
                    <Button 
                       size="sm" 
                       onClick={() => onOpenBookingModal(activity)} 
                       className="bg-gray-800 hover:bg-black text-white text-xs h-8 px-3 shadow-sm"
                     >Book</Button>
                  );
                } else if (activity.website) {
                    actionButton = (
                        <Button 
                            variant="outline"
                            size="sm" 
                            onClick={() => window.open(activity.website, '_blank')} 
                            className="text-xs h-8 px-3 shadow-sm"
                        >
                           Site <ExternalLink className="h-3 w-3 ml-1.5" />
                        </Button>
                    );
                } else {
                     actionButton = (
                        <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={() => toggleActivityDetails(actIndex)} 
                            className="text-xs h-8 px-3 text-gray-600 hover:bg-gray-100"
                        >
                           Details <ChevronRight className={cn("h-4 w-4 ml-1 transition-transform", isDetailsExpanded && "rotate-90")} />
                        </Button>
                     );
                }
                
                const distance = "0.53 mi";

                return (
                  <Fragment key={`${activity.name}-${actIndex}`}>
                    <div className="flex items-start space-x-3 group relative py-1.5">
                       <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                            {imageUrl ? (
                                <img src={imageUrl} alt={activity.name} className="object-cover w-full h-full" loading="lazy" />
                            ) : (
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                       </div>

                       <div className="flex-grow min-w-0">
                           <div className="flex items-center mb-0.5">
                             <span className="mr-1.5">{React.cloneElement(getActivityIcon(activity) as React.ReactElement, { className: "h-4 w-4" })}</span>
                             <h4 className="text-sm font-semibold text-gray-800 tracking-tight truncate">{activity.name}</h4>
                           </div>
                           <p className="text-xs text-gray-500 flex items-center tracking-tight">
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              {activity.startTime ? `${activity.startTime}${activity.endTime ? ` - ${activity.endTime}` : ''}` : 'Time not specified'}
                           </p>
                           {isDetailsExpanded && (
                                <div className="mt-1.5 space-y-1.5 pr-4">
                                    <div className="text-gray-600 text-sm tracking-tight prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-a:text-teal-600 hover:prose-a:text-teal-700">
                                      <ReactMarkdown components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                                        {activity.description || 'No description available.'}
                                      </ReactMarkdown>
                                    </div>
                                    <div className="text-xs text-gray-500 space-y-0.5 pt-1">
                                       <p className="flex items-center tracking-tight"><MapPin className="h-3 w-3 mr-1.5 flex-shrink-0 text-gray-400" /> {activity.location?.split(',')[0] || 'Location details missing'}</p>
                                        {activity.cost && activity.cost !== "$ - $" && activity.cost !== "Free" && (
                                          <p className="flex items-center tracking-tight"><DollarSign className="h-3 w-3 mr-1.5 flex-shrink-0 text-gray-400" /> {activity.cost}</p>
                                        )}
                                        {activity.estimated_duration && (
                                            <p className="flex items-center font-medium text-gray-600 tracking-tight">
                                                <Clock className="h-3 w-3 mr-1.5 flex-shrink-0 text-gray-400" />
                                                Est. {activity.estimated_duration} min
                                            </p>
                                        )}
                                         {activity.phone_number && (
                                           <p className="flex items-center tracking-tight"><Phone className="h-3 w-3 mr-1.5 flex-shrink-0 text-gray-400" /> {activity.phone_number}</p>
                                         )}
                                         {activity.opening_hours && (
                                           <p className="flex items-start tracking-tight"><Info className="h-3 w-3 mr-1.5 mt-0.5 flex-shrink-0 text-gray-400" /> Hours: {activity.opening_hours}</p>
                                         )}
                                    </div>
                                    {activity.pet_friendliness_details && activity.pet_friendliness_details !== "N/A" && (
                                      <p className="text-xs text-amber-700 mt-1 flex items-start bg-amber-50 p-1.5 rounded border border-amber-100 tracking-tight">
                                        <Dog className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0 text-amber-600" />
                                        <span>{activity.pet_friendliness_details}</span>
                                      </p>
                                    )}
                                </div>
                           )}
                       </div>

                       <div className="flex-shrink-0 ml-2">
                           {actionButton}
                       </div>

                       <button
                           onClick={() => {
                               const originalIndex = (day.activities || []).findIndex(a => a === activity);
                               if (originalIndex !== -1) onDeleteActivity(originalIndex);
                               else console.error("Could not find original index for deletion after filtering");
                           }}
                           className="absolute top-1 right-1 text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50 z-10"
                           aria-label="Delete activity"
                       >
                           <X className="h-3.5 w-3.5" />
                       </button>
                    </div>
                    {actIndex < validActivities.length - 1 && (
                       <div className="flex items-center my-0.5">
                           <span className="text-xs text-gray-400 tracking-tight pl-20">{distance}</span>
                           <div className="flex-grow border-t border-dashed border-gray-200 ml-2"></div>
                       </div>
                    )}
                  </Fragment>
                );
              })
            ) : ( 
              <p className="text-gray-500 italic text-sm px-1 text-center py-4">No activities planned for this day.</p> 
            )}
            <div className="pt-2">
                 <Button 
                    variant="outline"
                    size="sm"
                    onClick={onAddActivityClick}
                    className="w-full text-xs h-9"
                  >
                   <Plus className="h-3 w-3 mr-1" /> Add Activity
                 </Button>
             </div>
          </div>

          {day.narrative_outro && (
            <p className="text-sm text-gray-700 italic mt-3 bg-teal-50 p-2.5 rounded-md border border-teal-100">{day.narrative_outro}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface HotelBookingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    activity: Activity | null;
    tripData: TripData | null;
}

function HotelBookingModal({ open, onOpenChange, activity, tripData }: HotelBookingModalProps) {
    if (!activity || !tripData) return null;

    const checkInDate = tripData.startDate ? (typeof tripData.startDate === 'string' ? tripData.startDate : tripData.startDate.toISOString().split('T')[0]) : '';
    const checkOutDate = tripData.endDate ? (typeof tripData.endDate === 'string' ? tripData.endDate : tripData.endDate.toISOString().split('T')[0]) : '';
    const city = activity.location?.split(',')[0] || 'Unknown City';
    const adults = tripData.adults || 1;
    const children = tripData.children || 0;

    const partners = [
        {
            name: 'Booking.com',
            logo: 'https://q-xx.bstatic.com/backend_static/common/flags/new/booking_logo_dark_bg.svg',
            url: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(activity.name)}%2C%20${encodeURIComponent(city)}&checkin=${checkInDate}&checkout=${checkOutDate}&group_adults=${adults}&group_children=${children}&pets=1&lang=en-us&aid=YOUR_AFFILIATE_ID`
        },
        {
            name: 'Priceline',
            logo: 'https://www.priceline.com/v1/media/common/logos/priceline/logo-contrast.svg',
            url: `https://www.priceline.com/hotels/?city=${encodeURIComponent(city)}&check-in-date=${checkInDate}&check-out-date=${checkOutDate}&adults=${adults}&children=${children}&amenities=17&property-name=${encodeURIComponent(activity.name)}`
        },
        {
            name: 'Agoda',
            logo: 'https://cdn6.agoda.net/images/kite-js/logo/agoda/color-default.svg',
            url: `https://www.agoda.com/search?city=${encodeURIComponent(city)}&checkIn=${checkInDate}&checkOut=${checkOutDate}&adults=${adults}&children=${children}&Search=${encodeURIComponent(activity.name)}&pets=1`
        },
         {
            name: 'Michelin Guide',
            logo: 'https://guide.michelin.com/_ipx/image//_next/static/media/michelin-guide-logo-desktop.4570a79f.svg?url=%2F_next%2Fstatic%2Fmedia%2Fmichelin-guide-logo-desktop.4570a79f.svg&w=384&q=75',
            url: `https://guide.michelin.com/us/en/search?q=${encodeURIComponent(activity.name)}%20${encodeURIComponent(city)}`
        },
        {
            name: 'Direct',
            logo: null,
            url: activity.website || `https://www.google.com/search?q=${encodeURIComponent(activity.name)}%20${encodeURIComponent(city)}`
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">{activity.name}</DialogTitle>
                    <DialogDescription>
                        Booking options {checkInDate && checkOutDate ? ` • ${checkInDate} - ${checkOutDate}` : ''}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                    {partners.map((partner) => (
                        <div key={partner.name} className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
                            <div className="flex items-center space-x-3">
                               {partner.logo ? (
                                   <img src={partner.logo} alt={partner.name} className="h-6 object-contain" />
                               ) : partner.name === 'Direct' ? (
                                    <Hotel className="h-5 w-5 text-gray-500" />
                               ) : null}
                                <div>
                                   <p className="text-sm font-medium text-gray-800">{partner.name}</p>
                                   <p className="text-xs text-gray-500">
                                      {partner.name === 'Direct' ? 'Book directly with the hotel' : `Book at ${partner.name.toLowerCase()}`}
                                   </p>
                               </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(partner.url, '_blank')}
                                className="text-xs h-8 px-3 shadow-sm"
                            >
                                Visit site <ExternalLink className="h-3 w-3 ml-1.5" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <DialogFooter className="sm:justify-start">
                     <DialogClose asChild>
                         <Button type="button" variant="secondary">
                             Close
                         </Button>
                     </DialogClose>
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ItineraryMap({ activities }: { activities: Array<Activity> }) {
  const MAPTILER_API_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const DEFAULT_COORDS = { lat: 39.8283, lng: -98.5795 };
  const MAP_STYLE = 'streets-v2';
  const MAX_MARKERS = 50;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    if (!MAPTILER_API_KEY || !mapContainerRef.current || mapRef.current) return;

    const validActivities = activities
        .filter(activity => activity.coordinates && activity.coordinates.lat !== 0 && activity.coordinates.lng !== 0)
        .slice(0, MAX_MARKERS);

    let initialCenter: [number, number] = [DEFAULT_COORDS.lng, DEFAULT_COORDS.lat];
    let initialZoom: number = 3;

    if (validActivities.length === 1) {
        initialCenter = [validActivities[0].coordinates.lng, validActivities[0].coordinates.lat];
        initialZoom = 13;
    } else if (validActivities.length > 1) {
        initialCenter = [validActivities[0].coordinates.lng, validActivities[0].coordinates.lat];
        initialZoom = 10;
    }

    try {
        mapRef.current = new Map({
            container: mapContainerRef.current,
            style: MAP_STYLE,
            center: initialCenter,
            zoom: initialZoom,
            apiKey: MAPTILER_API_KEY,
        });
    } catch (mapError) {
        console.error("Error initializing Maptiler map:", mapError);
        return;
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = validActivities.map(activity => {
        const markerElement = document.createElement('div');
        markerElement.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${
            activity.type === 'meal' ? '#f97316' :
            activity.type === 'accommodation' ? '#0891b2' :
            activity.petFriendly ? '#14b8a6' :
            '#6b7280'
            }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style="font-size: 9px; font-weight: 500; color: #374151; margin-top: 2px; background-color: rgba(255, 255, 255, 0.7); padding: 1px 3px; border-radius: 3px; white-space: nowrap; max-width: 80px; overflow: hidden; text-overflow: ellipsis;">
              ${activity.name}
            </span>
          </div>
        `;
        markerElement.className = 'cursor-pointer hover:scale-110 transition-transform';
        markerElement.setAttribute('aria-label', activity.name);

        const marker = new Marker({ 
            element: markerElement,
            anchor: 'bottom'
        })
            .setLngLat([activity.coordinates.lng, activity.coordinates.lat])
            .addTo(mapRef.current!);

        const popup = new Popup({ offset: 30 })
            .setHTML(`
            <div class="p-2.5 max-w-xs bg-white rounded-lg shadow-lg border border-gray-100 font-sans">
                <h4 class="font-semibold text-base text-gray-800 mb-1">${activity.name}</h4>
                <p class="text-xs text-gray-600 mb-1.5">${activity.location}</p>
                ${activity.description ? `<p class="text-xs text-gray-500 mb-1.5 line-clamp-2">${activity.description}</p>` : ''}
                <div class="text-xs text-gray-500 space-y-0.5">
                    ${activity.startTime ? `<p><strong class="font-medium text-gray-600">Time:</strong> ${activity.startTime}${activity.endTime ? ` - ${activity.endTime}` : ''}</p>` : ''}
                    <p><strong class="font-medium text-gray-600">Pet Friendly:</strong> ${activity.petFriendly ? '<span class="text-teal-600 font-semibold">Yes</span>' : 'No/Unknown'}</p>
                </div>
                <button class="text-teal-600 hover:underline text-xs mt-2 font-medium" onclick="document.dispatchEvent(new CustomEvent('close-popup'))">Close</button>
            </div>
            `);

        marker.setPopup(popup);

        marker.getElement().addEventListener('click', (e) => {
            e.stopPropagation();
            markersRef.current.forEach(m => m.getPopup()?.remove());
            setSelectedActivity(activity);
            popup.addTo(mapRef.current!);
        });

        return marker;
    });

    if (validActivities.length > 1) {
        const bounds = new LngLatBounds();
        validActivities.forEach(activity => {
            bounds.extend([activity.coordinates.lng, activity.coordinates.lat]);
        });
        try {
           mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15 });
        } catch (fitBoundsError) {
            console.error("Error fitting map bounds:", fitBoundsError);
        }
    }

    const handleClosePopup = () => {
        setSelectedActivity(null);
        markersRef.current.forEach(marker => marker.getPopup()?.remove());
    };
    mapRef.current?.on('click', handleClosePopup);
    document.addEventListener('close-popup', handleClosePopup);

    return () => {
        document.removeEventListener('close-popup', handleClosePopup);
        mapRef.current?.remove();
        mapRef.current = null;
        markersRef.current = [];
    };
  }, [MAPTILER_API_KEY, activities]); 

  return (
    <div className="w-full h-full rounded-lg overflow-hidden relative border border-gray-200 min-h-[300px]">
      {!MAPTILER_API_KEY && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center z-10">
          <p className="text-red-600 font-semibold p-4 bg-white rounded shadow">
            Maptiler API key is missing.
          </p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" aria-label="Activity Map" />
    </div>
  );
}

export default function ItineraryView({ session, onBackToPlanning, onTriggerSave }: ItineraryViewProps) {
  const { tripData, isSaving, error, clearTrip, addActivity, deleteActivity, setIsSaving, setError, setTripData } = useTripStore();

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Empty dependency array ensures this runs only once on mount

  const router = useRouter();
  const pathname = usePathname();

  const itinerary = tripData?.itinerary;
  const policyRequirements = tripData?.policyRequirements;
  const generalPreparation = tripData?.generalPreparation;
  const preDeparturePreparation = tripData?.preDeparturePreparation;

  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '' });
  const [showMap, setShowMap] = useState(false);
  const [activitiesForMap, setActivitiesForMap] = useState<Activity[]>([]);
  const [addingActivityDay, setAddingActivityDay] = useState<number | null>(null);
  const [activitySearchResults, setActivitySearchResults] = useState<ActivitySuggestion[]>([]);
  const [isSearchingActivities, setIsSearchingActivities] = useState(false);
  const [addingVetDay, setAddingVetDay] = useState<number | null>(null);
  const [vetSearchResults, setVetSearchResults] = useState<any[]>([]);
  const [isSearchingVets, setIsSearchingVets] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mapFilterDay, setMapFilterDay] = useState<number | 'all'>('all');
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedHotelActivity, setSelectedHotelActivity] = useState<Activity | null>(null);

  useEffect(() => {
    // Initialize expanded days: Only expand Day 1 if itinerary exists and has days
    if (itinerary?.days && itinerary.days.length > 0 && expandedDays.length === 0) {
      // Check if Day 1 exists before trying to access it
      const firstDayExists = itinerary.days.some(day => day.day === 1);
      if (firstDayExists) {
         setExpandedDays([1]); // Expand only Day 1
      } else if (itinerary.days.length > 0) {
          // If Day 1 doesn't exist, expand the *actual* first day in the list
          setExpandedDays([itinerary.days[0].day]);
      }
    }
    // Add dependencies: run only when itinerary data becomes available initially
  }, [itinerary]); // Only depend on itinerary

  useEffect(() => {
    console.log('[ItineraryView] Checking for pending itinerary on mount...');
    if (session) { 
      const pendingData = sessionStorage.getItem('pendingItinerarySave');
      if (pendingData) {
        console.log('[ItineraryView] Found pending itinerary in sessionStorage.');
        try {
          const parsedData = JSON.parse(pendingData) as TripData;
          
          setTripData(parsedData); 
          sessionStorage.removeItem('pendingItinerarySave'); 
          console.log('[ItineraryView] Restored trip data and cleared sessionStorage.');
          
          setToastMessage({ title: 'Trip Restored', description: 'Your previous progress has been loaded. Save it permanently!' });
          setOpenToast(true);

        } catch (parseError) {
          console.error('[ItineraryView] Failed to parse pending itinerary data:', parseError);
          sessionStorage.removeItem('pendingItinerarySave');
          setError('Could not restore previous trip progress due to data format error.');
          setToastMessage({ title: 'Restore Failed', description: 'Could not load previous progress.' });
          setOpenToast(true);
        }
      } else {
         console.log('[ItineraryView] No pending itinerary found in sessionStorage.');
      }
    } else {
        console.log('[ItineraryView] User not logged in, skipping restore check.');
    }
  }, [session]); 
  
  useEffect(() => {
    if (itinerary?.days) {
      const allActivities = itinerary.days.flatMap((day: ItineraryDay) => day.activities || []);
      setActivitiesForMap(allActivities);
    } else {
      setActivitiesForMap([]);
    }
  }, [itinerary]);

  const handleToggleDay = (day: number) => {
    setExpandedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };
  const toggleMapView = () => setShowMap(prev => !prev);

  const handleAddActivityClick = async (day: number) => {
    const currentDayData = itinerary?.days.find(d => d.day === day);
    if (!currentDayData || !tripData) { 
        setToastMessage({ title: 'Error', description: 'Cannot add activity: Missing day or trip data.' }); 
        setOpenToast(true);
        return; 
    }

    setAddingActivityDay(day);
    setIsSearchingActivities(true);
    setActivitySearchResults([]);
    
    const apiUrl = '/api/trip/suggest-activity';
    console.log(`[ItineraryView] Fetching suggestions from ${apiUrl} for Day ${day} in ${currentDayData.city}`);

    try {
        const requestBody = {
            dayNumber: day,
            city: currentDayData.city || tripData.destination || '',
            coordinates: currentDayData.activities?.[0]?.coordinates,
            interests: tripData.interests,
            budget: tripData.budget,
            existingActivities: currentDayData.activities || [],
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("[ItineraryView] API Error response:", errorData);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const results = await response.json();
        console.log("[ItineraryView] Received suggestions:", results.suggestions);
        setActivitySearchResults(results.suggestions || []);

    } catch (error: any) {
        console.error("[ItineraryView] Error fetching activity suggestions:", error);
        setToastMessage({ title: 'Error', description: `Could not fetch suggestions: ${error.message}` });
        setOpenToast(true);
        setActivitySearchResults([]);
    } finally {
        setIsSearchingActivities(false);
    }
  };

  const handleSelectActivity = (day: number, activitySuggestion: ActivitySuggestion) => {
    const newActivity: Activity = {
        place_id: activitySuggestion.place_id,
        name: activitySuggestion.name || 'Suggested Activity',
        description: activitySuggestion.description || '',
        petFriendly: activitySuggestion.petFriendly ?? false,
        location: activitySuggestion.location || 'Unknown Location',
        coordinates: activitySuggestion.coordinates || { lat: 0, lng: 0 },
        type: 'activity',
        startTime: undefined,
        endTime: undefined,
        cost: undefined,
        website: activitySuggestion.website,
        phone_number: undefined,
        opening_hours: undefined,
        photo_references: activitySuggestion.photo_references?.map(photo => ({ 
            photo_reference: photo.photo_reference,
            width: photo.width,
            height: photo.height
        })) || [], 
        booking_link: undefined,
        pet_friendliness_details: activitySuggestion.petFriendly ? 'Potentially pet-friendly based on search' : undefined,
        estimated_duration: 60,
        rating: activitySuggestion.rating,
        user_ratings_total: activitySuggestion.user_ratings_total,
    };
    
    addActivity(day, newActivity);
    
    setAddingActivityDay(null); 
    setActivitySearchResults([]);
    setToastMessage({ title: 'Activity Added', description: `${newActivity.name} added to Day ${day}` }); 
    setOpenToast(true);
    handleSaveTrip();
  };

  const handleDeleteActivity = (day: number, activityIndex: number) => {
    const dayData = itinerary?.days.find((d: ItineraryDay) => d.day === day);
    const activityName = dayData?.activities[activityIndex]?.name || 'Activity';
    deleteActivity(day, activityIndex);
    setToastMessage({ title: 'Activity Removed', description: `${activityName} removed from Day ${day}` }); setOpenToast(true);
    handleSaveTrip();
  };

  const handleFindVets = async (day: number) => {
    setAddingVetDay(day);
    setIsSearchingVets(true);
    setVetSearchResults([]);
    const currentDayData = itinerary?.days.find(d => d.day === day);
    if (!currentDayData || !tripData) { setIsSearchingVets(false); return; }
    await new Promise(resolve => setTimeout(resolve, 750));
    const mockResults = [
      { name: "City Animal Hospital", description: "Emergency services", location: currentDayData.city, coordinates: { lat: 0, lng: 0}, petFriendly: true },
      { name: "Paws Clinic", description: "General care", location: currentDayData.city, coordinates: { lat: 0, lng: 0}, petFriendly: true },
    ];
    setVetSearchResults(mockResults);
    setIsSearchingVets(false);
  };

  const handleAddVet = (day: number, vet: any) => {
    addActivity(day, { name: `Veterinarian: ${vet.name}`, description: vet.description || 'Veterinary Clinic', petFriendly: true, location: vet.location || vet.vicinity || 'Unknown Location', coordinates: vet.coordinates || vet.geometry?.location || { lat: 0, lng: 0 } });
    setAddingVetDay(null); setVetSearchResults([]);
    setToastMessage({ title: 'Veterinarian Added', description: `${vet.name} added to Day ${day}` }); setOpenToast(true);
    handleSaveTrip();
  };

  const handleSaveTrip = async () => {
    if (!session || !tripData) { 
        setError('Cannot save: No user session or trip data.'); 
        setToastMessage({title: 'Save Failed', description: 'Please log in and create a trip first.'}); 
        setOpenToast(true); 
        return; 
    }
    
    setIsSaving(true); 
    setError(null);
    const supabase = createClient();

    const dbPayload = {
        ...tripData,
        startDate: tripData.startDate && typeof tripData.startDate !== 'string' 
                    ? (tripData.startDate as Date).toISOString().split('T')[0] 
                    : tripData.startDate, 
        endDate: tripData.endDate && typeof tripData.endDate !== 'string'
                  ? (tripData.endDate as Date).toISOString().split('T')[0]
                  : tripData.endDate,
    };

    try {
      console.log('[handleSaveTrip] Upserting draft for user:', session.user.id);
      const { data: upsertedData, error: saveError } = await supabase
        .from('draft_itineraries')
        .upsert({ 
            user_id: session.user.id, 
            trip_data: dbPayload, 
            updated_at: new Date().toISOString() 
        }, {
            onConflict: 'user_id'
        })
        .select('id')
        .single();

      if (saveError) {
          console.error('[handleSaveTrip] Supabase upsert error:', saveError);
          throw saveError; 
      }
      
      if (upsertedData) {
          console.log('[handleSaveTrip] Draft updated successfully, ID:', upsertedData.id);
          if (tripData.draftId !== upsertedData.id) {
              setTripData({ ...tripData, draftId: upsertedData.id });
          }
      } else {
          console.warn('[handleSaveTrip] Upsert seemed successful but did not return data.');
      }

      setToastMessage({ title: 'Progress Saved', description: 'Draft updated.' }); 
      setOpenToast(true);

    } catch (e: any) {
      console.error('[handleSaveTrip] Error saving draft:', e);
      const message = (e as PostgrestError)?.message || (e instanceof Error ? e.message : 'Unknown error');
      setError(`Failed to save draft: ${message}`); 
      setToastMessage({ title: 'Draft Save Failed', description: `Could not save progress. ${message}` }); 
      setOpenToast(true);
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleAuthRedirect = (authPath: '/login' | '/signup') => {
    console.log(`[handleAuthRedirect] Called for path: ${authPath}`);
    if (!tripData) { 
        console.error('[handleAuthRedirect] CRITICAL: No tripData available in store when attempting to save pending action.');
        setToastMessage({ title: 'Error', description: 'Cannot save trip data. Please try generating the trip again.' });
        setOpenToast(true);
        setShowAuthModal(false);
        return; 
    }
    try {
      console.log('[handleAuthRedirect] Preparing pending action. Current tripData keys:', Object.keys(tripData));
      const pendingAction = {
        action: 'save_draft', 
        payload: tripData 
      };
      
      let actionString;
      try {
        actionString = JSON.stringify(pendingAction);
        console.log(`[handleAuthRedirect] Stringified action successfully (length: ${actionString.length}).`);
      } catch (stringifyError) {
        console.error('[handleAuthRedirect] Error stringifying pending action payload:', stringifyError, pendingAction.payload);
        throw new Error('Failed to prepare trip data for saving.');
      }

      localStorage.setItem('pending_auth_action', actionString);
      console.log('[handleAuthRedirect] Set pending_auth_action in localStorage.');

      const finalRedirectPath = '/create-trip'; 
      localStorage.setItem('post_auth_redirect', finalRedirectPath);
      console.log('[handleAuthRedirect] Set post_auth_redirect in localStorage.');
      
      const authRedirectUrl = `${authPath}?redirect=${encodeURIComponent(finalRedirectPath)}&reason=pendingSave`;
      
      console.log(`[handleAuthRedirect] Attempting redirect to: ${authRedirectUrl}`);
      setShowAuthModal(false);
      router.push(authRedirectUrl);
      console.log(`[handleAuthRedirect] router.push executed.`);

    } catch (error) {
       console.error('[ItineraryView] Error setting localStorage or stringifying:', error);
       setError('Could not temporarily save trip progress for authentication.');
       setToastMessage({ title: 'Error', description: 'Could not save progress before redirecting. Please try again.' });
       setOpenToast(true);
       setShowAuthModal(false);
    }
  };

  const handleFinalSave = async () => {
    if (!session) {
      if (!tripData) {
          setToastMessage({ title: 'No Trip Data', description: 'Cannot save an empty trip.' });
          setOpenToast(true);
          return;
      }
      console.log('[ItineraryView] User not logged in. Showing auth modal.');
      setShowAuthModal(true);
      return;
    }

    if (!tripData) {
      setToastMessage({ title: 'No Trip Data', description: 'Cannot save an empty trip.' });
      setOpenToast(true);
      return;
    }
    setIsSaving(true);
    setError(null);
    console.log('[ItineraryView] Data being sent to /api/trips/save:', JSON.stringify(tripData, null, 2));
    try {
        const response = await fetch('/api/trips/save', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(tripData),
        });
        const result = await response.json();
        if (!response.ok) {
            console.error('[ItineraryView] API Error Response Body:', result);
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }
        setToastMessage({ title: 'Trip Saved!', description: 'Your itinerary has been saved successfully.' });
        setOpenToast(true);
    } catch (e: any) {
        console.error('[ItineraryView] Error saving final trip:', e);
        setError(`Failed to save final trip: ${e.message || 'Unknown error'}`);
        setToastMessage({ title: 'Save Failed', description: `Could not save the trip. ${e.message || 'Please try again.'}` });
        setOpenToast(true);
    } finally {
        setIsSaving(false);
    }
  };

  const handleNewTrip = async () => {
    if (session) {
      const supabase = createClient();
      await supabase.from('draft_itineraries').delete().match({ user_id: session.user.id });
    }
    clearTrip();
    if (onBackToPlanning) {
        onBackToPlanning();
    }
  };

  const handleOpenBookingModal = (activity: Activity) => {
      setSelectedHotelActivity(activity);
      setIsBookingModalOpen(true);
  };

  if (!tripData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">Loading itinerary or no trip data found...</p>
        </div>
      </div>
    );
  }
  if (!itinerary) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-xl text-gray-600">No itinerary found. Please complete your trip planning to view the itinerary.</p>
          {onBackToPlanning && (
            <Button onClick={onBackToPlanning} className="mt-4 bg-teal-600 hover:bg-teal-700 text-white">
              Back to Planning
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col h-full w-full overflow-hidden bg-white">
      <div className="p-3 border-b border-gray-200 shadow-sm flex justify-between items-center flex-shrink-0 bg-white">
        <div className="flex items-center gap-3 flex-shrink-0">
          {onBackToPlanning && (
            <Button variant="outline" size="sm" onClick={onBackToPlanning}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Planning
            </Button>
          )}
          <h1 className="text-2xl font-bold text-black tracking-tight hidden md:block">Your Pet-Friendly Trip</h1>
        </div>
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <Button onClick={handleSaveTrip} disabled={isSaving} size="sm" className="bg-teal-500 hover:bg-teal-600 text-white">
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Progress'}
          </Button>
          <Button variant="outline" onClick={toggleMapView} size="sm">{showMap ? 'Hide Map' : 'Show Map'}</Button>
          <Button variant="outline" onClick={handleFinalSave} disabled={isSaving} size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSaving ? 'Saving...' : 'Save Trip'}
          </Button>
          <Button variant="outline" onClick={handleNewTrip} size="sm">New Trip</Button>
        </div>
      </div>

      <Toast.Provider swipeDirection="right">
        <Toast.Root open={openToast} onOpenChange={setOpenToast} className="bg-white border border-gray-200 shadow-lg p-4 rounded-lg z-50 data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut">
          <Toast.Title className={cn("font-semibold text-base mb-1", error ? "text-red-600" : "text-teal-700")}>{toastMessage.title}</Toast.Title>
          <Toast.Description className="text-gray-600 text-sm">{toastMessage.description}</Toast.Description>
          <Toast.Close className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></Toast.Close>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-0 right-0 p-6 w-[390px] max-w-[100vw] z-[2147483647] outline-none" />
      </Toast.Provider>

      {error && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded m-4 flex-shrink-0" role="alert"><p className="font-bold">Error</p><p>{error}</p></div> )}

      <div className="flex-grow overflow-y-auto p-3 md:p-4 space-y-3">
        {preDeparturePreparation && preDeparturePreparation.length > 0 && (
            <CollapsibleCard title="Pre-Departure Checklist" icon={ClipboardCheck} startExpanded={false}>
                <div className="space-y-1.5 mt-1">
                    {preDeparturePreparation.map((activity, idx) => (
                        <div key={`prep-${idx}`} className="flex items-start p-2.5 bg-yellow-50/50 rounded-md border border-yellow-100">
                            <div className="mr-2 mt-0.5 flex-shrink-0">{getActivityIcon(activity)}</div>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm leading-snug">{activity.name}</p>
                                <p className="text-gray-600 text-sm mt-0.5" dangerouslySetInnerHTML={{ __html: activity.description.replace(/\\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:underline">$1</a>') }}></p>
                                {activity.cost && <p className="text-gray-500 text-xs mt-1">Est. Cost: ${activity.cost}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleCard>
        )}

        <CollapsibleCard title="Pet Travel Regulations" icon={ClipboardCheck} startExpanded={false}>
          <PolicyRequirementsSteps steps={policyRequirements} />
          <GeneralPreparationInfo items={generalPreparation} />
          {tripData?.destinationSlug && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <Link
                href={`/directory/policies/${tripData.destinationSlug}`}
                className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full Destination Policy Details
                <ExternalLink className="h-4 w-4 ml-1.5" />
              </Link>
            </div>
          )}
        </CollapsibleCard>

        <Card className="mb-4 shadow-sm border border-amber-200 bg-amber-50/50">
          <CardHeader className="p-3 pb-1.5">
            <CardTitle className="flex items-center text-amber-800 text-base font-semibold">
              <Stethoscope className="h-5 w-5 mr-2 text-amber-700" /> Veterinary Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-sm text-amber-900 space-y-1.5">
             <p>
                It's always wise to know where local veterinary clinics are, especially during longer trips (over 10-14 days) where a health certificate might be needed for return travel. Keep your pet's records handy.
             </p>
             <a 
                href={`https://www.google.com/maps/search/veterinarian+near+${encodeURIComponent(tripData?.destination?.split(',')[0] || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-teal-700 hover:text-teal-800 hover:underline text-xs font-medium"
              >
                 Find Vets Near {tripData?.destination?.split(',')[0] || 'Destination'} <ExternalLink className="h-3 w-3 ml-1" />
             </a>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold text-black tracking-tight mb-3">Daily Breakdown</h2>
          {itinerary?.days?.map((day: ItineraryDay) => (
            <ItineraryDayAccordion
              key={day.day}
              day={day}
              index={day.day}
              isExpanded={expandedDays.includes(day.day)}
              onToggle={() => handleToggleDay(day.day)}
              onAddActivityClick={() => handleAddActivityClick(day.day)}
              onDeleteActivity={(actIndex) => handleDeleteActivity(day.day, actIndex)}
              onOpenBookingModal={handleOpenBookingModal}
              tripData={tripData}
            />
          ))}
          {(!itinerary || !itinerary.days || itinerary.days.length === 0) && (
              <p className="text-gray-500 italic text-sm p-4 text-center">Itinerary data is not available.</p>
          )}
        </div>
      </div>

      <Drawer open={showMap} onOpenChange={setShowMap} direction="right">
        <DrawerContent className="h-screen top-0 right-0 left-auto mt-0 w-[700px] max-w-[90vw] rounded-none flex flex-col">
          <DrawerHeader className="flex-shrink-0 border-b p-3">
            <DrawerTitle>Trip Activity Map</DrawerTitle>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Button
                variant={mapFilterDay === 'all' ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setMapFilterDay('all')}
              >
                All Days
              </Button>
              {[...(new Set(itinerary?.days?.map(d => d.day) || []))].sort((a, b) => a - b).map(dayNum => (
                <Button
                  key={dayNum}
                  variant={mapFilterDay === dayNum ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => setMapFilterDay(dayNum)}
                >
                  Day {dayNum}
                </Button>
              ))}
            </div>
          </DrawerHeader>
          <div className="flex-grow overflow-auto p-2">
            {(() => {
              const displayedMapActivities = mapFilterDay === 'all'
                ? activitiesForMap
                : activitiesForMap.filter(activity => {
                    const dayData = itinerary?.days?.find(d => d.activities.includes(activity));
                    return dayData?.day === mapFilterDay;
                  });
              
              return <ItineraryMap activities={displayedMapActivities} />;
            })()}
          </div>
           <DrawerFooter className="flex-shrink-0 border-t p-3">
            <DrawerClose asChild>
              <Button variant="outline">Close Map</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {(addingActivityDay !== null) && (
        <Dialog open={addingActivityDay !== null} onOpenChange={() => setAddingActivityDay(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Suggest Activities for Day {addingActivityDay}</DialogTitle>
              <DialogDescription>
                Choose an activity to add to your itinerary.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {isSearchingActivities ? (
                <div className="flex justify-center items-center min-h-[100px]">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : (
                <ul className="space-y-2">
                  {activitySearchResults.map((res, i) => (
                    <li key={i} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200" onClick={() => addingActivityDay !== null && handleSelectActivity(addingActivityDay, res)}>
                      <div>
                        <p className="font-medium text-sm text-gray-800">{res.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{res.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-500 hover:bg-teal-50">
                        <Plus className="h-4 w-4"/>
                      </Button>
                    </li>
                  ))}
                  {activitySearchResults.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No suggestions found (placeholder).</p>}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingActivityDay(null)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {(addingVetDay !== null) && (
        <Dialog open={addingVetDay !== null} onOpenChange={() => setAddingVetDay(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Find Vets for Day {addingVetDay}</DialogTitle>
              <DialogDescription>
                Choose a vet clinic to add to your itinerary.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              {isSearchingVets ? (
                <div className="flex justify-center items-center min-h-[100px]">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </div>
              ) : (
                <ul className="space-y-2">
                  {vetSearchResults.map((res, i) => (
                    <li key={i} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200" onClick={() => addingVetDay !== null && handleAddVet(addingVetDay, res)}>
                      <div>
                        <p className="font-medium text-sm text-gray-800">{res.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{res.description}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-500 hover:bg-teal-50">
                        <Plus className="h-4 w-4"/>
                      </Button>
                    </li>
                  ))}
                  {vetSearchResults.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No vets found (placeholder).</p>}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingVetDay(null)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <HotelBookingModal 
          open={isBookingModalOpen} 
          onOpenChange={setIsBookingModalOpen}
          activity={selectedHotelActivity}
          tripData={tripData}
      />

      <Dialog key={showAuthModal ? 'auth-modal-open' : 'auth-modal-closed'} open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Your Trip</DialogTitle>
            <DialogDescription>
              Please log in or create an account to save your itinerary permanently. Your current progress will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => handleAuthRedirect('/signup')}
              className="flex-1"
            >
              Sign Up
            </Button>
            <Button 
              onClick={() => handleAuthRedirect('/login')}
              className="bg-teal-600 hover:bg-teal-700 text-white flex-1"
            >
              Log In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}