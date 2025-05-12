import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TripData } from '@/store/tripStore'; // Keep TripData type
import { createClient } from '@/lib/supabase-server';

// Vercel: Increase max duration for Assistants API polling
export const maxDuration = 180; // Allow 3 minutes (adjust as needed)

// Ensure your OpenAI API key is set in environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- NEW: Google Places API Configuration ---
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// --- NEW: Define Place interface for Google Places API results ---
interface Place {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  vicinity?: string; // Often used instead of formatted_address for nearby searches
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{ photo_reference: string; height: number; width: number; html_attributions: string[] }>;
  opening_hours?: { open_now: boolean };
  // Add other fields as needed from Google Places API
}

// --- NEW: Helper function to check potential pet-friendliness ---
/**
 * Determines if a place might be pet-friendly based on keywords in name or types.
 * This is a simple heuristic and not guaranteed.
 * @param place - The Google Place object.
 * @returns boolean indicating potential pet-friendliness.
 */
function isPotentiallyPetFriendly(place: Place): boolean {
  const nameLower = place.name?.toLowerCase() || '';
  const typesLower = place.types?.map(t => t.toLowerCase()) || [];

  const keywords = ['pet friendly', 'dog friendly', 'pets allowed', 'patio', 'outdoor seating', 'park', 'hike', 'trail', 'dog park', 'beach access'];
  const antiKeywords = ['no pets', 'service animals only', 'no dogs'];

  if (antiKeywords.some(keyword => nameLower.includes(keyword))) {
    return false;
  }
  if (keywords.some(keyword => nameLower.includes(keyword))) {
    return true;
  }
  if (typesLower.includes('park') || typesLower.includes('dog_park')) {
    return true;
  }
  // Default to false if no strong indicators. For some types like 'restaurant',
  // explicit mention of "pet friendly" in the query is better.
  return false;
}

// --- NEW: Helper function to search Google Places API ---
/**
 * Searches the Google Places API (Text Search).
 * @param query The search query string.
 * @param type Optional place type (e.g., 'restaurant', 'park').
 * @param location Optional location bias (lat,lng string).
 * @param radius Optional radius for location bias (meters).
 * @returns A promise that resolves to an array of Place objects or an empty array on error.
 */
async function searchGooglePlaces(
  query: string,
  type?: string,
  location?: string, // e.g., "lat,lng"
  radius?: number
): Promise<Place[]> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("[API Chat Builder] Google Places API Key is not configured.");
    return []; // Return empty if key is missing
  }

  let url = `${PLACES_API_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
  if (type) {
    url += `&type=${type}`;
  }
  if (location && radius) {
    url += `&location=${location}&radius=${radius}`;
  }
  // Request specific fields to minimize data transfer and cost
  // Basic fields are typically included by default with Text Search.
  // Consider 'photos', 'opening_hours' for more detail if needed later,
  // but they might push towards needing Place Details API.
  // url += `&fields=place_id,name,formatted_address,vicinity,geometry,types,rating,user_ratings_total,photos,opening_hours`;


  console.log(`[API Chat Builder] Querying Google Places: ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')) {
      console.warn(`[API Chat Builder] Google Places API error for query "${query}": ${data.status} - ${data.error_message || data.status || response.statusText}`);
      return [];
    }
    console.log(`[API Chat Builder] Google Places API success for query "${query}". Found ${data.results?.length || 0} results.`);
    return data.results || [];
  } catch (error: any) {
    console.error(`[API Chat Builder] Network error fetching places for query "${query}":`, error.message);
    return [];
  }
}

// --- NEW: Define the Assistant ID for the Conversational Builder ---
const CONVERSATIONAL_ASSISTANT_ID = 'asst_Yr12Gk8JxB8c1KxNRP1Y9zzR';

// Define expected request structure (minor change: threadId is key)
interface ChatBuilderRequestBody {
  messageContent: string;
  threadId?: string; // Thread ID is central to Assistants API
  currentTripData: TripData | null; // Receive current state from frontend store
}

// Define the response structure expected by ChatBuilder.tsx (remains the same)
interface BuilderApiResponse {
    reply: string | null;
    updatedTripData?: Partial<TripData>;
    triggerItineraryGeneration?: boolean;
    actions?: any[]; // Keep for potential future use
    threadId?: string; // Important to pass back
}

// --- Helper Functions ---
/**
 * Tries to parse potentially fuzzy date descriptions into YYYY-MM-DD format.
 * Handles YYYY-MM-DD, common month names, relative terms like "tomorrow", "next week", "next month".
 * @param dateString The user's date description.
 * @returns A string in YYYY-MM-DD format, or the original string if parsing fails comprehensively.
 */
