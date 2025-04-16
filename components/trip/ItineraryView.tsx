'use client';

import { useState, useEffect, Fragment } from 'react';
import { useTripStore, Activity, ItineraryDay, PolicyRequirementStep, GeneralPreparationItem } from '@/store/tripStore';
import * as Toast from '@radix-ui/react-toast';

import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';
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
} from 'lucide-react';
import Chatbot from './Chatbot';
import Map, { Marker, Popup, ViewState } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// --- Interfaces (matching store/API) ---
// Removed local interface definitions as they are now imported
// interface Activity { ... }
// interface ItineraryDay { ... }
// interface Itinerary { ... }
// interface PolicyRequirementStep { ... }
// interface GeneralPreparationItem { ... }

interface ItineraryViewProps {
  session: any | null;
}

// --- Helper Function & Components ---

// Enhanced getActivityIcon definition with more icons and colors
const getActivityIcon = (activity: Activity): React.ReactNode => {
  const lowerName = activity.name.toLowerCase();
  const lowerDesc = activity.description.toLowerCase();
  const type = activity.type;

  // Type-based icons first
  if (type === 'flight') return <Plane className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />;
  if (type === 'transfer') return <Car className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />;
  if (type === 'accommodation') return <Hotel className="h-5 w-5 text-cyan-600 mr-3 mt-0.5 flex-shrink-0" />;
  if (type === 'preparation') return <ClipboardCheck className="h-5 w-5 text-yellow-700 mr-3 mt-0.5 flex-shrink-0" />;

  // Meal-specific icons
  if (type === 'meal') {
    if (lowerName.includes('breakfast') || lowerName.includes('cafe') || lowerName.includes('coffee')) return <Coffee className="h-5 w-5 text-yellow-800 mr-3 mt-0.5 flex-shrink-0" />;
    if (lowerName.includes('lunch')) return <Sandwich className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />;
    if (lowerName.includes('dinner') || lowerName.includes('restaurant')) return <Utensils className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />;
    return <Utensils className="h-5 w-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />; // Default meal
  }

  // Activity keyword-based icons
  if (lowerName.includes('park') || lowerName.includes('hike') || lowerName.includes('outdoor') || lowerDesc.includes('walk')) return <Mountain className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />;
  if (lowerName.includes('museum') || lowerName.includes('gallery') || lowerName.includes('art')) return <Palette className="h-5 w-5 text-indigo-600 mr-3 mt-0.5 flex-shrink-0" />;
  if (lowerName.includes('landmark') || lowerName.includes('historical') || lowerName.includes('sightseeing')) return <Landmark className="h-5 w-5 text-purple-700 mr-3 mt-0.5 flex-shrink-0" />;
  if (lowerName.includes('shop') || lowerName.includes('market')) return <ShoppingBag className="h-5 w-5 text-pink-600 mr-3 mt-0.5 flex-shrink-0" />;
  if (lowerName.includes('vet') || lowerDesc.includes('vet')) return <Stethoscope className="h-5 w-5 text-red-700 mr-3 mt-0.5 flex-shrink-0" />;
  if (lowerName.includes('beach') || lowerName.includes('water')) return <Waves className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />;
  if (lowerName.includes('nightlife') || lowerName.includes('bar')) return <Zap className="h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />;

  // Placeholder / Default
  if (type === 'placeholder' || lowerName.includes('relax') || lowerName.includes('free')) return <Wind className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />;

  return <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />; // Final default
};

