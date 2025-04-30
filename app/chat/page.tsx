'use client';

import ChatBuilder from '@/components/trip/ChatBuilder';
import TopBar from '@/components/trip/TopBar';
import MarketingSidebar from '@/components/trip/MarketingSidebar';
import { useTripStore, TripData } from '@/store/tripStore';
import ItineraryView from '@/components/trip/ItineraryView';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
// Import Dialog components from Shadcn UI
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button'; // Ensure Button is imported if needed in modals

/**
 * Chat Page Component
 * The main page for the conversational trip planning interface.
 * Orchestrates the display of TopBar, ChatBuilder, MarketingSidebar, and eventually ItineraryView.
 * Handles the initiation of itinerary generation.
 * @returns {JSX.Element}
 */
export default function ChatPage() {
  const { toast } = useToast();
  
  // Select only state needed for rendering directly
  const tripData = useTripStore((state) => state.tripData);
  const isStoreLoading = useTripStore((state) => state.isLoading);
  // Access actions directly when needed, relying on Zustand's stable identities
  const setTripData = useTripStore((state) => state.setTripData);
  const setIsLoading = useTripStore((state) => state.setIsLoading);
  const setError = useTripStore((state) => state.setError);

  // State to track if an itinerary has been generated in this session
  const [itineraryGenerated, setItineraryGenerated] = useState(false);

  // Placeholder for session data - replace with actual auth logic later
  const [session, setSession] = useState<any | null>(null);
  // Modal states
  const [isWhereModalOpen, setIsWhereModalOpen] = useState(false);
  const [isWhenModalOpen, setIsWhenModalOpen] = useState(false);
  const [isTravelersModalOpen, setIsTravelersModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  useEffect(() => {
    // Simulate fetching session data on mount
    // Replace with actual Supabase auth check
    const checkSession = async () => {
      // const { data: { session } } = await supabase.auth.getSession();
      // setSession(session);
      setSession({ user: { id: 'mock-user-id' } }); // Mock session for now
    };
    checkSession();
  }, []);

  // Determine if we should show the itinerary view 
  // Check if tripData exists, has an itinerary object with days, and generation isn't actively loading
  const showItinerary = tripData?.itinerary && tripData.itinerary.days && tripData.itinerary.days.length > 0 && !isStoreLoading;

  // Update itineraryGenerated state when showItinerary becomes true
  useEffect(() => {
    if (showItinerary) {
      setItineraryGenerated(true);
    }
    // We might need a way to reset this if the user starts a genuinely new chat/trip
    // For now, it persists once an itinerary is shown
  }, [showItinerary]);

  /**
   * Callback function passed to ChatBuilder.
   * Initiates the itinerary generation process by calling the backend API.
   */
  const handleInitiateGeneration = useCallback(async () => {
    // Access tripData directly from the hook instance inside the callback
    const currentTripData = useTripStore.getState().tripData;
    if (!currentTripData) {
      setError('Cannot generate itinerary: Trip data is missing.');
      setIsLoading(false); // Ensure loading is stopped
      toast({ title: "Missing Information", description: "Trip data missing.", variant: "destructive" });
      return;
    }

    // ** Frontend Check for Essential Fields **
    if (!currentTripData || !currentTripData.destination || !currentTripData.startDate || !currentTripData.endDate) {
      let missingFields = [];
      if (!currentTripData?.destination) missingFields.push('destination');
      if (!currentTripData?.startDate) missingFields.push('start date');
      if (!currentTripData?.endDate) missingFields.push('end date');
      
      const errorMsg = `Cannot generate itinerary: Missing essential fields (${missingFields.join(', ')}).`;
      console.error('[ChatPage]', errorMsg, currentTripData); 
      setError(errorMsg);
      setIsLoading(false); 
      toast({ title: "Missing Information", description: `Please provide the ${missingFields.join(' and ')} before generating.`, variant: "destructive" });
      return;
    }

    console.log('[ChatPage] Initiating itinerary generation with tripData:', currentTripData);
    setIsLoading(true);
    setError(null);

    try {
      // Correct the API endpoint path here
      const response = await fetch('/api/ai/enhanced-itinerary', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTripData),
      });
      
      // Check if the response is actually JSON before trying to parse
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await response.text(); // Get the response as text
          console.error('[ChatPage] Received non-JSON response from generation API:', textResponse);
          throw new Error(`Server returned non-JSON response (Status: ${response.status})`);
      }

      const result = await response.json();

      if (!response.ok) {
        console.error('[ChatPage] Itinerary generation API error (JSON parsed):', result);
        // Use error message from JSON response if available
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }

      console.log('[ChatPage] Itinerary generated successfully:', result.tripData);

      // Update the store with the complete trip data (including itinerary)
      setTripData(result.tripData as TripData);
      // No need to set itineraryGenerated here, the effect watching showItinerary handles it.
      toast({ title: "Itinerary Ready!", description: "Your trip plan has been generated." });

    } catch (error: any) {
      console.error('[ChatPage] Error during itinerary generation:', error);
      setError(`Failed to generate itinerary: ${error.message}`);
      toast({ 
          title: "Generation Failed", 
          description: `Could not generate itinerary. ${error.message}`,
          variant: "destructive" 
      });
    } finally {
       // IMPORTANT: Generation API or this function MUST set isLoading to false in the store upon completion/error
       // Assuming the generation API doesn't do it, we do it here.
       // If the generation API *does* handle setting isLoading:false, remove this line.
       setIsLoading(false); 
    }
  }, [setIsLoading, setError, setTripData, toast]);

  // --- Modal Handlers ---
  const handleUpdateTripData = useCallback((updates: Partial<TripData>) => {
    // Read latest tripData inside the callback
    const currentTripData = useTripStore.getState().tripData;
    // TODO: Add logic to also inform the backend/AI via API if needed
    setTripData({ ...(currentTripData || {}), ...updates });
    
    setIsWhereModalOpen(false);
    setIsWhenModalOpen(false);
    setIsTravelersModalOpen(false);
    setIsBudgetModalOpen(false);
    toast({ title: "Trip Updated", description: "Your changes have been applied." });
  }, [setTripData, toast]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-50 font-sans">
      {/* TopBar is always visible */}
      <TopBar 
        className="flex-shrink-0" 
        // Pass modal toggle functions to TopBar
        onWhereClick={() => setIsWhereModalOpen(true)}
        onWhenClick={() => setIsWhenModalOpen(true)}
        onTravelersClick={() => setIsTravelersModalOpen(true)}
        onBudgetClick={() => setIsBudgetModalOpen(true)}
        // Add handlers for other buttons as needed
        // onNewChatClick={() => { /* TODO: Implement new chat logic */ }}
        // onInviteClick={() => setIsInviteModalOpen(true)}
        // onCreateTripClick={() => { /* TODO: Navigate or open form modal */ }}
      />

      {/* Main Content Area */}
      <div className="flex-grow flex overflow-hidden">
        {/* Left Column: Switches between ChatBuilder and ItineraryView */}
        <div className="w-full md:w-1/2 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          {/* Conditionally render ChatBuilder or ItineraryView */} 
          {/* Show itinerary if generated, otherwise show the chat builder */} 
          {showItinerary ? (
            <ItineraryView 
                session={session} 
                // Add relevant props for ItineraryView if needed
                // onBackToPlanning={() => setItineraryGenerated(false)} // Example: Button to go back to chat 
             />
          ) : itineraryGenerated ? (
            <div className="flex items-center justify-center h-full">
                <p className="text-gray-600 animate-pulse">Generating your perfect trip...</p> 
            </div>
          ) : (
            <ChatBuilder 
               session={session} 
               className="h-full" 
               onInitiateItineraryGeneration={handleInitiateGeneration} 
            />
          )}
        </div>

        {/* Right Column: Marketing Sidebar */}
        <div className="hidden md:block md:w-1/2 h-full border-l border-gray-200">
          {/* Render the actual sidebar component */}
          <MarketingSidebar className="h-full" />
        </div>
      </div>

      {/* --- Modals --- */}
      {/* Placeholder Where Modal */} 
      <Dialog open={isWhereModalOpen} onOpenChange={setIsWhereModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Destination</DialogTitle>
            <DialogDescription>
              Enter your desired destination.
              {/* TODO: Add CityAutocomplete component here */}
            </DialogDescription>
          </DialogHeader>
          {/* TODO: Form content */} 
          <DialogFooter>
             <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={() => handleUpdateTripData({ destination: 'Paris, France' /* TODO: Get value from input */ })}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Placeholder When Modal */} 
      <Dialog open={isWhenModalOpen} onOpenChange={setIsWhenModalOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Dates</DialogTitle>
             <DialogDescription>
               Select your travel dates.
               {/* TODO: Add Date Range Picker component here */}
             </DialogDescription>
           </DialogHeader>
           {/* TODO: Form content */} 
           <DialogFooter>
             <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
             <Button onClick={() => handleUpdateTripData({ startDate: '2024-11-01' /* TODO */, endDate: '2024-11-08' /* TODO */ })}>Save</Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Placeholder Travelers Modal */} 
      <Dialog open={isTravelersModalOpen} onOpenChange={setIsTravelersModalOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Travelers</DialogTitle>
             <DialogDescription>
               Specify the number of adults, children, and pets.
               {/* TODO: Add counter components here */}
             </DialogDescription>
           </DialogHeader>
           {/* TODO: Form content */} 
           <DialogFooter>
             <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
             <Button onClick={() => handleUpdateTripData({ adults: 2 /* TODO */, children: 1 /* TODO */, pets: 1 /* TODO */ })}>Save</Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>
      
      {/* Placeholder Budget Modal */} 
      <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Budget</DialogTitle>
             <DialogDescription>
               Select your preferred budget level.
               {/* TODO: Add RadioGroup or Select component here */}
             </DialogDescription>
           </DialogHeader>
           {/* TODO: Form content */} 
           <DialogFooter>
             <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
             <Button onClick={() => handleUpdateTripData({ budget: 'Moderate' /* TODO */ })}>Save</Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Add Toaster component - Ensure it's rendered, typically in the root layout */}
      {/* <Toaster /> */}
    </div>
  );
}