function parseDate(dateString: string): string {
   const cleanString = dateString.trim().toLowerCase();
   const now = new Date();
   // Prevent parsing things like "a week" or "5 days" without context
   if (cleanString.match(/^(\d+|a) (day|week|month)s?$/)) {
       console.log(`[API Chat Builder] Refusing to parse duration-like string without context: ${cleanString}`);
       return dateString; // Return original descriptive string for durations
   }

   console.log(`[API Chat Builder] Attempting to parse date: ${cleanString}`);

   // Helper to format Date object to YYYY-MM-DD
   const formatDate = (date: Date): string => date.toISOString().split('T')[0];

   // 1. Check for YYYY-MM-DD format
   const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
   if (yyyyMmDdRegex.test(cleanString)) {
       console.log(`[API Chat Builder] Parsed as YYYY-MM-DD: ${cleanString}`);
       return cleanString;
   }

   // 2. Handle relative terms
   let targetDate = new Date(); // Use mutable date for relative calculations
   let parsedRelative = false;

   if (cleanString === "tomorrow") {
       targetDate.setDate(now.getDate() + 1);
       parsedRelative = true;
   } else if (cleanString === "today") {
       parsedRelative = true; // Use today's date
   } else if (cleanString.includes("next week")) {
       targetDate.setDate(now.getDate() + 7); // Simplistic: exactly 7 days from now
       // TODO: More complex: adjust to start of next week (e.g., next Monday)
       parsedRelative = true;
   } else if (cleanString.includes("next month")) {
       targetDate.setMonth(now.getMonth() + 1);
       targetDate.setDate(1); // Default to the 1st of next month
       parsedRelative = true;
   } else if (cleanString.includes("in a week") || cleanString.includes("a week from now")) {
        targetDate.setDate(now.getDate() + 7);
        parsedRelative = true;
   } // Add more relative terms: "weekend", specific days "next friday" etc.

   if (parsedRelative) {
       const formatted = formatDate(targetDate);
       console.log(`[API Chat Builder] Parsed relative term "${cleanString}" to ${formatted}`);
       return formatted;
   }

   // 3. Attempt basic Date constructor parsing (handles many simple formats like "August 15, 2024")
   try {
      const date = new Date(dateString); // Use original string for Date constructor
      if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
          const formattedDate = formatDate(date);
          console.log(`[API Chat Builder] Parsed via Date constructor to YYYY-MM-DD: ${formattedDate}`);
          return formattedDate;
      }
   } catch (e) {
      // Ignore errors, try next method
   }

   // 4. Check for Month names (case-insensitive) - Less reliable, might need year context
   // const months: { [key: string]: string } = {
   //     january: '01', feb: '02', february: '02', mar: '03', march: '03', apr: '04', april: '04', may: '05',
   //     jun: '06', june: '06', jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09',
   //     oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12'
   // };
   // ... (Logic for parsing month names, potentially ambiguous without year/day)

   // 5. Fallback: Return the original non-duration-like string if no robust parsing worked
   console.log(`[API Chat Builder] Could not robustly parse date "${cleanString}" to YYYY-MM-DD, returning original.`);
   return dateString;
}

// --- NEW: Add parseTimeToMinutes utility (adapted from tripStore.ts) ---
/**
 * Parses a time string (e.g., "9:00 AM", "14:30", "5pm") into minutes past midnight.
 * Returns a large number if the time is invalid or missing, placing them at the end.
 * @param timeString The time string to parse.
 * @returns Minutes past midnight or a large number (for sorting).
 */
const parseTimeToMinutes = (timeString?: string): number => {
  if (!timeString) {
    return 9999; // Place activities without time at the end
  }
  const cleanedTime = timeString.toLowerCase().replace(/\s+/g, '');
  let hours = 0;
  let minutes = 0;

  let match = cleanedTime.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const period = match[3];
    if (period === 'pm' && hours < 12) {
      hours += 12;
    }
    if (period === 'am' && hours === 12) { // Midnight case
      hours = 0;
    }
  } else {
    match = cleanedTime.match(/^(\d{1,2})(am|pm)?$/);
    if (match) {
      hours = parseInt(match[1], 10);
      const period = match[2];
      if (period === 'pm' && hours < 12) {
        hours += 12;
      }
      if (period === 'am' && hours === 12) {
        hours = 0;
      }
    } else {
        match = cleanedTime.match(/^(\d{2})(\d{2})$/);
        if(match && cleanedTime.length === 4) {
            hours = parseInt(match[1], 10);
            minutes = parseInt(match[2], 10);
        } else {
             console.warn(`[API Chat Builder - parseTimeToMinutes] Could not parse time: ${timeString}`);
             return 9999;
        }
    }
  }

  if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
    console.warn(`[API Chat Builder - parseTimeToMinutes] Invalid time after parsing: ${timeString} -> H:${hours} M:${minutes}`);
    return 9999;
  }
  return hours * 60 + minutes;
};

// --- Placeholder for external function calls (like Google Places) ---
async function findPointsOfInterestApiCall(query: string, location: string): Promise<any> {
  console.log(`[API Chat Builder] Finding points of interest for query: "${query}" in location: "${location}"`);

  const fullQuery = `${query} in ${location}`;
  const places: Place[] = await searchGooglePlaces(fullQuery);

  if (!places || places.length === 0) {
    console.log(`[API Chat Builder] No points of interest found for "${fullQuery}".`);
    return {
      status: "success", // Report success even if no results, to avoid breaking flow
      message: `No specific points of interest found for "${query}" in ${location}. You can try a broader search or different keywords.`,
      results: [],
    };
  }

  // Format results for the assistant
  const formattedResults = places.slice(0, 5).map(place => ({
    name: place.name,
    type: place.types ? place.types.join(', ') : 'point_of_interest',
    location: place.vicinity || place.formatted_address || location,
    // Potentially add more details like rating if needed by assistant later
    // rating: place.rating,
    // place_id: place.place_id // Useful for linking or fetching more details
  }));

  return {
    status: "success",
    message: `Found ${formattedResults.length} potential points of interest for "${query}" in ${location}.`,
    results: formattedResults,
  };
}

async function getTripDetailsApiCall(currentTrip: Partial<TripData> | null): Promise<Partial<TripData>> {
    console.log(`[API Chat Builder] TODO: Implement API call to get full trip details.`);
    // This would typically fetch from a database or session
    await new Promise(resolve => setTimeout(resolve, 100));
    // For testing, return a snapshot of currentTripData or a part of it.
    // Ensure the returned object conforms to Partial<TripData>
    return currentTrip ? { destination: currentTrip.destination, startDate: currentTrip.startDate } : {  }; 
}

