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

  useEffect(() => {
    // Simulate fetching session data
    setSession({ user: { id: 'mock-user-id' } });
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

    try {
      // *** POINT TO THE NEW FLEXIBLE ENDPOINT ***
      const response = await fetch('/api/ai/chat-generate-itinerary', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the current tripData; backend will handle defaults for missing optional fields
        body: JSON.stringify(currentTripData), 
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
        accommodation: currentTripData.accommodation || 'Hotel',
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
    console.log(`[ChatPage] Sending system update to chat API: ${updateMessage}`);
    try {
      const response = await fetch('/api/chat-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageContent: updateMessage, 
          // threadId: currentThreadId, // Pass threadId if available and necessary
          // currentTripData: useTripStore.getState().tripData // Send full data if API needs it to re-sync
        }),
      });
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response'})); // Catch potential JSON parse error
          console.error('[ChatPage] Failed to send system update to chat API:', errorData.error || response.statusText);
          // Optionally show a non-critical toast here?
      }
      // We don't necessarily need to process the response here, 
      // as the main goal is just to inform the backend.
    } catch (error: any) {
        console.error('[ChatPage] Error sending system update to chat API:', error);
    }
  }, []); // Dependencies might be needed if using threadId or currentTripData

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

      {/* Main Content Area */}
      <div className="flex-grow flex overflow-hidden">
        {/* UPDATED: Conditional Rendering Logic based on itinerary generation status */}
        {showItinerary ? (
            // If itinerary exists, show ItineraryView taking full available width
            <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                <ItineraryView session={session} />
                {/* TODO: Consider adding a collapsible Chatbot component here later */}
            </div>
        ) : (
            // Otherwise (no itinerary yet), show the two-column layout 
            // with ChatBuilder/Loading on left and MarketingSidebar on right
            <>
                {/* Left Column: Switches between Loading State and ChatBuilder */}
                <div className="w-full md:w-1/2 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
                    {isStoreLoading ? (
                        // If loading (generation in progress), show loading message
                        <div className="flex items-center justify-center h-full p-4">
                            <p className="text-gray-600 animate-pulse text-center">
                                Generating your perfect trip...
                                <br />
                                <span className="text-sm">(This can take up to a minute)</span>
                            </p>
                        </div>
                    ) : (
                        // Otherwise (not loading, no itinerary), show ChatBuilder
                        <ChatBuilder
                            session={session}
                            className="h-full"
                            onInitiateItineraryGeneration={handleInitiateGeneration}
                        />
                    )}
                </div>

                {/* Right Column: Marketing Sidebar (only shown before itinerary generation) */}
                <div className="hidden md:block md:w-1/2 h-full border-l border-gray-200">
                    <MarketingSidebar className="h-full" />
                </div>
            </>
        )}
      </div>

      {/* --- Modals --- */}
      {/* Where Modal */}
      <Dialog open={isWhereModalOpen} onOpenChange={setIsWhereModalOpen}>
        {/* Apply OriginUI styling: bg-white, rounded-lg, shadow-lg, p-6, max-w-lg */}
        <DialogContent className="bg-white rounded-lg shadow-lg p-6 max-w-lg">
          <DialogHeader>
            {/* Use OriginUI fonts/colors: text-2xl font-bold text-black mb-2 tracking-tight */}
            <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Destination</DialogTitle>
            {/* Use OriginUI fonts/colors: text-sm text-gray-700 mb-4 */}
            <DialogDescription className="text-sm text-gray-700 mb-4">
              Enter your desired destination city/region and country.
            </DialogDescription>
          </DialogHeader>
          {/* Form content area with spacing */}
          <div className="grid gap-4 py-4">
            {/* Destination Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              {/* Use OriginUI label style: text-sm font-medium text-gray-700 */}
              <Label htmlFor="destination" className="text-right text-sm font-medium text-gray-700">
                Destination
              </Label>
              {/* Use OriginUI input style: col-span-3, p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 */}
              {/* <Input
                id="destination"
                aria-label="Destination City or Region"
                value={tempDestination}
                onChange={(e) => setTempDestination(e.target.value)}
                className="col-span-3 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., Paris, San Diego, Banff National Park"
              /> */}
              {/* --- Replace Input with CityAutocomplete --- */}
              <CityAutocomplete
                  inputId="destination-autocomplete"
                  value={tempDestination}
                  onChange={(newValue) => {
                      // When user types manually, just update the display value
                      setTempDestination(newValue);
                      // Clear country only if user clears the input, 
                      // otherwise wait for onCountryChange to confirm.
                      if (!newValue) {
                           setTempDestinationCountry(''); 
                      }
                  }}
                  onCountryChange={(country, fullPlaceName) => {
                      setTempDestinationCountry(country);
                      // Extract city name from the full place name provided on selection
                      const cityName = fullPlaceName ? fullPlaceName.split(',')[0].trim() : ''; // Use empty string if parsing fails
                      setTempDestination(cityName); // Set the display value to just the city
                  }} 
                  placeholder="Type a city or region..."
                  className="col-span-3" // Apply grid column span
              />
            </div>
            {/* Destination Country Input (Readonly or Hidden if Autocomplete works well) */}
            {/* We'll keep it visible but readonly for now to confirm country extraction */}
            <div className="grid grid-cols-4 items-center gap-4">
              {/* Use OriginUI label style */}
              <Label htmlFor="destinationCountry" className="text-right text-sm font-medium text-gray-700">
                Country
              </Label>
              {/* Use OriginUI input style */}
              <Input
                id="destinationCountry"
                aria-label="Destination Country"
                value={tempDestinationCountry}
                onChange={(e) => setTempDestinationCountry(e.target.value)}
                className="col-span-3 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g., France, USA, Canada"
              />
            </div>
          </div>
          {/* Use OriginUI footer style: flex justify-end space-x-2 mt-6 */}
          <DialogFooter className="flex justify-end space-x-2 mt-6">
            {/* Use OriginUI secondary button style: bg-mustard-500 hover:bg-mustard-600 text-white px-4 py-2 rounded-lg font-medium */}
            <DialogClose asChild>
              <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium">Cancel</Button>
            </DialogClose>
            {/* Use OriginUI primary button style: bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium */}
            <Button
              onClick={() => {
                  // ** Add Validation **
                  if (!tempDestination || !tempDestinationCountry) {
                      toast({
                          title: "Missing Information",
                          description: "Please select a destination and ensure the country is detected.",
                          variant: "destructive",
                      });
                      return;
                  }
                  handleUpdateTripData({ destination: tempDestination, destinationCountry: tempDestinationCountry })
              }}
              // ** Disable button if validation fails **
              disabled={!tempDestination || !tempDestinationCountry}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* When Modal */}
      <Dialog open={isWhenModalOpen} onOpenChange={setIsWhenModalOpen}>
        {/* Apply OriginUI styling */} 
        <DialogContent className="bg-white rounded-lg shadow-lg p-6 max-w-lg">
           <DialogHeader>
             {/* Use OriginUI fonts/colors */} 
             <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Dates</DialogTitle>
             {/* Use OriginUI fonts/colors */} 
             <DialogDescription className="text-sm text-gray-700 mb-4">
               Select your travel start and end dates.
             </DialogDescription>
           </DialogHeader>
           {/* Calendar component for date range selection */}
           <div className="flex justify-center py-4">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={tempDateRange?.from}
                    selected={tempDateRange}
                    onSelect={setTempDateRange}
                    numberOfMonths={1} // Show one month at a time
                    showOutsideDays={false}
                    className="rounded-md border border-gray-200 p-3" // Add some basic styling
                    // Ensure Calendar uses appropriate aria labels internally
                />
           </div>
           {/* Use OriginUI footer style */} 
           <DialogFooter className="flex justify-end space-x-2 mt-6">
             {/* Use OriginUI secondary button style */} 
             <DialogClose asChild>
                <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium">Cancel</Button>
             </DialogClose>
             {/* Use OriginUI primary button style */} 
             <Button 
                onClick={() => {
                    const startDate = tempDateRange?.from ? format(tempDateRange.from, 'yyyy-MM-dd') : undefined;
                    // If only one date is selected, 'to' might be undefined. Handle this.
                    const endDate = tempDateRange?.to ? format(tempDateRange.to, 'yyyy-MM-dd') : startDate; // Default to startDate if 'to' is not set
                    if (startDate && endDate) {
                        handleUpdateTripData({ startDate, endDate });
                    } else {
                        // Handle case where no dates are selected or only 'from' is selected without 'to'
                        // Maybe show a toast? For now, just don't update.
                        console.warn("[ChatPage] Cannot save dates: Invalid date range selected.", tempDateRange);
                        toast({ title: "Invalid Dates", description: "Please select a valid start and end date.", variant: "destructive"});
                    }
                }}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium"
             >
                Save
            </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Travelers Modal */}
      <Dialog open={isTravelersModalOpen} onOpenChange={setIsTravelersModalOpen}>
        {/* Apply OriginUI styling */} 
        <DialogContent className="bg-white rounded-lg shadow-lg p-6 max-w-lg">
           <DialogHeader>
             {/* Use OriginUI fonts/colors */} 
             <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Travelers</DialogTitle>
             {/* Use OriginUI fonts/colors */} 
             <DialogDescription className="text-sm text-gray-700 mb-4">
               Specify the number of adults, children (under 18), and pets traveling.
             </DialogDescription>
           </DialogHeader>
           {/* Form content area with spacing */} 
           <div className="grid gap-6 py-4"> {/* Increased gap for better spacing */} 
             {/* Adults Input */}
             <div className="grid grid-cols-3 items-center gap-4">
               {/* Use OriginUI label style */} 
               <Label htmlFor="adults" className="text-sm font-medium text-gray-700 col-span-1">
                 Adults
               </Label>
               {/* Use OriginUI input style for number */} 
               <Input
                 id="adults"
                 type="number"
                 min="1" // At least one adult
                 aria-label="Number of adults"
                 value={tempAdults}
                 onChange={(e) => setTempAdults(parseInt(e.target.value, 10) || 1)} // Parse and ensure at least 1
                 className="col-span-2 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
             </div>
             {/* Children Input */}
             <div className="grid grid-cols-3 items-center gap-4">
               {/* Use OriginUI label style */} 
               <Label htmlFor="children" className="text-sm font-medium text-gray-700 col-span-1">
                 Children
               </Label>
               {/* Use OriginUI input style */} 
               <Input
                 id="children"
                 type="number"
                 min="0"
                 aria-label="Number of children"
                 value={tempChildren}
                 onChange={(e) => setTempChildren(parseInt(e.target.value, 10) || 0)} // Parse and default to 0
                 className="col-span-2 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
             </div>
             {/* Pets Input */}
             <div className="grid grid-cols-3 items-center gap-4">
               {/* Use OriginUI label style */} 
               <Label htmlFor="pets" className="text-sm font-medium text-gray-700 col-span-1">
                 Pets
               </Label>
               {/* Use OriginUI input style */} 
               <Input
                 id="pets"
                 type="number"
                 min="0"
                 aria-label="Number of pets"
                 value={tempPets}
                 onChange={(e) => setTempPets(parseInt(e.target.value, 10) || 0)} // Parse and default to 0
                 className="col-span-2 w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
             </div>
           </div>
           {/* Use OriginUI footer style */} 
           <DialogFooter className="flex justify-end space-x-2 mt-6">
             {/* Use OriginUI secondary button style */} 
             <DialogClose asChild>
                <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium">Cancel</Button>
             </DialogClose>
             {/* Use OriginUI primary button style */} 
             <Button 
                onClick={() => handleUpdateTripData({ adults: tempAdults, children: tempChildren, pets: tempPets })}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium"
             >
                Save
            </Button>
           </DialogFooter>
         </DialogContent>
      </Dialog>
      
      {/* Budget Modal */}
      <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
         {/* Apply OriginUI styling */} 
         <DialogContent className="bg-white rounded-lg shadow-lg p-6 max-w-lg">
           <DialogHeader>
             {/* Use OriginUI fonts/colors */} 
             <DialogTitle className="text-2xl font-bold text-black mb-2 tracking-tight">Edit Budget</DialogTitle>
             {/* Use OriginUI fonts/colors */} 
             <DialogDescription className="text-sm text-gray-700 mb-4">
               Select your preferred budget level for this trip.
             </DialogDescription>
           </DialogHeader>
           {/* RadioGroup for budget selection */}
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
           {/* Use OriginUI footer style */} 
           <DialogFooter className="flex justify-end space-x-2 mt-6">
             {/* Use OriginUI secondary button style */} 
             <DialogClose asChild>
                <Button variant="outline" className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium">Cancel</Button>
             </DialogClose>
             {/* Use OriginUI primary button style */} 
             <Button 
                onClick={() => handleUpdateTripData({ budget: tempBudget })}
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium"
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