// Collapsible Card Component
function CollapsibleCard({ title, icon: Icon, children, startExpanded = false }: { title: string; icon: React.ElementType; children: React.ReactNode; startExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(startExpanded);
  const handleToggle = () => setIsExpanded(!isExpanded);

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button onClick={handleToggle} className="w-full text-left p-4 flex justify-between items-center border-b border-gray-200">
        <CardTitle className="flex items-center text-gray-700 text-lg font-semibold">
          <Icon className="h-5 w-5 mr-2" /> {title}
        </CardTitle>
        <ChevronDown className={cn("h-5 w-5 transition-transform text-gray-500", isExpanded && "transform rotate-180")} />
      </button>
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// Updated PolicyRequirementsSteps to use Card internally
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

// Updated GeneralPreparationInfo to use Card internally
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

// Updated BookingOptionCard styling
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

// Updated ItineraryDayAccordion
function ItineraryDayAccordion({ day, index, isExpanded, onToggle, onAddActivity, onFindVets, onDeleteActivity }: { day: ItineraryDay; index: number; isExpanded: boolean; onToggle: () => void; onAddActivity: () => void; onFindVets: () => void; onDeleteActivity: (actIndex: number) => void; }) {
  // Filter activities before rendering
  const validActivities = (day.activities || []).filter((activity, actIndex) => {
    const isValid = activity && typeof activity.name === 'string' && activity.name.trim() !== '' && typeof activity.location === 'string' && activity.location.trim() !== '' && activity.coordinates;
    if (!isValid) {
      console.warn(`[ItineraryView] Filtering out invalid activity at Day ${day.day}, Index ${actIndex}:`, activity);
      // TODO: Consider non-blocking logging to Supabase/monitoring service here
    }
    return isValid;
  });

  return (
    <div className="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <button onClick={onToggle} className={cn("w-full text-left p-3 flex justify-between items-center border-b border-gray-200 bg-gray-50", isExpanded ? "border-b-0 hover:bg-gray-50/50" : "border-b-0")}>
        <div>
          <h3 className="text-base font-semibold text-teal-700">Day {day.day}: {day.date}</h3>
          <p className="text-xs text-gray-600">{day.city}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform text-gray-500", isExpanded && "transform rotate-180")} />
      </button>
      {isExpanded && (
        <div className="p-3">
          {day.travel && (
            <div className="mb-3 bg-blue-50 p-2.5 rounded-md border border-blue-200">
              <h4 className="font-semibold flex items-center text-blue-700 text-xs"><Plane className="h-3 w-3 mr-1.5" /> Travel Details</h4>
              <p className="text-gray-700 mt-1 text-xs">{day.travel}</p>
            </div>
          )}
          <div className="mb-3">
            <h4 className="font-semibold text-gray-800 mb-1.5 text-sm">Activities</h4>
            <div className="space-y-2">
              {validActivities.length > 0 ? (
                validActivities.map((activity, actIndex) => {
                  const icon = getActivityIcon(activity);
                  return (
                    <div key={actIndex} className="flex justify-between items-start p-2.5 bg-gray-50/50 rounded-md border border-gray-100 group">
                      <div className="flex items-start flex-grow">
                        {icon}
                        <div className="flex-grow">
                          <p className="font-medium text-gray-800 text-sm leading-snug">{activity.name}</p>
                          <p className="text-gray-600 text-xs mt-0.5">{activity.description}</p>
                          <p className="text-gray-500 text-xs mt-0.5 flex items-center"><MapPin className="h-3 w-3 mr-1" /> {activity.location}</p>
                          {(activity.startTime || activity.cost) && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              {activity.startTime && <span>{activity.startTime}{activity.endTime ? ` - ${activity.endTime}` : ''}</span>}
                              {activity.startTime && activity.cost && <span>|</span>}
                              {activity.cost && <span>{activity.cost}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => {
                           const originalIndex = (day.activities || []).findIndex(a => a === activity); 
                           if (originalIndex !== -1) {
                              onDeleteActivity(originalIndex);
                           } else {
                               console.error("Could not find original index for deletion after filtering");
                           }
                       }}
                       className="text-gray-400 hover:text-red-600 p-1 ml-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete activity">
                         <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              ) : ( <p className="text-gray-500 italic text-xs px-1">No activities planned for this day.</p> )}
            </div>
            <div className="flex justify-start space-x-2 mt-3">
              <Button variant="outline" size="sm" onClick={onAddActivity}><Plus className="h-3 w-3 mr-1" /> Activity</Button>
              <Button variant="outline" size="sm" onClick={onFindVets}><Stethoscope className="h-3 w-3 mr-1" /> Find Vets</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItineraryMap({ activities }: { activities: Array<Activity> }) {
  const initialCoords = activities.find(a => a.coordinates && a.coordinates.lat !== 0 && a.coordinates.lng !== 0)?.coordinates;
  const [viewState, setViewState] = useState<ViewState>({
    longitude: initialCoords?.lng || -98.5795,
    latitude: initialCoords?.lat || 39.8283,
    zoom: initialCoords ? 11 : 3,
    bearing: 0,
    pitch: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  useEffect(() => {
    const firstValidCoords = activities.find(a => a.coordinates && a.coordinates.lat !== 0 && a.coordinates.lng !== 0)?.coordinates;
    if (firstValidCoords) {
      setViewState(prev => ({ ...prev, longitude: firstValidCoords.lng, latitude: firstValidCoords.lat, zoom: 11 }));
    }
  }, [activities]);

  return (
    <div className="h-[350px] w-full rounded-lg overflow-hidden relative border border-gray-200">
      <Map {...viewState} onMove={(evt) => setViewState(evt.viewState)} style={{ width: '100%', height: '100%' }} mapStyle="mapbox://styles/mapbox/streets-v11" mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}>
        {activities.map((activity, index) => (
          activity.coordinates && activity.coordinates.lat !== 0 && activity.coordinates.lng !== 0 && (
             <Marker key={index} longitude={activity.coordinates.lng} latitude={activity.coordinates.lat} onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedActivity(activity); }}>
                <MapPin className="h-6 w-6 text-red-500 cursor-pointer hover:text-red-700 transition-colors" />
             </Marker>
          )))} 
        {selectedActivity && selectedActivity.coordinates && (
          <Popup longitude={selectedActivity.coordinates.lng} latitude={selectedActivity.coordinates.lat} onClose={() => setSelectedActivity(null)} closeOnClick={false} anchor="bottom" offset={30}>
            <div>
              <h4 className="font-semibold text-sm">{selectedActivity.name}</h4>
              <p className="text-xs text-gray-600">{selectedActivity.location}</p>
            </div>
          </Popup>
        )}
      </Map>
      {!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && ( <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center z-10"><p className="text-red-600 font-semibold p-4 bg-white rounded shadow">Mapbox Access Token is missing.</p></div> )}
    </div>
  );
}

// --- Main Component ---
export default function ItineraryView({ session }: ItineraryViewProps) {
  // Get state/actions from store
  const { tripData, isSaving, error, clearTrip, addActivity, deleteActivity, setIsSaving, setError } = useTripStore();

  // Derive specific data from tripData, handle null case
  const itinerary = tripData?.itinerary;
  const policyRequirements = tripData?.policyRequirements;
  const generalPreparation = tripData?.generalPreparation;
  const preDeparturePreparation = tripData?.preDeparturePreparation;

  // Component state
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '' });
  const [showMap, setShowMap] = useState(false);
  const [activitiesForMap, setActivitiesForMap] = useState<Activity[]>([]);
  const [addingActivityDay, setAddingActivityDay] = useState<number | null>(null);
  const [activitySearchResults, setActivitySearchResults] = useState<any[]>([]);
  const [isSearchingActivities, setIsSearchingActivities] = useState(false);
  const [addingVetDay, setAddingVetDay] = useState<number | null>(null);
  const [vetSearchResults, setVetSearchResults] = useState<any[]>([]);
  const [isSearchingVets, setIsSearchingVets] = useState(false);
  const [showChatbot, setShowChatbot] = useState(true);
  const [isPolicyExpanded, setIsPolicyExpanded] = useState(false);

  // Expand first day effect
  useEffect(() => {
    if (itinerary?.days && itinerary.days.length > 0 && expandedDays.length === 0) {
      setExpandedDays([itinerary.days[0].day]);
    }
  }, [itinerary, expandedDays]);

  // Map activities effect
  useEffect(() => {
    if (itinerary?.days) {
       const allActivities = itinerary.days.flatMap((day: ItineraryDay) => day.activities || []);
       setActivitiesForMap(allActivities);
    } else { setActivitiesForMap([]); }
  }, [itinerary]);

  // Handlers
  const handleToggleDay = (day: number) => {
    setExpandedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };
  const toggleMapView = () => setShowMap(prev => !prev);

  const handleAddActivity = async (day: number) => {
     setAddingActivityDay(day);
     setIsSearchingActivities(true);
     setActivitySearchResults([]); 
     // Fix: Check tripData before accessing properties
     const currentDayData = itinerary?.days.find(d => d.day === day);
     if (!currentDayData || !tripData) { setIsSearchingActivities(false); return; }
     // Placeholder fetch logic
     await new Promise(resolve => setTimeout(resolve, 750)); 
     const mockResults = [
       { name: "Nearby Pet Cafe", description: "Coffee time!", location: currentDayData.city, coordinates: { lat: 0, lng: 0}, petFriendly: true },
       { name: "Local Park", description: "Walkies!", location: currentDayData.city, coordinates: { lat: 0, lng: 0}, petFriendly: true },
     ];
     setActivitySearchResults(mockResults);
     setIsSearchingActivities(false);
  };

  const handleSelectActivity = (day: number, activity: any) => {
     addActivity(day, { name: activity.name, description: activity.description, petFriendly: activity.petFriendly ?? true, location: activity.location, coordinates: activity.coordinates });
     setAddingActivityDay(null); setActivitySearchResults([]);
     setToastMessage({ title: 'Activity Added', description: `${activity.name} added to Day ${day}` }); setOpenToast(true);
     handleSaveTrip(); // Auto-save
  };

  const handleDeleteActivity = (day: number, activityIndex: number) => {
    const dayData = itinerary?.days.find((d: ItineraryDay) => d.day === day); // Added explicit type
    const activityName = dayData?.activities[activityIndex]?.name || 'Activity';
    deleteActivity(day, activityIndex);
    setToastMessage({ title: 'Activity Removed', description: `${activityName} removed from Day ${day}` }); setOpenToast(true);
    handleSaveTrip(); // Auto-save
  };

  const handleFindVets = async (day: number) => {
     setAddingVetDay(day);
     setIsSearchingVets(true);
     setVetSearchResults([]);
     // Fix: Check tripData before accessing properties
     const currentDayData = itinerary?.days.find(d => d.day === day);
     if (!currentDayData || !tripData) { setIsSearchingVets(false); return; }
     // Placeholder fetch logic
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
    handleSaveTrip(); // Auto-save
  };

  const handleSaveTrip = async () => {
    if (!session || !tripData) { setError('Cannot save: No user session or trip data.'); setToastMessage({title: 'Save Failed', description: 'Please log in and create a trip first.'}); setOpenToast(true); return; }
    setIsSaving(true); setError(null);
    const supabase = createClient();
    try {
      const { error: saveError } = await supabase.from('draft_itineraries').upsert({ user_id: session.user.id, trip_data: tripData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (saveError) throw saveError;
      setToastMessage({ title: 'Trip Saved', description: 'Progress saved.' }); setOpenToast(true);
    } catch (e: any) {
      setError(`Failed to save trip: ${e.message || 'Unknown error'}`); setToastMessage({ title: 'Save Failed', description: `Could not save progress. ${e.message || ''}` }); setOpenToast(true);
    } finally { setIsSaving(false); }
  };

  const handleNewTrip = async () => {
    if (session) { /* ... delete draft ... */ }
    clearTrip();
  };

  // --- Render Logic ---
  if (!tripData) { 
    return ( <div className="flex justify-center items-center h-screen"><div className="text-center"><p className="text-xl text-gray-600">Loading itinerary or no trip data found...</p></div></div> );
  }
  if (!itinerary) { 
      // This case might occur if tripData exists but itinerary hasn't been generated yet
      return ( <div className="flex justify-center items-center h-screen"><div className="text-center"><p className="text-xl text-gray-600">Generating itinerary...</p></div></div> );
  }

  return (
    <div className="flex flex-col md:flex-row relative">
       {/* Left sidebar - Chatbot (Sticky) */} 
       {showChatbot && (
         <div className="w-full md:w-[35%] md:sticky md:top-0 md:h-screen md:border-r border-gray-200 bg-white p-4 md:overflow-y-auto flex-shrink-0 mb-4 md:mb-0">
           <Chatbot 
             tripData={tripData}
             session={session} 
             onClose={() => setShowChatbot(false)} 
           />
         </div>
       )}
       
      {/* Right content - Itinerary (Takes remaining width, natural scroll) */}
      <div className={cn("flex-grow", showChatbot ? "w-full md:w-[65%]" : "w-full")}> 
        {/* Header (Sticky within its column) */} 
        <div className="sticky top-0 bg-white z-10 p-3 border-b border-gray-200 shadow-sm flex justify-between items-center mb-4 flex-wrap gap-2">
           <div className="flex items-center gap-2">
             {!showChatbot && (
               <Button variant="outline" size="sm" onClick={() => setShowChatbot(true)}>Show Assistant</Button>
             )}
             <h1 className="text-lg md:text-xl font-bold text-gray-800">Your Pet-Friendly Trip</h1>
           </div>
           <div className="flex gap-1.5 flex-wrap">
             <Button onClick={handleSaveTrip} disabled={isSaving} size="sm">{isSaving ? 'Saving...' : 'Save Progress'}</Button>
             <Button variant="outline" onClick={toggleMapView} size="sm">{showMap ? 'Hide Map' : 'Show Map'}</Button>
             <Button variant="outline" onClick={handleNewTrip} size="sm">New Trip</Button>
           </div>
        </div>

        {/* Toast */} 
        <Toast.Provider swipeDirection="right">
          <Toast.Root open={openToast} onOpenChange={setOpenToast} className="bg-white border border-gray-200 shadow-lg p-4 rounded-lg z-50 data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut">
            <Toast.Title className={cn("font-semibold text-base mb-1", error ? "text-red-600" : "text-teal-700")}>{toastMessage.title}</Toast.Title>
            <Toast.Description className="text-gray-600 text-sm">{toastMessage.description}</Toast.Description>
            <Toast.Close className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></Toast.Close>
          </Toast.Root>
          <Toast.Viewport className="fixed bottom-0 right-0 p-6 w-[390px] max-w-[100vw] z-[2147483647] outline-none" />
        </Toast.Provider>

        {/* Error Display */} 
        {error && ( <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 mx-4" role="alert"><p className="font-bold">Error</p><p>{error}</p></div> )}
         
        <div className="p-4 pt-0">
          {/* Pre-Departure Steps (if they exist) */} 
          {preDeparturePreparation && preDeparturePreparation.length > 0 && (
              <CollapsibleCard title="Pre-Departure Checklist" icon={ClipboardCheck} startExpanded={true}> 
                  <div className="space-y-2 mt-1"> 
                      {preDeparturePreparation.map((activity, idx) => (
                          <div key={`prep-${idx}`} className="flex items-start p-2 bg-yellow-50/50 rounded-md border border-yellow-100">
                              {getActivityIcon(activity)} 
                              <div>
                                  <p className="font-medium text-gray-800 text-sm leading-snug">{activity.name}</p>
                                  <p className="text-gray-600 text-xs mt-0.5" dangerouslySetInnerHTML={{ __html: activity.description.replace(/\\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:underline">$1</a>') }}></p>
                                  {activity.cost && <p className="text-gray-500 text-xs mt-0.5">Est. Cost: {activity.cost}</p>}
                              </div>
                          </div>
                      ))}
                  </div>
              </CollapsibleCard>
          )}

          {/* Policy Info (Collapsible) */} 
          <CollapsibleCard title="Pet Travel Regulations" icon={ClipboardCheck} startExpanded={false}> 
            <PolicyRequirementsSteps steps={policyRequirements} />
            <GeneralPreparationInfo items={generalPreparation} />
          </CollapsibleCard>

          {/* Booking Options */} 
           <Card className="mb-4 shadow-sm">
             <CardHeader className="p-3">
               <CardTitle className="text-base font-semibold">Quick Booking Links</CardTitle>
             </CardHeader>
             <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
               <BookingOptionCard title="Flights" icon={<Plane className="h-5 w-5"/>} url={`https://www.google.com/flights?hl=en#flt=${encodeURIComponent(tripData?.origin || '')}.${encodeURIComponent(tripData?.destination || '')}.${tripData?.startDate || 'anytime'}*${encodeURIComponent(tripData?.destination || '')}.${encodeURIComponent(tripData?.origin || '')}.${tripData?.endDate || 'anytime'};c:USD;e:1;sd:1;t:f`} />
               <BookingOptionCard title="Hotels" icon={<Hotel className="h-5 w-5"/>} url={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(tripData?.destination || '')}&pets=1`} />
               <BookingOptionCard title="Cars" icon={<Car className="h-5 w-5"/>} url={`https://www.kayak.com/cars/${encodeURIComponent(tripData?.destination || '')}/${tripData?.startDate || 'anytime'}/${tripData?.endDate || 'anytime'}?sort=rank_a`} />
               <BookingOptionCard title="Vets" icon={<Stethoscope className="h-5 w-5"/>} url={`https://www.google.com/maps/search/veterinarian+near+${encodeURIComponent(tripData?.destination || '')}`} />
             </CardContent>
           </Card>

          {/* Map View */} 
          {showMap && (
             <Card className="mb-4 shadow-sm">
               <CardHeader className="p-3"><CardTitle className="text-base font-semibold">Trip Activity Map</CardTitle></CardHeader>
               <CardContent className="p-1"><ItineraryMap activities={activitiesForMap} /></CardContent>
             </Card>
          )}

          {/* Daily Breakdown */} 
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Daily Breakdown</h2>
            {itinerary?.days?.map((day: ItineraryDay) => (
              <ItineraryDayAccordion  
                  key={day.day} day={day} index={day.day} 
                  isExpanded={expandedDays.includes(day.day)} 
                  onToggle={() => handleToggleDay(day.day)} 
                  onAddActivity={() => handleAddActivity(day.day)} 
                  onFindVets={() => handleFindVets(day.day)} 
                  onDeleteActivity={(actIndex) => handleDeleteActivity(day.day, actIndex)} 
                />
            ))}
            {(!itinerary || !itinerary.days || itinerary.days.length === 0) && (
                <p className="text-gray-500 italic text-sm p-4 text-center">Itinerary data is not available.</p>
            )}
          </div> 
        </div> 
      </div>

      {/* Modals */} 
      {(addingActivityDay !== null) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h5 className="font-semibold mb-2 text-gray-700">Suggest Activities for Day {addingActivityDay}</h5>
            {isSearchingActivities ? <p className="text-sm text-gray-500">Searching...</p> : (
              <ul className="space-y-1.5">
                {activitySearchResults.map((res, i) => (
                  <li key={i} className="flex justify-between items-center p-1.5 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleSelectActivity(addingActivityDay, res)}>
                    <div><p className="font-medium text-sm">{res.name}</p><p className="text-xs text-gray-600">{res.description}</p></div>
                    <Plus className="h-4 w-4 text-teal-500"/>
                  </li> ))}
                {activitySearchResults.length === 0 && <p className="text-sm text-gray-500">No suggestions found (placeholder).</p>}
              </ul>
            )}
            <Button size="sm" variant="ghost" onClick={() => setAddingActivityDay(null)} className="mt-2.5 text-xs">Cancel</Button>
          </div>
        </div>
      )}
      {(addingVetDay !== null) && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h5 className="font-semibold mb-2 text-gray-700">Find Vets for Day {addingVetDay}</h5>
            {isSearchingVets ? <p className="text-sm text-gray-500">Searching...</p> : (
              <ul className="space-y-1.5">
                {vetSearchResults.map((res, i) => (
                  <li key={i} className="flex justify-between items-center p-1.5 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleAddVet(addingVetDay, res)}>
                    <div><p className="font-medium text-sm">{res.name}</p><p className="text-xs text-gray-600">{res.description}</p></div>
                    <Plus className="h-4 w-4 text-teal-500"/>
                  </li> ))}
                {vetSearchResults.length === 0 && <p className="text-sm text-gray-500">No vets found (placeholder).</p>}
              </ul>
            )}
            <Button size="sm" variant="ghost" onClick={() => setAddingVetDay(null)} className="mt-2.5 text-xs">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}