async function findNearbyServiceApiCall(location: string, service_type: string): Promise<any> {
  console.log(`[API Chat Builder] Finding nearby service: ${service_type} near ${location}`);

  // Map assistant-friendly service_type to Google Places types if necessary
  // For example, assistant might say "vet", Google expects "veterinary_care"
  let googleServiceType = service_type.toLowerCase();
  if (googleServiceType === 'vet' || googleServiceType === 'veterinarian') {
    googleServiceType = 'veterinary_care';
  } else if (googleServiceType === 'groomer' || googleServiceType === 'pet grooming') {
    googleServiceType = 'pet_store'; // Often pet stores have grooming, or use a keyword search
  } else if (googleServiceType === 'pet supply' || googleServiceType === 'pet food') {
    googleServiceType = 'pet_store';
  }
  // Add more mappings as identified

  const searchQuery = `pet friendly ${service_type} in ${location}`;
  // Use the mapped googleServiceType if specific, otherwise let text search work more broadly
  const places: Place[] = await searchGooglePlaces(searchQuery, googleServiceType !== service_type ? googleServiceType : undefined);

  if (!places || places.length === 0) {
    console.log(`[API Chat Builder] No nearby service (${service_type}) found for "${searchQuery}".`);
    return {
      status: "success",
      message: `I couldn't find any ${service_type} services nearby in ${location}. You might need to search online directories for ${location}.`,
      results: [],
    };
  }

  const formattedResults = places.slice(0, 3).map(place => ({
    name: place.name || 'Unknown Service',
    address: place.vicinity || place.formatted_address || location,
    type: service_type, // Return the original requested service type for clarity to assistant
    // opening_hours: place.opening_hours?.open_now,
    // phone_number: place.formatted_phone_number, // Would require Place Details API
    // website: place.website, // Would require Place Details API
    // place_id: place.place_id
  }));

  return {
    status: "success",
    message: `I found a few ${service_type} options near ${location}:`,
    results: formattedResults,
  };
}

async function saveTripProgressApiCall(tripDataToSave: Partial<TripData>): Promise<any> {
    console.log(`[API Chat Builder] TODO: Implement API call to save trip progress:`, tripDataToSave);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    return { status: "success", message: "Trip progress saved (simulated)." };
}

async function checkTravelRegulationsApiCall(destination_country: string, origin_country?: string, pet_type?: string): Promise<any> {
    console.log(`[API Chat Builder] TODO: Implement API call for check_travel_regulations for ${destination_country}, from ${origin_country}, pet: ${pet_type}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
    // Example, in a real scenario, fetch from a DB or scrape official sources
    return {
        status: "success",
        summary: `Key regulations for ${destination_country}: Ensure microchip, rabies vaccination, and health certificate. Official sources must be checked. (Simulated response)`,
        country_slug: destination_country.toLowerCase().replace(/\s+/g, '-'), // Example slug
        // details_url: `https://example.com/pets/${destination_country.toLowerCase()}` // Optional
    };
}

// --- REVISED: addActivityToDayApiCall ---
async function addActivityToDayApiCall(
  day_number: number,
  activityInput: any, // AI provided activity data
  currentFullItinerary?: TripData['itinerary'] // Pass the full current itinerary
): Promise<any> {
  console.log(`[API Chat Builder] Adding activity: ${activityInput.name} to day ${day_number}`);

  if (!currentFullItinerary || !currentFullItinerary.days) {
    console.error("[API Chat Builder] Cannot add activity: Current itinerary is missing or invalid.");
    return {
      status: "error",
      message: "Failed to add activity: Itinerary data is missing.",
    };
  }

  // 1. Construct the new Activity object from AI input
  //    Map fields and add defaults. Fetch place details if place_id is provided.
  let newActivity: any = {
    name: activityInput.name || "Unnamed Activity",
    description: activityInput.description || "User added activity.",
    petFriendly: activityInput.pet_friendly_status === 'yes' || activityInput.petFriendly === true || false, // Default to false if not specified clearly
    location: activityInput.location || "Location TBD",
    coordinates: activityInput.coordinates || { lat: 0, lng: 0 }, // Placeholder
    startTime: activityInput.start_time || activityInput.startTime, // Handle both snake_case and camelCase from AI
    endTime: activityInput.end_time || activityInput.endTime,
    cost: activityInput.cost || "Not specified",
    type: activityInput.type || 'activity',
    place_id: activityInput.place_id,
    pet_friendliness_details: activityInput.pet_friendliness_details,
    estimated_duration: activityInput.estimated_duration,
    // Fields to potentially enrich if place_id is present
    website: activityInput.website,
    phone_number: activityInput.phone_number,
    opening_hours: activityInput.opening_hours,
    photo_references: activityInput.photo_references,
    rating: activityInput.rating,
    user_ratings_total: activityInput.user_ratings_total,
  };

  // If a place_id is provided by the AI, attempt to fetch more details
  // This part is complex and would ideally use a robust Place Details fetching function
  // For now, we'll assume the AI provides enough details or we use what's given.
  // TODO: Implement Place Details fetching here if place_id is present and more data is needed
  // For example:
  // if (newActivity.place_id && !newActivity.website) {
  //   const placeDetails = await fetchGooglePlaceDetails(newActivity.place_id);
  //   if (placeDetails) { 
  //     newActivity.name = placeDetails.name || newActivity.name;
  //     newActivity.location = placeDetails.formatted_address || newActivity.location;
  //     newActivity.coordinates = placeDetails.geometry?.location || newActivity.coordinates;
  //     newActivity.website = placeDetails.website;
  //     newActivity.phone_number = placeDetails.formatted_phone_number;
  //     // ... and so on for other fields like opening_hours, photos, rating
  //   }
  // }

  // 2. Deep clone the itinerary to avoid mutating the original object directly
  const updatedItinerary = JSON.parse(JSON.stringify(currentFullItinerary));

  // 3. Find the target day
  const dayIndex = updatedItinerary.days.findIndex((d: any) => d.day === day_number);

  if (dayIndex === -1) {
    // If day doesn't exist, we could opt to create it, or return an error.
    // For now, let's assume the AI refers to existing days from a generated itinerary.
    console.error(`[API Chat Builder] Day ${day_number} not found in itinerary.`);
    return {
      status: "error",
      message: `Failed to add activity: Day ${day_number} not found in your itinerary.`,
    };
  }

  // 4. Add the new activity to the day's activities list
  if (!updatedItinerary.days[dayIndex].activities) {
    updatedItinerary.days[dayIndex].activities = [];
  }
  updatedItinerary.days[dayIndex].activities.push(newActivity);

  // 5. Sort activities for that day by startTime
  updatedItinerary.days[dayIndex].activities.sort((a: any, b: any) => {
    const timeA = parseTimeToMinutes(a.startTime);
    const timeB = parseTimeToMinutes(b.startTime);
    return timeA - timeB;
  });
  
  // 6. (Optional but recommended) Re-generate itinerarySummary for AI context if needed
  // This would involve iterating over updatedItinerary.days and creating the summary structure
  // For now, we can skip this if the AI primarily relies on the full itinerary passed in CONTEXT_UPDATE.
  // Or, we can generate a new summary to send back in this response.
  const updatedItinerarySummary = updatedItinerary.days.map((day: any) => ({
    day: day.day,
    date: day.date,
    city: day.city,
    activityCount: day.activities.length,
    keyActivities: day.activities.slice(0, 3).map((act: any) => ({ // Take first 3 as key activities
      name: act.name,
      type: act.type,
      location: act.location,
    })),
  }));

  console.log(`[API Chat Builder] Activity '${newActivity.name}' added to Day ${day_number}. Itinerary updated.`);

  return {
    status: "success",
    message: `Activity '${newActivity.name}' has been added to Day ${day_number} of your itinerary.`,
    updatedItinerary: updatedItinerary, // Return the full updated itinerary
    updatedItinerarySummary: updatedItinerarySummary // Also return the updated summary
  };
}
// --- END REVISED ---

