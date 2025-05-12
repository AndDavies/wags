'use client';

import ChatBuilder from '@/components/trip/ChatBuilder';
import TopBar from '@/components/trip/TopBar';
import MarketingSidebar from '@/components/trip/MarketingSidebar';
import { useTripStore, TripData } from '@/store/tripStore';
import ItineraryView from '@/components/trip/ItineraryView';
import { useEffect, useState, useCallback, useRef } from 'react';
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
// NEW: Import Input and Label
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// NEW: Import Calendar and date utilities
import { Calendar } from '@/components/ui/calendar';
import { type DateRange } from "react-day-picker";
import { format, parse, isValid } from 'date-fns';
// NEW: Import RadioGroup components
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// NEW: Import CityAutocomplete
import CityAutocomplete from '@/components/trip/CityAutocomplete';
// Import Supabase client
import { createClient } from '@/lib/supabase-client';

/**
 * Chat Page Component
 * The main page for the conversational trip planning interface.
 * Orchestrates the display of TopBar, ChatBuilder, MarketingSidebar, and eventually ItineraryView.
 * Handles the initiation of itinerary generation.
 * Manages modal interactions for editing trip details.
 * @returns {JSX.Element}
 */
export default function ChatPage() {
  const { toast } = useToast();
  
  // Select state from store
  const tripData = useTripStore((state) => state.tripData);
  const isStoreLoading = useTripStore((state) => state.isLoading); // Primary loading indicator for generation
  // Access actions
  const setTripData = useTripStore((state) => state.setTripData);
  const setIsLoading = useTripStore((state) => state.setIsLoading);
  const setError = useTripStore((state) => state.setError);

  const [session, setSession] = useState<any | null>(null);
  // Modal states
  const [isWhereModalOpen, setIsWhereModalOpen] = useState(false);
  const [isWhenModalOpen, setIsWhenModalOpen] = useState(false);
  const [isTravelersModalOpen, setIsTravelersModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // --- Temporary State for Modals ---
  const [tempDestination, setTempDestination] = useState<string>('');
  const [tempDestinationCountry, setTempDestinationCountry] = useState<string>('');
  // NEW: Temporary state for Date Range Picker
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  // NEW: Temporary state for Travelers inputs
  const [tempAdults, setTempAdults] = useState<number>(1);
  const [tempChildren, setTempChildren] = useState<number>(0);
  const [tempPets, setTempPets] = useState<number>(0);
  // NEW: Temporary state for Budget selection
  const [tempBudget, setTempBudget] = useState<string>('Moderate');

  // Define budget options
  const budgetOptions = ['Budget-Friendly', 'Moderate', 'Luxury'];

  // NEW: Define a ref type for ChatBuilder's exposed methods
  interface ChatBuilderRef {
    sendSystemMessage: (message: string) => void;
  }

  // Create the ref
  const chatBuilderRef = useRef<ChatBuilderRef>(null);

  useEffect(() => {
    // Fetch the actual session data
    const fetchSession = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("[ChatPage] Error fetching session:", error);
        setSession(null);
      } else {
        console.log("[ChatPage] Fetched session successfully:", data.session);
        setSession(data.session); // Set the entire session object or null
      }
    };

    fetchSession();
  }, []);

  // Determine if we should show the itinerary view
  // Itinerary exists in the store and we are not actively loading (API call finished)
  const showItinerary = !!(tripData?.itinerary && tripData.itinerary.days && tripData.itinerary.days.length > 0);

  /**
   * Opens the 'Where' modal and pre-fills the temporary state.
   */
  const handleOpenWhereModal = useCallback(() => {
    const currentTripData = useTripStore.getState().tripData;
    setTempDestination(currentTripData?.destination || '');
    setTempDestinationCountry(currentTripData?.destinationCountry || '');
    setIsWhereModalOpen(true);
  }, []); // No dependencies needed as it reads fresh state

  /**
   * Opens the 'When' modal and pre-fills the temporary date range state.
   * Attempts to parse YYYY-MM-DD and YYYY-MM formats.
   */
  const handleOpenWhenModal = useCallback(() => {
    const currentTripData = useTripStore.getState().tripData;
    let fromDate: Date | undefined = undefined;
    let toDate: Date | undefined = undefined;

    // --- Refined Date Parsing --- 
    const parseFlexibleDate = (dateString: string | undefined | null): Date | undefined => {
        if (!dateString) return undefined;
        
        // Attempt 1: YYYY-MM-DD
        let parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
        if (isValid(parsedDate)) {
            console.log(`[ChatPage] Parsed date ${dateString} as YYYY-MM-DD:`, parsedDate);
            return parsedDate;
        }

        // Attempt 2: YYYY-MM
        parsedDate = parse(dateString, 'yyyy-MM', new Date());
        if (isValid(parsedDate)) {
            console.log(`[ChatPage] Parsed date ${dateString} as YYYY-MM:`, parsedDate);
            // Calendar needs a specific day, use the 1st of the month
            return parsedDate; 
        }
        
        // Attempt 3: Use Date constructor as fallback for other formats it might handle
        try {
             parsedDate = new Date(dateString);
             if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1970) {
                console.log(`[ChatPage] Parsed date ${dateString} via Date constructor:`, parsedDate);
                return parsedDate;
             }
        } catch(e) {
            // Ignore constructor errors
        }

        console.warn(`[ChatPage] Could not parse date string: ${dateString}`);
        return undefined;
    }
    
    // Check if start date is already a Date object, otherwise parse string
    fromDate = currentTripData?.startDate instanceof Date 
        ? currentTripData.startDate 
        : parseFlexibleDate(currentTripData?.startDate as string | undefined | null);
    
    // Check if end date is already a Date object, otherwise parse string
    toDate = currentTripData?.endDate instanceof Date 
        ? currentTripData.endDate 
        : parseFlexibleDate(currentTripData?.endDate as string | undefined | null);

    // Handle case where only start date is valid (e.g., single day trip or start of range)
    if (fromDate && !toDate) {
        toDate = fromDate; // Set end date same as start for initial display
    }

    console.log('[ChatPage] Setting tempDateRange for modal: ', { from: fromDate, to: toDate });
    setTempDateRange({ from: fromDate, to: toDate });
    setIsWhenModalOpen(true);
  }, []); // No dependencies needed

  /**
   * Opens the 'Travelers' modal and pre-fills the temporary state.
   */
  const handleOpenTravelersModal = useCallback(() => {
    const currentTripData = useTripStore.getState().tripData;
    setTempAdults(currentTripData?.adults ?? 1); // Default to 1 adult if undefined
    setTempChildren(currentTripData?.children ?? 0);
    setTempPets(currentTripData?.pets ?? 0);
    setIsTravelersModalOpen(true);
  }, []); // No dependencies needed

  /**
   * Opens the 'Budget' modal and pre-fills the temporary state.
   */
  const handleOpenBudgetModal = useCallback(() => {
    const currentTripData = useTripStore.getState().tripData;
    // Default to Moderate if budget is not set or is an unrecognized value
    const currentBudget = currentTripData?.budget;
    setTempBudget(currentBudget && budgetOptions.includes(currentBudget) ? currentBudget : 'Moderate');
    setIsBudgetModalOpen(true);
  }, [budgetOptions]); // Add budgetOptions as dependency

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

    // ** Frontend Check for Essential Fields (redundant with backend but good UX) **
    // The backend now only strictly requires these
    if (!currentTripData.destination || !currentTripData.destinationCountry || !currentTripData.startDate || !currentTripData.endDate) {
      let missingFields = [];
      if (!currentTripData?.destination) missingFields.push('destination');
      if (!currentTripData?.destinationCountry) missingFields.push('destination country'); // Added check
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

    // Prepare data for the API, ensuring accommodation is a string
    const accommodationForApi = Array.isArray(currentTripData.accommodation) && currentTripData.accommodation.length > 0
      ? currentTripData.accommodation[0]
      : currentTripData.accommodation && typeof currentTripData.accommodation === 'string'
      ? currentTripData.accommodation // It's already a string (less likely given store type)
      : 'Hotel'; // Default

    const tripDataForApi = {
      ...currentTripData,
      accommodation: accommodationForApi,
    };

    try {
      // *** POINT TO THE NEW SIMPLER ENDPOINT ***
      const response = await fetch('/api/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the modified tripDataForApi with accommodation as a string
        body: JSON.stringify(tripDataForApi), 
      });
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          const textResponse = await response.text();
          console.error('[ChatPage] Received non-JSON response from chat generation API:', textResponse);
          throw new Error(`Server returned non-JSON response (Status: ${response.status})`);
      }

      const result = await response.json();

      if (!response.ok) {
        console.error('[ChatPage] Chat itinerary generation API error (JSON parsed):', result);
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }

      console.log('[ChatPage] Itinerary generated successfully via chat endpoint:', result);

      // *** UPDATE THE STORE WITH THE FULL RESULT ***
      // The backend returns the *complete* data including itinerary, policies, etc.
      // We need to create a new object combining the initial data with the generated parts.
      const finalTripData: TripData = {
        ...(currentTripData || {}), // Start with existing data (origin, dates, people etc.)
        itinerary: result.itinerary, // Add the generated itinerary
        policyRequirements: result.policyRequirements, // Add generated policy steps
        generalPreparation: result.generalPreparation, // Add generated general prep items
        preDeparturePreparation: result.preDeparturePreparation, // Add generated pre-departure prep items
        destinationSlug: result.destinationSlug, // Add the destination slug for policy links
        // Ensure all other fields from TripData interface are present, even if undefined initially
        // Most should be covered by currentTripData or defaults applied by the backend
        origin: currentTripData.origin || '', // Ensure basic fields have fallbacks if somehow missing
        originCountry: currentTripData.originCountry || '',
        additionalCities: currentTripData.additionalCities || [],
        additionalCountries: currentTripData.additionalCountries || [],
        adults: currentTripData.adults ?? 1,
        children: currentTripData.children ?? 0,
        pets: currentTripData.pets ?? 0,
        petDetails: currentTripData.petDetails || [],
        budget: currentTripData.budget || 'Moderate',
        // Ensure accommodation in the store is restored/maintained as string[]
        accommodation: currentTripData.accommodation || (result.accommodation && typeof result.accommodation === 'string' ? [result.accommodation] : ['Hotel']),
        interests: currentTripData.interests || [],
        additionalInfo: currentTripData.additionalInfo || '',
        draftId: currentTripData.draftId,
      } as TripData; // Assert type as TripData
      
      setTripData(finalTripData);
      toast({ title: "Itinerary Ready!", description: "Your trip plan has been generated." });

    } catch (error: any) {
      console.error('[ChatPage] Error during chat itinerary generation:', error);
      setError(`Failed to generate itinerary: ${error.message}`);
      toast({ 
          title: "Generation Failed", 
          description: `Could not generate itinerary. ${error.message}`,
          variant: "destructive" 
      });
    } finally {
       // Backend now handles setting isLoading to false? Assuming not for now.
       setIsLoading(false);
    }
  }, [setIsLoading, setError, setTripData, toast]); // Dependencies seem correct

  /**
   * Sends a system message to the chat builder API to inform it of updates made via modals.
   * @param {string} updateMessage - The message detailing the update.
   */
  const sendSystemUpdateToChat = useCallback(async (updateMessage: string) => {
    // Note: We might need the current threadId here if the API requires it
    // For now, assume the API can handle context without threadId for system updates, or manages it implicitly
    console.log(`[ChatPage] Attempting to send system update via ChatBuilder ref: ${updateMessage}`);
    if (chatBuilderRef.current) {
      chatBuilderRef.current.sendSystemMessage(updateMessage);
    } else {
      console.warn('[ChatPage] ChatBuilder ref is not available to send system update.');
      // Fallback or error handling if needed, though ideally the ref should be set
      // For now, let's try the old direct API call as a temporary measure IF NEEDED,
      // but the goal is to remove this.
      // try {
      //   const response = await fetch('/api/chat-builder', { // Ensure this points to the correct unified endpoint
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       messageContent: updateMessage,
      //       isSystemMessage: true, // Add a flag if API needs to differentiate
      //       // threadId: currentThreadId, // Pass threadId if available and necessary
      //       // currentTripData: useTripStore.getState().tripData // Send full data if API needs it to re-sync
      //     }),
      //   });
      //   if (!response.ok) {
      //       const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response'}));
      //       console.error('[ChatPage] Fallback: Failed to send system update to chat API:', errorData.error || response.statusText);
      //   }
      // } catch (error: any) {
      //     console.error('[ChatPage] Fallback: Error sending system update to chat API:', error);
      // }
    }
  }, []); // Dependencies might be needed if using threadId or currentTripData from here

  /**
   * Handles updating the trip data in the Zustand store AND informs the backend.
   * Closes all modals and shows a success toast.
   * @param {Partial<TripData>} updates - The partial trip data object with the fields to update.
   */
  const handleUpdateTripData = useCallback(async (updates: Partial<TripData>) => {
    const currentTripData = useTripStore.getState().tripData;
    const updatedData = { ...(currentTripData || {}), ...updates };
    console.log('[ChatPage] Updating trip data with:', updates);
    
    // 1. Update the Zustand store (frontend state)
    setTripData(updatedData);

    // 2. Construct and send the system update message to the backend AI
    const updateKeys = Object.keys(updates) as Array<keyof TripData>;
    const updateDetails = updateKeys
        .map(key => `${key} changed to '${updates[key]}'`) // Simple string representation
        .join(', ');
    if (updateDetails) {
        const systemMessage = `SYSTEM_UPDATE: ${updateDetails}`; 
        // Use await to ensure the notification is sent before closing modals etc.
        await sendSystemUpdateToChat(systemMessage); 
    }

    // 3. Close modals and show toast
    setIsWhereModalOpen(false);
    setIsWhenModalOpen(false);
    setIsTravelersModalOpen(false);
    setIsBudgetModalOpen(false);
    toast({ title: "Trip Updated", description: "Your changes have been applied." });
  // Include sendSystemUpdateToChat in dependencies
  }, [setTripData, toast, sendSystemUpdateToChat]);

  /**
   * NEW: Handles selecting an example trip from the MarketingSidebar.
   * Updates the store and notifies the backend chat builder.
   * @param {Partial<TripData>} sampleTripData - The data for the selected example trip.
   */
  const handleSelectExampleTrip = useCallback(async (sampleTripData: Partial<TripData>) => {
    console.log('[ChatPage] Example trip selected:', sampleTripData);
    // 1. Clear any existing error state
    setError(null);
    // 2. Set loading state true WHILE processing the example trip update
    setIsLoading(true); 
    // 3. Create a more complete TripData object for the store, applying defaults 
    //    similar to how the generation endpoint might (or use a helper function later)
    const completeSampleData: TripData = {
      origin: sampleTripData.origin || '', // Use defaults or empty strings
      originCountry: sampleTripData.originCountry || '',
      destination: sampleTripData.destination || '',
      destinationCountry: sampleTripData.destinationCountry || '',
      startDate: sampleTripData.startDate || '',
      endDate: sampleTripData.endDate || '',
      adults: sampleTripData.adults ?? 1,
      children: sampleTripData.children ?? 0,
      pets: sampleTripData.pets ?? 0,
      // Ensure petDetails is an array, default if pets > 0 and no details provided
      petDetails: sampleTripData.pets && sampleTripData.pets > 0 && (!sampleTripData.petDetails || sampleTripData.petDetails.length === 0)
          ? [{ type: 'Dog', size: 'Medium' }] // Default pet detail
          : (sampleTripData.petDetails || []),
      budget: sampleTripData.budget || 'Moderate',
      accommodation: sampleTripData.accommodation ? (Array.isArray(sampleTripData.accommodation) ? sampleTripData.accommodation : [sampleTripData.accommodation]) : ['Hotel'],
      interests: sampleTripData.interests || [],
      // Use a clear flag in additionalInfo to indicate source
      additionalInfo: sampleTripData.additionalInfo || 'SYSTEM_FLAG: Example trip loaded.', 
      additionalCities: sampleTripData.additionalCities || [],
      additionalCountries: sampleTripData.additionalCountries || [],
      // Clear any existing itinerary/prep steps from the old trip
      itinerary: undefined, 
      policyRequirements: undefined,
      generalPreparation: undefined,
      preDeparturePreparation: undefined,
      destinationSlug: undefined,
      draftId: undefined // Clear draftId as this is a new starting point
    };

    // 4. Update the Zustand store
    setTripData(completeSampleData);

    // 6. Clear loading state AFTER processing is done
    setIsLoading(false);

    // 7. Show confirmation toast
    toast({ title: "Example Trip Loaded!", description: "Feel free to customize the details or ask Baggo to generate the plan." });

  // Update dependencies (remove sendSystemUpdateToChat if no longer used directly here)
  }, [setTripData, setError, setIsLoading, toast]); // Removed sendSystemUpdateToChat from deps

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-50 font-sans">
      {/* TopBar is always visible */}
      <TopBar 
        className="flex-shrink-0" 
        // Pass modal open handlers to TopBar
        onWhereClick={handleOpenWhereModal}
        onWhenClick={handleOpenWhenModal}
        onTravelersClick={handleOpenTravelersModal}
        onBudgetClick={handleOpenBudgetModal}
        // Add handlers for other buttons as needed
        // onNewChatClick={() => { /* TODO: Implement new chat logic */ }}
        // onInviteClick={() => setIsInviteModalOpen(true)}
        // onCreateTripClick={() => { /* TODO: Navigate or open form modal */ }}
      />

      {/* Main Content Area - Revised Two-Pane Layout */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Left Pane: ChatBuilder (Always Visible) */}
        {/* Use max-width for more predictable sizing, h-full on md+ */}
        <div className="w-full md:max-w-xs lg:max-w-sm xl:max-w-md h-1/2 md:h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 flex-shrink-0 bg-white md:border-r md:border-gray-200">
          <ChatBuilder
              ref={chatBuilderRef} 
              session={session}
              className="h-full"
              onActualItineraryGenerationRequested={handleInitiateGeneration} 
          />
        </div>

        {/* Right Pane: Switches between Loading/MarketingSidebar and ItineraryView */}
        <div className="flex-grow h-1/2 md:h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
          {isStoreLoading && !showItinerary ? (
            // Global loading state for initial itinerary generation, shown in the content area
            <div className="flex items-center justify-center h-full p-4">
                <p className="text-gray-600 animate-pulse text-center">
                    Generating your perfect trip...
                    <br />
                    <span className="text-sm">(This can take up to a minute)</span>
                </p>
            </div>
          ) : showItinerary ? (
            // If itinerary exists, show ItineraryView
            <ItineraryView session={session} />
          ) : (
            // Otherwise (no itinerary yet, not loading), show MarketingSidebar
            // MarketingSidebar has its own internal hidden md:block for responsiveness
            <MarketingSidebar 
              className="h-full" 
              onSelectExampleTrip={handleSelectExampleTrip}
            />
          )}
        </div>
      </div>

      {/* --- Modals --- */}
      {/* Where Modal */}
      <Dialog open={isWhereModalOpen} onOpenChange={setIsWhereModalOpen}>
        <DialogContent className="bg-white rounded-2xl shadow-lg p-6 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Destination</DialogTitle>
            <DialogDescription className="text-sm text-gray-700 mb-4">
              Enter your desired destination city or region.
            </DialogDescription>
          </DialogHeader>
          {/* Input takes full width, label removed */}
          <div className="grid gap-4 py-4">
            <CityAutocomplete
                inputId="destination-autocomplete"
                value={tempDestination}
                onChange={(newValue) => {
                    setTempDestination(newValue);
                    if (!newValue) {
                         setTempDestinationCountry(''); 
                    }
                }}
                onCountryChange={(country, fullPlaceName) => {
                    setTempDestinationCountry(country);
                    const cityName = fullPlaceName ? fullPlaceName.split(',')[0].trim() : '';
                    setTempDestination(cityName);
                }} 
                placeholder="Type a city or region..."
                className="w-full rounded-full py-2 px-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500" // Full width and styled like an input
            />
          </div>
          {/* Buttons swapped: Save on left, Cancel on right */}
          <DialogFooter className="flex justify-end space-x-2 mt-6">
            <Button
              onClick={() => {
                  if (!tempDestination || !tempDestinationCountry) {
                      toast({
                          title: "Missing Information",
                          description: "Please select a valid destination.",
                          variant: "destructive",
                      });
                      return;
                  }
                  handleUpdateTripData({ destination: tempDestination, destinationCountry: tempDestinationCountry })
              }}
              disabled={!tempDestination || !tempDestinationCountry}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </Button>
            <DialogClose asChild>
              <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* When Modal */}
      <Dialog open={isWhenModalOpen} onOpenChange={setIsWhenModalOpen}>
        <DialogContent className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Dates</DialogTitle>
             <DialogDescription className="text-sm text-gray-700 mb-4">
               Select your travel start and end dates.
             </DialogDescription>
           </DialogHeader>
           <div className="flex justify-center py-4">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={tempDateRange?.from}
                    selected={tempDateRange}
                    onSelect={setTempDateRange}
                    numberOfMonths={2}
                    fixedWeeks
                    showOutsideDays={false}
                    pagedNavigation
                    className="rounded-md border border-gray-200 p-3"
                    classNames={{
                      months: "flex flex-col sm:flex-row gap-8",
                      month: "w-full space-y-4",
                      nav: "flex items-center justify-between relative w-full",
                      nav_button_previous: "absolute left-1 p-1 rounded-full hover:bg-gray-100",
                      nav_button_next: "absolute right-1 p-1 rounded-full hover:bg-gray-100",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      day: " h-9 w-9 p-0 font-normal group size-9 px-0 py-px text-sm relative flex items-center justify-center whitespace-nowrap rounded-xl text-foreground group-[[data-selected]:not(.range-middle)]:[transition-property:color,background-color,border-radius,box-shadow] group-[[data-selected]:not(.range-middle)]:duration-150 group-data-disabled:pointer-events-none focus-visible:z-10 hover:not-in-data-selected:bg-accent group-data-selected:bg-primary hover:not-in-data-selected:text-foreground group-data-selected:text-primary-foreground group-data-disabled:text-foreground/30 group-data-disabled:line-through group-data-outside:text-foreground/30 group-data-selected:group-data-outside:text-primary-foreground outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] group-[.range-start:not(.range-end)]:rounded-e-none group-[.range-end:not(.range-start)]:rounded-s-none group-[.range-middle]:rounded-none group-[.range-middle]:group-data-selected:bg-accent group-[.range-middle]:group-data-selected:text-foreground",
                    }}
                />
           </div>
           <DialogFooter className="flex justify-end space-x-2 mt-6">
             <DialogClose asChild>
                <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium">Cancel</Button>
             </DialogClose>
             <Button 
                onClick={() => {
                    const startDate = tempDateRange?.from ? format(tempDateRange.from, 'yyyy-MM-dd') : undefined;
                    const endDate = tempDateRange?.to ? format(tempDateRange.to, 'yyyy-MM-dd') : startDate;
                    if (startDate && endDate) {
                        handleUpdateTripData({ startDate, endDate });
                    } else {
                        toast({ title: "Invalid Dates", description: "Please select a valid start and end date.", variant: "destructive"});
                    }
                }}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full font-medium"
             >
                Save
            </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Travelers Modal with Counter UI */}
      <Dialog open={isTravelersModalOpen} onOpenChange={setIsTravelersModalOpen}>
        <DialogContent className="bg-white rounded-2xl shadow-lg p-6 max-w-lg">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Travelers</DialogTitle>
             <DialogDescription className="text-sm text-gray-700 mb-4">
               Specify the number of adults, children (under 18), and pets traveling.
             </DialogDescription>
           </DialogHeader>
           <div className="grid gap-6 py-4">
             {/* Adults Counter */}
             <div className="grid grid-cols-3 items-center gap-4">
               <Label className="text-sm font-medium text-gray-700 col-span-1">
                 Adults
               </Label>
               <div className="col-span-2 flex items-center justify-between rounded-full border border-gray-300 p-1">
                 <button 
                   type="button"
                   aria-label="Decrease adults"
                   onClick={() => setTempAdults(Math.max(1, tempAdults - 1))}
                   className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                   disabled={tempAdults <= 1}
                 >
                   <span className="text-xl font-medium">-</span>
                 </button>
                 <span className="text-base font-medium text-gray-700">{tempAdults}</span>
                 <button 
                   type="button"
                   aria-label="Increase adults"
                   onClick={() => setTempAdults(tempAdults + 1)}
                   className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                 >
                   <span className="text-xl font-medium">+</span>
                 </button>
               </div>
             </div>
             
             {/* Children Counter */}
             <div className="grid grid-cols-3 items-center gap-4">
               <Label className="text-sm font-medium text-gray-700 col-span-1">
                 Children
               </Label>
               <div className="col-span-2 flex items-center justify-between rounded-full border border-gray-300 p-1">
                 <button 
                   type="button"
                   aria-label="Decrease children"
                   onClick={() => setTempChildren(Math.max(0, tempChildren - 1))}
                   className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                   disabled={tempChildren <= 0}
                 >
                   <span className="text-xl font-medium">-</span>
                 </button>
                 <span className="text-base font-medium text-gray-700">{tempChildren}</span>
                 <button 
                   type="button"
                   aria-label="Increase children"
                   onClick={() => setTempChildren(tempChildren + 1)}
                   className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                 >
                   <span className="text-xl font-medium">+</span>
                 </button>
               </div>
             </div>
             
             {/* Pets Counter */}
             <div className="grid grid-cols-3 items-center gap-4">
               <Label className="text-sm font-medium text-gray-700 col-span-1">
                 Pets
               </Label>
               <div className="col-span-2 flex items-center justify-between rounded-full border border-gray-300 p-1">
                 <button 
                   type="button"
                   aria-label="Decrease pets"
                   onClick={() => setTempPets(Math.max(0, tempPets - 1))}
                   className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                   disabled={tempPets <= 0}
                 >
                   <span className="text-xl font-medium">-</span>
                 </button>
                 <span className="text-base font-medium text-gray-700">{tempPets}</span>
                 <button 
                   type="button"
                   aria-label="Increase pets"
                   onClick={() => setTempPets(tempPets + 1)}
                   className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                 >
                   <span className="text-xl font-medium">+</span>
                 </button>
               </div>
             </div>
           </div>
           <DialogFooter className="flex justify-end space-x-2 mt-6">
             <DialogClose asChild>
                <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium">Cancel</Button>
             </DialogClose>
             <Button 
                onClick={() => handleUpdateTripData({ adults: tempAdults, children: tempChildren, pets: tempPets })}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full font-medium"
             >
                Save
            </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>
      
      {/* Budget Modal */}
      <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
         <DialogContent className="bg-white rounded-2xl shadow-lg p-6 max-w-lg">
           <DialogHeader>
             <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Budget</DialogTitle>
             <DialogDescription className="text-sm text-gray-700 mb-4">
               Select your preferred budget level for this trip.
             </DialogDescription>
           </DialogHeader>
           <RadioGroup 
             value={tempBudget} 
             onValueChange={setTempBudget}
             className="grid gap-4 py-4"
             aria-label="Budget Level"
            >
            {budgetOptions.map((option) => (
                <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem 
                        value={option} 
                        id={`budget-${option.toLowerCase().replace('-', '')}`}
                        aria-labelledby={`label-budget-${option.toLowerCase().replace('-', '')}`} 
                    />
                    <Label 
                        htmlFor={`budget-${option.toLowerCase().replace('-', '')}`} 
                        id={`label-budget-${option.toLowerCase().replace('-', '')}`} 
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                        {option}
                    </Label>
                </div>
            ))}
           </RadioGroup>
           <DialogFooter className="flex justify-end space-x-2 mt-6">
             <DialogClose asChild>
                <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium">Cancel</Button>
             </DialogClose>
             <Button 
                onClick={() => handleUpdateTripData({ budget: tempBudget })}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-full font-medium"
            >
                Save
            </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Add Toaster component - Ensure it's rendered, typically in the root layout */}
      {/* <Toaster /> */}
    </div>
  );
}