async function suggestPlacesOfInterestApiCall(location: string, interests?: string[], activity_type?: string, day_number?: number): Promise<any> {
  console.log(`[API Chat Builder] Suggesting places of interest. Location: ${location}, Interests: ${interests?.join(', ')}, Type: ${activity_type}, Day: ${day_number}`);

  let searchQuery = activity_type ? `pet friendly ${activity_type}` : 'pet friendly attractions';
  if (interests && interests.length > 0) {
    searchQuery += ` related to ${interests.join(' or ')}`;
  }
  searchQuery += ` in ${location}`;

  // Use a broader type for general interest searches if activity_type is not specific
  const placeType = activity_type || 'point_of_interest';

  const places: Place[] = await searchGooglePlaces(searchQuery, placeType);

  if (!places || places.length === 0) {
    console.log(`[API Chat Builder] No places of interest found for "${searchQuery}".`);
    return {
      status: "success",
      message: `Couldn't find specific places for your request in ${location}. Perhaps try different interests or activity types?`,
      results: [],
    };
  }

  const formattedResults = places.slice(0, 5).map(place => ({
    name: place.name || 'Unknown Place',
    type: place.types ? place.types.join(', ') : (activity_type || 'general'),
    petFriendlyGuess: isPotentiallyPetFriendly(place), // Use the helper
    location: place.vicinity || place.formatted_address || location,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
    // place_id: place.place_id, // Could be useful for follow-up actions
    // opening_hours: place.opening_hours?.open_now // Simple open_now status
  }));

  return {
    status: "success",
    message: `Here are some suggestions for ${activity_type || 'places'}${interests ? ' related to ' + interests.join(', ') : ''} in ${location}:`,
    results: formattedResults,
    };
}

/**
 * API Route Handler for Conversational Trip Building (POST) - Using Assistants API
 * Handles user messages, manages Assistant threads/runs, executes tool calls, and returns responses.
 * @param {NextRequest} req - The incoming request object.
 * @returns {Promise<NextResponse>} The response object containing the assistant's reply and updated trip data.
 */
export async function POST(req: NextRequest) {
  let responseData: BuilderApiResponse = { reply: null };
  let updatedDataAccumulator: Partial<TripData> = {};
  let currentThreadId: string | null | undefined; // Declare with let

  try {
    // --- Supabase User & Preference Loading ---
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    let loadedDbPreferences: any[] = [];

    if (userId) {
        console.log('[API Chat Builder] User logged in:', userId);
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles') // <<< CONFIRM YOUR TABLE NAME HERE
            .select('learned_preferences')
            .eq('id', userId)     // <<< CONFIRM YOUR USER ID COLUMN NAME HERE
            .single();

        if (profileError && profileError.code !== 'PGRST116') { // Ignore error if row not found
            console.error('[API Chat Builder] Error loading user profile preferences:', profileError.message);
            // Decide how to handle: proceed without DB prefs, or return error?
            // For now, we'll proceed, relying on session data.
        } else if (profileData?.learned_preferences) {
            // Validate that it's an array before assigning
            if(Array.isArray(profileData.learned_preferences)) {
                loadedDbPreferences = profileData.learned_preferences;
                console.log(`[API Chat Builder] Loaded ${loadedDbPreferences.length} preferences from DB for user: ${userId}`);
            } else {
                console.warn('[API Chat Builder] learned_preferences from DB is not an array for user:', userId);
            }
        } else {
            console.log('[API Chat Builder] No existing preferences found in DB for user:', userId);
        }
    } else {
        console.log('[API Chat Builder] No user logged in.');
    }
    // --- End Supabase Loading ---

    // Extract data from request body
    const { messageContent = '', threadId, currentTripData, initialRequest } = await req.json();
    currentThreadId = threadId; // Assign the value

    console.log(`[API Chat Builder] Received request: threadId=${currentThreadId}, initialRequest=${initialRequest}, messageContent=${messageContent ? messageContent.substring(0, 50) + '...' : '(empty)'}`);

    let trip = currentTripData || {}; // Use empty object if null

    // --- Merge Preferences & Initialize Accumulator ---
    const sessionPreferences = currentTripData?.learnedPreferences || [];
    // Define type for preference object for clarity
    type LearnedPreference = { type: string; detail: string; item_reference?: string };
    // Combine DB and session preferences, removing duplicates based on type and detail
    const combinedPreferences: LearnedPreference[] = [...loadedDbPreferences]; // Explicitly type combinedPreferences
    sessionPreferences.forEach((p_session: LearnedPreference) => { // Explicitly type p_session
        if (!combinedPreferences.some(p_db => p_db.type === p_session.type && p_db.detail === p_session.detail)) {
            combinedPreferences.push(p_session);
        }
    });

    // Initialize the accumulator with these combined preferences
    if (combinedPreferences.length > 0) {
        updatedDataAccumulator.learnedPreferences = [...combinedPreferences]; // Use spread for new array
    }
    // Also update the local 'trip' variable to hold the combined state for tool handlers
    if (!trip.learnedPreferences) trip.learnedPreferences = [];
    trip.learnedPreferences = [...combinedPreferences]; // Use spread for new array
    console.log(`[API Chat Builder] Initialized with ${trip.learnedPreferences?.length ?? 0} combined learned preferences.`);
    // --- End Merge & Init ---

    // --- Intercept System Update Messages (Keep this logic) ---
    // This handles updates from the frontend (like example trip selection)
    if (messageContent.startsWith('SYSTEM_UPDATE:')) {
      console.log('[API Chat Builder] Received System Update:', messageContent);
      const updateString = messageContent.replace('SYSTEM_UPDATE:', '').trim();
      if (updateString.includes('Example trip selected:')) {
        const destinationMatch = updateString.match(/Example trip selected: ([^\(]+)/);
        const destination = destinationMatch ? destinationMatch[1].trim() : 'your selected destination';
        // System prompt now instructs Assistant on how to handle this context
        const confirmationReply = `Okay, I've loaded the example trip details for **${destination}**. You can see the specifics reflected above. Looks good, or want to change anything (like dates or interests)? If you're ready, just say **'generate itinerary'**!`;
        return NextResponse.json({ reply: confirmationReply });
      } else {
        // Handle other system updates if needed, or just acknowledge
        console.log('[API Chat Builder] Acknowledging non-example system update.');
        // Maybe add this non-example update as context? For now, just return success.
         // Potentially add a context message to the thread if needed?
         // e.g., `User updated ${key} to ${value} via UI modal.`
      return NextResponse.json({}); 
      }
    }
    // --- End System Update Handling --- 

    // --- Assistants API Flow ---

    // 1. Thread Management
    if (currentThreadId) {
        console.log(`[API Chat Builder] Using existing thread: ${currentThreadId}`);
        // Optional: Verify thread exists openai.beta.threads.retrieve(currentThreadId);
    } else {
        console.log('[API Chat Builder] Creating new thread...');
        const thread = await openai.beta.threads.create();
        currentThreadId = thread.id;
        console.log(`[API Chat Builder] New thread created: ${currentThreadId}`);
    }
    responseData.threadId = currentThreadId; // Ensure thread ID is passed back

    // 2. Add Messages (Context FIRST, then User)
    // Construct and add the CONTEXT UPDATE message
    if (currentTripData) {
        const contextForAssistant: Partial<TripData> & { itinerarySummary?: any[], sourceFlag?: string } = {
            // Core TripData fields for context
            destination: currentTripData.destination,
            destinationCountry: currentTripData.destinationCountry,
            startDate: currentTripData.startDate,
            endDate: currentTripData.endDate,
            adults: currentTripData.adults,
            children: currentTripData.children,
            pets: currentTripData.pets,
            budget: currentTripData.budget,
            accommodation: currentTripData.accommodation, // Should be array as per TripData
            interests: currentTripData.interests,       // Should be array as per TripData
            // Include petDetails if available and relevant
            petDetails: currentTripData.petDetails,
            // NEW: Include learnedPreferences if available
            learnedPreferences: currentTripData.learnedPreferences,
            // Other fields like origin, notes, etc., can be added if deemed useful for the Assistant
        };

        // Conditionally include itinerarySummary
        if (currentTripData.itinerarySummary && currentTripData.itinerarySummary.length > 0) {
            contextForAssistant.itinerarySummary = currentTripData.itinerarySummary;
            console.log('[API Chat Builder] itinerarySummary included in CONTEXT UPDATE.');
        } else {
            console.log('[API Chat Builder] No itinerarySummary to include in CONTEXT UPDATE.');
        }
        
        // Flag for example trip - useful for the assistant's "Example Trip Handling" instruction
        if (currentTripData.additionalInfo === 'SYSTEM_FLAG: Example trip loaded.') {
            contextForAssistant.sourceFlag = 'example_trip_loaded';
        }

        const systemContextMessageContent = `CONTEXT UPDATE: ${JSON.stringify(contextForAssistant)}`;
        
        await openai.beta.threads.messages.create(currentThreadId, {
            role: "user", // Per OpenAI recommendation, context can be sent as user role
            content: systemContextMessageContent,
        });
        console.log('[API Chat Builder] CONTEXT UPDATE message added to thread.');
    } else {
        console.log('[API Chat Builder] No currentTripData provided; skipping CONTEXT UPDATE.');
    }

    // Add the actual user message AFTER the context update, ONLY if it's not empty
    if (messageContent) { // Check if messageContent is truthy (non-empty string)
        await openai.beta.threads.messages.create(currentThreadId, {
          role: "user",
          content: messageContent,
        });
        console.log('[API Chat Builder] User message added to thread after context.');
    } else {
        console.log('[API Chat Builder] No user message content provided; skipping user message creation.');
    }

    // 3. Create and Run (Always create the run, even if no user message was added,
    // as the assistant might respond based on context or just provide a greeting)
    console.log(`[API Chat Builder] Creating run for thread ${currentThreadId} with assistant ${CONVERSATIONAL_ASSISTANT_ID}`);
    let run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: CONVERSATIONAL_ASSISTANT_ID,
      // Instructions are primarily set on the Assistant itself
      // We could add additional_instructions here if needed per-run
    });
    console.log(`[API Chat Builder] Run created: ${run.id}, Status: ${run.status}`);

    // 4. Polling Loop
    const terminalStates = ["completed", "failed", "cancelled", "expired"]; // "requires_action" is handled IN the loop
    const pollingIntervalMs = 1000;
    const maxWaitTimeMs = maxDuration * 1000 - 5000; // Max duration minus buffer
    let elapsedTimeMs = 0;
    let lastLoggedStatus = run.status;

    // Main loop that handles polling and tool calls
    while (!terminalStates.includes(run.status) && elapsedTimeMs < maxWaitTimeMs) {
    if (run.status === "requires_action") {
      const requiredActions = run.required_action?.submit_tool_outputs.tool_calls;
            if (!requiredActions || requiredActions.length === 0) {
                console.error("[API Chat Builder] Run requires action, but no tool calls were provided. Breaking loop.");
                run.status = "failed"; // Force a failed state
                run.last_error = { code: "server_error", message: "Run entered 'requires_action' but no tool_calls were present." };
                break; 
      }

      console.log(`[API Chat Builder] Run requires action. Tool calls: ${requiredActions.length}`);
      const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];

      // Process tool calls (can be parallelized if needed)
      for (const call of requiredActions) {
          const functionName = call.function.name;
                let output: any = null; // Ensure output is initialized for each call
          let args: any = {};
          try {
             args = JSON.parse(call.function.arguments || '{}');
             console.log(`[API Chat Builder] Executing tool: ${functionName}`, args);

                    // --- Existing switch case for tool calls ---
          switch (functionName) {
            case "set_destination":
              if (args.destination) updatedDataAccumulator.destination = args.destination;
              if (args.destinationCountry) updatedDataAccumulator.destinationCountry = args.destinationCountry;
                    output = { status: "success", message: `Destination set to ${args.destination}, ${args.destinationCountry}` };
              break;
            case "set_travel_dates":
              if (args.startDate) updatedDataAccumulator.startDate = parseDate(args.startDate);
              if (args.endDate) updatedDataAccumulator.endDate = parseDate(args.endDate);
                              output = { status: "success", message: `Dates set: ${updatedDataAccumulator.startDate} to ${updatedDataAccumulator.endDate}` };
              break;
            case "set_travelers":
              if (args.adults !== undefined) updatedDataAccumulator.adults = args.adults;
              updatedDataAccumulator.children = args.children !== undefined ? args.children : 0;
              if (args.pets !== undefined) updatedDataAccumulator.pets = args.pets;
                    output = { status: "success", message: `Travelers set: ${updatedDataAccumulator.adults ?? trip?.adults ?? '?'} adults, ${updatedDataAccumulator.children} children, ${updatedDataAccumulator.pets ?? trip?.pets ?? '?'} pets` };
              break;
            case "set_preferences":
              if (args.budget) updatedDataAccumulator.budget = args.budget;
                    if (args.accommodation !== undefined) {
                                  updatedDataAccumulator.accommodation = Array.isArray(args.accommodation) ? args.accommodation : (typeof args.accommodation === 'string' && args.accommodation.trim() !== '' ? [args.accommodation] : []);
                    }
                    if (args.interests !== undefined) {
                                   updatedDataAccumulator.interests = Array.isArray(args.interests) ? args.interests : (typeof args.interests === 'string' && args.interests.trim() !== '' ? [args.interests] : []);
                    }
                    output = { status: "success", message: "Preferences updated." };
                    break;
                          // NEW Case for Learned Preferences
                          case "update_learned_preferences":
                            const { preference_type, detail, item_reference } = args;
                            if (preference_type && detail) {
                              const newPreference = { type: preference_type, detail, ...(item_reference && { item_reference }) };
                              // Ensure learnedPreferences array exists and append, avoiding exact duplicates
                              if (!updatedDataAccumulator.learnedPreferences) {
                                  // Initialize based on current trip state or empty array
                                  updatedDataAccumulator.learnedPreferences = trip?.learnedPreferences ? [...trip.learnedPreferences] : [];
                              }
                              // Check if this exact preference detail already exists for the type
                              const exists = updatedDataAccumulator.learnedPreferences.some(
                                (p) => p.type === preference_type && p.detail === detail
                              );
                              if (!exists) {
                                updatedDataAccumulator.learnedPreferences.push(newPreference);
                                console.log('[API Chat Builder] Recorded learned preference:', newPreference);

                                // --- BEGIN SUPABASE SAVE ---
                                if (userId) {
                                    const { error: upsertError } = await supabase
                                        .from('user_profiles') // <<< CONFIRM YOUR TABLE NAME HERE
                                        .update({ learned_preferences: updatedDataAccumulator.learnedPreferences })
                                        .eq('id', userId); // <<< CONFIRM YOUR USER ID COLUMN NAME HERE

                                    if (upsertError) {
                                        console.error('[API Chat Builder] Error saving learned preferences to DB:', upsertError.message);
                                        // Output reflects local success but persistent failure
                                        output = { status: "partial_success", message: `Preference (${preference_type}) recorded locally, but failed to save persistently.` };
                                    } else {
                                        console.log('[API Chat Builder] Successfully saved learned preferences to DB for user:', userId);
                                        // Keep original success message if DB save works
                                        output = { status: "success", message: `Learned preference (${preference_type}) recorded.` };
                                    }
                                } else {
                                    // No user logged in, keep original success message (saved to session only)
                                    output = { status: "success", message: `Learned preference (${preference_type}) recorded (session only).` };
                                }
                                // --- END SUPABASE SAVE ---

                              } else {
                                output = { status: "success", message: `Preference (${preference_type}: ${detail}) already recorded.` };
                                console.log('[API Chat Builder] Duplicate learned preference ignored:', newPreference);
                              }
                            } else {
                              output = { status: "error", message: "Missing required arguments (preference_type, detail) for update_learned_preferences." };
                            }
                            break;
                          case "suggest_places_of_interest":
                              // ... (rest of the cases, ensure they are complete as per previous versions)
                              if (!args.location) {
                                  const locationContext = updatedDataAccumulator.destination || trip?.destination;
                                  if (locationContext) {
                                      args.location = locationContext;
                                  } else {
                                      output = { status: "error", message: "Cannot suggest places without a location context." };
                                      break;
                                  }
                              }
                              output = await suggestPlacesOfInterestApiCall(args.location, args.interests, args.activity_type, args.day_number);
                              break;
                          case "get_trip_details":
                              output = { status: "success", details: await getTripDetailsApiCall(trip), message: "Current trip details retrieved." };
                    break;
                          case "find_nearby_service":
                              if (!args.location) {
                                   const locationContext = updatedDataAccumulator.destination || trip?.destination;
                                   if (locationContext) {
                                      args.location = locationContext;
                        } else {
                                      output = { status: "error", message: "Cannot find nearby services without a location context." };
                                      break;
                                  }
                              }
                              output = await findNearbyServiceApiCall(args.location, args.service_type);
                              break;
                          case "save_trip_progress":
                              const combinedTripStateForSave = { ...trip, ...updatedDataAccumulator };
                              output = await saveTripProgressApiCall(combinedTripStateForSave);
                              break;
                          case "check_travel_regulations":
                              output = await checkTravelRegulationsApiCall(args.destination_country, args.origin_country, args.pet_type);
                              break;
                          case "add_activity_to_day":
                              // REVISED: Pass the full itinerary object
                              const currentFullItineraryForAdd = updatedDataAccumulator.itinerary || trip?.itinerary;
                              const addActivityResult = await addActivityToDayApiCall(args.day_number, args.activity, currentFullItineraryForAdd);
                              output = addActivityResult;
                              if (addActivityResult.updatedItinerary) {
                                  updatedDataAccumulator.itinerary = addActivityResult.updatedItinerary; // Store the full updated itinerary
                              }
                              // Also update summary if it was returned and is used by AI/frontend separately
                              if (addActivityResult.updatedItinerarySummary) {
                                  updatedDataAccumulator.itinerarySummary = addActivityResult.updatedItinerarySummary;
              }
              break;
            case "generate_itinerary":
              const finalTripStateForGenCheck = { ...trip, ...updatedDataAccumulator };
                    if (finalTripStateForGenCheck.destination && finalTripStateForGenCheck.destinationCountry && finalTripStateForGenCheck.startDate && finalTripStateForGenCheck.endDate) {
                  responseData.triggerItineraryGeneration = true;
                        output = { status: "success", message: "Essential information collected. Itinerary generation process initiated by the frontend." };
              } else {
                        output = { status: "error", message: "Cannot generate itinerary yet. Please provide destination, country, start date, and end date first." };
                        responseData.triggerItineraryGeneration = false;
              }
              break;
            default:
              console.warn(`[API Chat Builder] Unhandled tool call: ${functionName}`);
                  output = { status: "error", message: `Unknown function: ${functionName}` };
          }
          } catch (toolError: any) {
              console.error(`[API Chat Builder] Error processing tool ${functionName} (args: ${call.function.arguments}):`, toolError);
              output = { status: "error", message: `Failed to execute ${functionName}. Error: ${toolError.message}` };
          }

          toolOutputs.push({
            tool_call_id: call.id,
                  output: JSON.stringify(output), 
          });
            } // End for loop for tool calls

      if (toolOutputs.length > 0) {
          console.log('[API Chat Builder] Submitting tool outputs...');
          try {
               run = await openai.beta.threads.runs.submitToolOutputs(currentThreadId, run.id, {
                  tool_outputs: toolOutputs,
              });
              console.log(`[API Chat Builder] Tool outputs submitted. New Run Status: ${run.status}`);
                    lastLoggedStatus = run.status; // Update lastLoggedStatus immediately
                    // Loop will continue, and next iteration will poll or handle new status.
                } catch (submitError: any) {
                    console.error(`[API Chat Builder] Error submitting tool outputs for run ${run.id}:`, submitError);
                    run.status = "failed"; 
                    run.last_error = { code: "server_error", message: `Failed to submit tool outputs: ${submitError.message}` };
                    break; // Exit loop on submission error
                }
            } else {
                // This case should ideally not be reached if requiredActions was populated and tools were processed.
                console.warn("[API Chat Builder] No tool outputs generated despite 'requires_action'. This might indicate an issue. Continuing poll.");
                // To prevent potential infinite loops if the state doesn't change, force a poll delay.
                await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
                elapsedTimeMs += pollingIntervalMs;
            }
        } // End if (run.status === "requires_action")

        // Standard polling logic if not 'requires_action' or after tools submitted and status is not yet terminal
        if (!terminalStates.includes(run.status) && run.status !== "requires_action") { // Don't poll if we just handled requires_action and it might become terminal
                  await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
                  elapsedTimeMs += pollingIntervalMs;
            try {
                  run = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
            } catch (retrieveError: any) {
                console.error(`[API Chat Builder] Error retrieving run status for run ${run.id}:`, retrieveError);
                run.status = "failed"; 
                run.last_error = { code: "server_error", message: `Failed to retrieve run status: ${retrieveError.message}` };
                break; // Exit loop on retrieval error
            }

                  if (run.status !== lastLoggedStatus) {
                console.log(`[API Chat Builder] Run ${run.id} Status: ${run.status}`);
                     lastLoggedStatus = run.status;
            } else if (elapsedTimeMs % 10000 === 0) { // Log progress every 10s if status hasn't changed
                console.log(`[API Chat Builder] Run ${run.id} still '${run.status}'... (${elapsedTimeMs / 1000}s)`);
            }
        }
        // If run.status became 'requires_action' from polling, the next loop iteration will handle it.
        // If tools were submitted, and run.status is now e.g. 'queued' or 'in_progress', polling will continue.
    } // End while loop

     // Check for timeout or if loop exited due to an internal break (e.g. tool submission error)
              if (!terminalStates.includes(run.status)) {
        // If it's requires_action here, it means the loop timed out while in requires_action,
        // or an error occurred during its processing that didn't set it to 'failed'.
        // This case should ideally be caught by the 'failed' status set on errors within the loop.
        if (run.status === "requires_action") {
             console.error(`[API Chat Builder] Run ${run.id} timed out or errored while in 'requires_action' state.`);
             // Attempt to cancel, as it might be stuck
             try { await openai.beta.threads.runs.cancel(currentThreadId, run.id); } catch (cancelError) { console.error("Error cancelling run:", cancelError); }
             responseData.reply = 'Sorry, the assistant got stuck processing a required step. Please try again.';
             return NextResponse.json(responseData, { status: 500 });
        } else { // General timeout for other non-terminal states
            console.error(`[API Chat Builder] Run polling timed out after ${elapsedTimeMs / 1000}s for run ${run.id}. Status: ${run.status}`);
            try { await openai.beta.threads.runs.cancel(currentThreadId, run.id); } catch (cancelError) { console.error("Error cancelling run:", cancelError); }
            responseData.reply = 'Sorry, the request took too long to process. Please try again.';
            return NextResponse.json(responseData, { status: 504 }); // Gateway Timeout
        }
    }

    // 6. Handle Final Run Status
    if (run.status === "completed") {
        console.log(`[API Chat Builder] Run ${run.id} completed. Fetching messages...`);
        const messages = await openai.beta.threads.messages.list(currentThreadId, { order: 'desc', limit: 1 });
        const assistantMessage = messages.data.find(m => m.role === 'assistant');

        if (assistantMessage && assistantMessage.content.length > 0) {
            const firstContent = assistantMessage.content[0];
            if (firstContent?.type === 'text') {
                responseData.reply = firstContent.text.value;
                console.log('[API Chat Builder] Extracted final reply text.');
                 // Add accumulated updates ONLY if generation wasn't triggered in this step
                 // Merge base trip data with updates for the response
                 if (Object.keys(updatedDataAccumulator).length > 0 && !responseData.triggerItineraryGeneration) {
                    responseData.updatedTripData = updatedDataAccumulator; // Send only the delta
                 }
            } else {
                 responseData.reply = "Received a non-text response from the assistant."; // More informative
                 console.warn("[API Chat Builder] Assistant message content was not text:", firstContent);
            }
        } else {
            // This can happen if the *only* action was triggering generation
            if (responseData.triggerItineraryGeneration) {
                responseData.reply = "Okay, I have all the details needed. The itinerary generation will start now.";
            } else {
                console.warn('[API Chat Builder] Run completed but no assistant message content found.');
                responseData.reply = "Processing complete, but no further message generated."; // More specific default
            }
        }
    } else {
       // Handle ALL non-completed final states (failed, cancelled, expired, etc.)
       console.error(`[API Chat Builder] Run ${run.id} did not complete successfully. Final status: ${run.status}`);
       let userFriendlyError = "Sorry, I encountered an issue processing your request.";
       if (run.last_error) {
           console.error(`[API Chat Builder] Run ${run.id} failed detail: ${run.last_error.code} - ${run.last_error.message}`);
           userFriendlyError = `Processing failed (${run.last_error.code}). Please try again.`;
       } else {
            userFriendlyError = `Processing did not complete (Status: ${run.status}). Please try again.`;
      }
       responseData.reply = userFriendlyError;
       // Still return accumulated data if any, might be useful for debug/retry
    if (Object.keys(updatedDataAccumulator).length > 0) {
      responseData.updatedTripData = updatedDataAccumulator;
       }
       return NextResponse.json(responseData, { status: run.status === 'failed' ? 500 : 503 }); // Use appropriate error code
    }

    // 7. Construct Success Response
    console.log('[API Chat Builder] Final Response Data:', responseData);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[API Chat Builder] Unhandled Error in POST handler:', error);
    // Ensure responseData has threadId if available
    if (currentThreadId) responseData.threadId = currentThreadId;
    responseData.reply = `Sorry, a critical server error occurred: ${error.message || 'Unknown error'}`;
    return NextResponse.json(responseData, { status: 500 });
  }
}
