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
 * Helper to format a Date object to YYYY-MM-DD string.
 * @param date The Date object to format.
 * @returns A string in YYYY-MM-DD format.
 */
const formatDateToYYYYMMDD = (date: Date): string => date.toISOString().split('T')[0];

/**
 * Tries to parse potentially fuzzy date descriptions into YYYY-MM-DD format.
 * Handles YYYY-MM-DD, common month names, relative terms like "tomorrow", "next week", "next month".
 * Implements smart year assumption: if no year is provided, defaults to current year.
 * If that date in the current year has passed, it defaults to the next calendar year.
 * @param dateString The user's date description.
 * @returns A string in YYYY-MM-DD format, or the original string if parsing fails comprehensively.
 */
function parseDate(dateString: string): string {
   const cleanString = dateString.trim().toLowerCase();
   const now = new Date();
   now.setHours(0, 0, 0, 0); // Normalize 'now' to the beginning of today for comparisons

   // 0. Prevent parsing things like "a week" or "5 days" without context (likely durations)
   if (cleanString.match(/^(\d+|a) (day|week|month)s?$/)) {
       console.log(`[API Chat Builder - parseDate] Refusing to parse duration-like string: "${cleanString}"`);
       return dateString;
   }

   console.log(`[API Chat Builder - parseDate] Attempting to parse date: "${dateString}" (cleaned: "${cleanString}")`);

   // 1. Check for existing YYYY-MM-DD format
   const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
   console.log(`[Debug parseDate] Testing cleanString "${cleanString}" with yyyyMmDdRegex. Result: ${yyyyMmDdRegex.test(cleanString)}`); // DEBUG
   if (yyyyMmDdRegex.test(cleanString)) {
       try {
           console.log(`[Debug parseDate] yyyyMmDdRegex passed. Trying new Date with "${cleanString + 'T00:00:00Z'}"`); // DEBUG
           const d = new Date(cleanString + 'T00:00:00Z'); 
           const isDValid = !isNaN(d.getTime());
           const formattedD = isDValid ? formatDateToYYYYMMDD(d) : "INVALID_DATE_OBJECT";
           console.log(`[Debug parseDate] d.getTime() is valid: ${isDValid}. formatDateToYYYYMMDD(d) is: "${formattedD}". cleanString is: "${cleanString}"`); // DEBUG
           if (isDValid && formattedD === cleanString) { 
                console.log(`[API Chat Builder - parseDate] Input is already valid YYYY-MM-DD: "${cleanString}"`);
                return cleanString;
           } else {
                console.log(`[Debug parseDate] Condition (isDValid && formattedD === cleanString) FAILED. isDValid=${isDValid}, formattedD="${formattedD}", cleanString="${cleanString}"`); // DEBUG
           }
       } catch (e: any) { 
           console.log(`[Debug parseDate] Error in YYYY-MM-DD direct parse block: ${e.message}`); // DEBUG
           /* ignore, will be handled by later parsing attempts */ 
       }
   }

   // 2. Handle specific relative terms
   let targetDateRelative = new Date(now); // Use a mutable copy of 'now'
   let parsedRelative = false;

   if (cleanString === "tomorrow") {
       targetDateRelative.setDate(now.getDate() + 1);
       parsedRelative = true;
   } else if (cleanString === "today") {
       // targetDateRelative is already 'now'
       parsedRelative = true;
   } else if (cleanString.includes("next monday")) {
       targetDateRelative.setDate(now.getDate() + ( (1 + 7 - now.getDay()) % 7 || 7) );
       parsedRelative = true;
   } else if (cleanString.includes("next tuesday")) {
       targetDateRelative.setDate(now.getDate() + ( (2 + 7 - now.getDay()) % 7 || 7) );
       parsedRelative = true;
   } else if (cleanString.includes("next wednesday")) {
       targetDateRelative.setDate(now.getDate() + ( (3 + 7 - now.getDay()) % 7 || 7) );
       parsedRelative = true;
   } else if (cleanString.includes("next thursday")) {
       targetDateRelative.setDate(now.getDate() + ( (4 + 7 - now.getDay()) % 7 || 7) );
       parsedRelative = true;
   } else if (cleanString.includes("next friday")) {
       targetDateRelative.setDate(now.getDate() + ( (5 + 7 - now.getDay()) % 7 || 7) );
       parsedRelative = true;
   } else if (cleanString.includes("next saturday")) {
       targetDateRelative.setDate(now.getDate() + ( (6 + 7 - now.getDay()) % 7 || 7) );
       parsedRelative = true;
   } else if (cleanString.includes("next sunday")) {
        targetDateRelative.setDate(now.getDate() + ( (7 - now.getDay()) % 7 || 7) ); // If today is Sunday, gets next Sunday
        parsedRelative = true;
   }
   // Add more relative terms as needed: "next week" could be ambiguous (start or just 7 days from now)

   if (parsedRelative) {
       const formatted = formatDateToYYYYMMDD(targetDateRelative);
       console.log(`[API Chat Builder - parseDate] Parsed relative term "${cleanString}" to: ${formatted}`);
       return formatted;
   }

   // 3. Attempt general Date constructor parsing and apply smart year logic
   try {
      // Use original casing for `new Date()` as it can be more lenient
      const d = new Date(dateString);
      
      if (!isNaN(d.getTime())) { // Check if it's a valid date object at all
        let year = d.getFullYear();
        const month = d.getMonth(); // 0-indexed
        const dayOfMonth = d.getDate();

        // Heuristic: Does the input string likely contain an explicit year?
        // Looks for 4 digits (19xx, 20xx) or 'YY or /YY patterns.
        const inputLikelyHasExplicitYear = /\b(19[7-9]\d|20\d{2})\b/.test(dateString) || /\b(['/])\d{2}\b/.test(dateString);
        
        const currentYear = now.getFullYear();

        if (!inputLikelyHasExplicitYear && year >= 1970) {
            // No explicit year in input, and JS parsed to a "modern" year (likely current year by default for "Month Day" strings)
            console.log(`[API Chat Builder - parseDate] Input "${dateString}" (parsed as ${year}-${month+1}-${dayOfMonth}) lacks explicit year. Applying smart year logic.`);
            
            let candidateDate = new Date(currentYear, month, dayOfMonth);
            candidateDate.setHours(0, 0, 0, 0);

            if (candidateDate < now) { 
                console.log(`[API Chat Builder - parseDate] Date ${formatDateToYYYYMMDD(candidateDate)} (current year) has passed. Assuming next year.`);
                year = currentYear + 1;
            } else {
                year = currentYear; // Stick with current year
            }
        } else if (inputLikelyHasExplicitYear && year < 1970 && dateString.match(/^\d{1,2}\s*([a-zA-Z]+)/)) {
             // Handles cases like "05 June" where new Date() might parse year as 1901, 1905 etc.
             // If input seems to have day and month but JS produced an old year, assume current/next year.
             console.log(`[API Chat Builder - parseDate] Input "${dateString}" (parsed as ${year}-${month+1}-${dayOfMonth}) had no obvious 4-digit year but JS gave old year. Applying smart year logic.`);
             let candidateDate = new Date(currentYear, month, dayOfMonth);
             candidateDate.setHours(0, 0, 0, 0);
             if (candidateDate < now) {
                 year = currentYear + 1;
             } else {
                 year = currentYear;
             }
        } else if (!inputLikelyHasExplicitYear && year < 1970) {
             // Input had no year, and JS defaulted to a very old year (e.g. new Date("June") might give 1900 or similar if not specific enough)
             // This case is too ambiguous to apply smart year logic, probably not a full date.
             console.log(`[API Chat Builder - parseDate] Input "${dateString}" parsed to very old year ${year} without explicit year in input. Returning original.`);
             return dateString;
        }
        // Else (inputLikelyHasExplicitYear and year >= 1970), use the year parsed by new Date().

        const finalDate = new Date(year, month, dayOfMonth);
        finalDate.setHours(0, 0, 0, 0); // Normalize before formatting

        if (!isNaN(finalDate.getTime())) { // Final check on the reconstructed date
            const formatted = formatDateToYYYYMMDD(finalDate);
            console.log(`[API Chat Builder - parseDate] Successfully parsed "${dateString}" to: ${formatted}`);
            return formatted;
        }
      }
   } catch (e) {
      // console.warn(`[API Chat Builder - parseDate] Date constructor error for "${dateString}":`, e);
   }

   // 4. Fallback: Return the original non-duration-like string if no robust parsing worked
   console.log(`[API Chat Builder - parseDate] Could not robustly parse date "${dateString}" to YYYY-MM-DD. Returning original.`);
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
// Removed findPointsOfInterestApiCall function

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

async function suggestPlacesOfInterestApiCall(
  location: string,
  currentTripData: Partial<TripData>, // Added currentTripData
  interests?: string[],
  activity_type?: string,
  day_number?: number
): Promise<any> {
  console.log(`[API Chat Builder] Suggesting places of interest. Location: ${location}, Interests: ${interests?.join(', ')}, Type: ${activity_type}, Day: ${day_number}`);

  let searchQuery = activity_type ? `pet friendly ${activity_type}` : 'pet friendly activities'; // Default query

  // Incorporate learnedPreferences
  const learnedPreferences = currentTripData.learnedPreferences || [];
  const preferenceDetails = learnedPreferences.map(p => p.detail).join(' ');
  if (preferenceDetails) {
    searchQuery = `${searchQuery} ${preferenceDetails}`; // Append preference details
  }

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
  const supabase = await createClient(); // Moved Supabase client initialization up

  try {
    // --- Supabase User & Preference Loading ---
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

        // Filter out null, undefined, empty strings, and empty arrays from contextForAssistant
        const optimizedContext: Record<string, any> = {};
        for (const key in contextForAssistant) {
            const value = (contextForAssistant as Record<string, any>)[key];
            if (value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0)) {
                optimizedContext[key] = value;
            }
        }

        // Conditionally include itinerarySummary if it has content (already handled by array check)
        // if (currentTripData.itinerarySummary && currentTripData.itinerarySummary.length > 0) {
        //     optimizedContext.itinerarySummary = currentTripData.itinerarySummary;
        // }

        if (currentTripData.additionalInfo === 'SYSTEM_FLAG: Example trip loaded.') {
            optimizedContext.sourceFlag = 'example_trip_loaded';
        }

        const systemContextMessageContent = `CONTEXT UPDATE: ${JSON.stringify(optimizedContext)}`;
        
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
    
    // MODIFICATION FOR STREAMING: Create a streaming run
    const runStream = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: CONVERSATIONAL_ASSISTANT_ID,
      stream: true,
    });
    console.log(`[API Chat Builder] Streaming run initiated.`);

    let finalReply = "";
    let runResult: OpenAI.Beta.Threads.Runs.Run | null = null;

    // Helper function for polling
    async function waitForRunCompletion(threadId: string, runId: string, maxAttempts = 60, pollIntervalMs = 1000): Promise<OpenAI.Beta.Threads.Runs.Run> {
      for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const run = await openai.beta.threads.runs.retrieve(threadId, runId);
        console.log(`[Polling] Run status: ${run.status}, attempt ${attempts + 1}`);
        switch (run.status) {
          case 'completed':
            return run;
          case 'requires_action':
            console.error(`[Polling] Run ${runId} entered 'requires_action' during completion polling. This may indicate a need for iterative tool calls if not handled by the main loop.`);
            // Returning the run here, the caller must decide how to proceed if it's still requires_action after polling for completion.
            // For the current design, this is an unexpected state if we were *only* waiting for final completion.
            // However, if the main loop is prepared to re-enter tool processing, this is fine.
            // Given the refined logic, we expect the main loop to break and re-poll or re-evaluate.
            // Let's make it an error if this specific polling function is called expecting a *terminal* state.
            throw new Error(`Run ${runId} requires further action unexpectedly during terminal polling phase.`);
          case 'failed':
            console.error('[Polling] Run failed:', run.last_error);
            throw new Error(`Run failed: ${run.last_error?.message || 'Unknown error'}`);
          case 'cancelled':
          case 'expired':
            throw new Error(`Run ${runId}`);
          case 'queued':
          case 'in_progress':
            // Continue polling
            break;
          default:
            throw new Error(`Unknown run status: ${run.status}`);
        }
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
      throw new Error('Run timed out after multiple polling attempts');
    }

    let streamedToolSubmission = false; // Flag to indicate if we've gone through tool submission

    for await (const event of runStream) {
      if (event.event === 'thread.message.delta' && event.data.delta.content) {
        const delta = event.data.delta.content[0];
        if (delta?.type === 'text' && delta.text) {
          finalReply += delta.text.value;
          // console.log(`[STREAM] Delta: ${delta.text.value}`); // Log delta if needed
        }
      } else if (event.event === 'thread.run.requires_action' && event.data.status === 'requires_action') {
        console.log('[STREAM] Run requires action. Tool calls:', event.data.required_action?.submit_tool_outputs.tool_calls.length);
        runResult = event.data; // Capture the run state that requires action
        const requiredActions = event.data.required_action?.submit_tool_outputs.tool_calls;

        if (!requiredActions || requiredActions.length === 0) {
          console.error("[STREAM] Run requires action, but no tool calls were provided.");
          // This state should ideally not happen if the assistant is configured correctly.
          // We might need to abort or send an error if this occurs.
          // For now, we let it potentially timeout or resolve differently.
          continue;
        }

        const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];

        for (const call of requiredActions) {
          const functionName = call.function.name;
          let output: any = null;
          let args: any = {};
          try {
            args = JSON.parse(call.function.arguments || '{}');
            console.log(`[STREAM] Executing tool: ${functionName}`, args);

            // --- Tool call switch statement (existing logic) ---
            switch (functionName) {
              case "set_destination":
                if (args.destination) {
                  trip.destination = args.destination;
                  updatedDataAccumulator.destination = args.destination;
                }
                if (args.destinationCountry) {
                  trip.destinationCountry = args.destinationCountry;
                  updatedDataAccumulator.destinationCountry = args.destinationCountry;
                }
                output = { status: "success", message: `Destination set to ${args.destination}, ${args.destinationCountry}` };
                break;
              case "set_travel_dates":
                let startDateStr = args.startDate;
                let endDateStr = args.endDate;
                let startDateUpdated = false;
                let endDateUpdated = false;

                console.log(`[STREAM] RAW ARGS for set_travel_dates: startDate="${startDateStr}", endDate="${endDateStr}"`);

                const looksLikeQuestion = (str: string | undefined): boolean => str ? (str.includes("?") || str.length < 5 || str.split(' ').length > 5) : false;

                if (startDateStr && !looksLikeQuestion(startDateStr)) {
                  console.log(`[STREAM] Calling parseDate for startDateStr: "${startDateStr}"`);
                  const parsedStartDate = parseDate(startDateStr);
                  console.log(`[STREAM] set_travel_dates: Original startDateStr: "${startDateStr}", Parsed: "${parsedStartDate}"`);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(parsedStartDate)) { 
                      trip.startDate = parsedStartDate;
                      updatedDataAccumulator.startDate = parsedStartDate;
                      startDateUpdated = true;
                      console.log(`[STREAM] set_travel_dates: Successfully updated trip.startDate to "${parsedStartDate}"`);
                  } else {
                      console.warn(`[STREAM] set_travel_dates: startDate "${startDateStr}" (parsed as "${parsedStartDate}") NOT updated. It's not YYYY-MM-DD or looked like a question.`);
                  }
                }
                if (endDateStr && !looksLikeQuestion(endDateStr)) {
                  console.log(`[STREAM] Calling parseDate for endDateStr: "${endDateStr}"`);
                  const parsedEndDate = parseDate(endDateStr);
                  console.log(`[STREAM] set_travel_dates: Original endDateStr: "${endDateStr}", Parsed: "${parsedEndDate}"`);
                  if (/^\d{4}-\d{2}-\d{2}$/.test(parsedEndDate)) { 
                      trip.endDate = parsedEndDate;
                      updatedDataAccumulator.endDate = parsedEndDate;
                      endDateUpdated = true;
                      console.log(`[STREAM] set_travel_dates: Successfully updated trip.endDate to "${parsedEndDate}"`);
                  } else {
                       console.warn(`[STREAM] set_travel_dates: endDate "${endDateStr}" (parsed as "${parsedEndDate}") NOT updated. It's not YYYY-MM-DD or looked like a question.`);
                  }
                }
                
                let dateMessage = "Travel dates processed.";
                if (startDateUpdated && endDateUpdated) {
                  dateMessage = `Dates set: ${trip.startDate} to ${trip.endDate}.`;
                  console.log(`[STREAM] set_travel_dates CONFIRMED: Start=${trip.startDate}, End=${trip.endDate}`);
                } else if (startDateUpdated) {
                  dateMessage = `Start date set to ${trip.startDate}. End date needs clarification.`;
                  console.log(`[STREAM] set_travel_dates PARTIAL: Start=${trip.startDate}, End needs clarification.`);
                } else if (endDateUpdated) {
                  dateMessage = `End date set to ${trip.endDate}. Start date needs clarification.`;
                  console.log(`[STREAM] set_travel_dates PARTIAL: End=${trip.endDate}, Start needs clarification.`);
                } else {
                  dateMessage = "Could not reliably set travel dates. Please clarify.";
                  console.warn(`[STREAM] set_travel_dates FAILED to set any dates reliably.`);
                }
                
                output = { status: "success", message: dateMessage };
                break;
              case "set_travelers":
                if (args.adults !== undefined) {
                  trip.adults = args.adults;
                  updatedDataAccumulator.adults = args.adults;
                }
                trip.children = args.children !== undefined ? args.children : (trip.children || 0); // Preserve existing if undefined, else default to 0
                updatedDataAccumulator.children = trip.children;

                if (args.pets !== undefined) {
                  trip.pets = args.pets;
                  updatedDataAccumulator.pets = args.pets;
                }
                output = { status: "success", message: `Travelers set: ${trip.adults ?? '?'} adults, ${trip.children} children, ${trip.pets ?? '?'} pets` };
                break;
              case "set_preferences":
                if (args.budget) {
                  trip.budget = args.budget;
                  updatedDataAccumulator.budget = args.budget;
                }
                if (args.accommodation !== undefined) {
                  const newAccommodation = Array.isArray(args.accommodation) ? args.accommodation : (typeof args.accommodation === 'string' && args.accommodation.trim() !== '' ? [args.accommodation] : []);
                  trip.accommodation = newAccommodation;
                  updatedDataAccumulator.accommodation = newAccommodation;
                }
                if (args.interests !== undefined) {
                  const newInterests = Array.isArray(args.interests) ? args.interests : (typeof args.interests === 'string' && args.interests.trim() !== '' ? [args.interests] : []);
                  trip.interests = newInterests;
                  updatedDataAccumulator.interests = newInterests;
                }
                output = { status: "success", message: "Preferences updated." };
                break;
              case "update_learned_preferences":
                const { preference_type, detail, item_reference } = args;
                if (preference_type && detail) {
                  const newPreference = { type: preference_type, detail, ...(item_reference && { item_reference }) };
                  
                  trip.learnedPreferences = trip.learnedPreferences || [];

                  if (!updatedDataAccumulator.learnedPreferences) {
                      updatedDataAccumulator.learnedPreferences = trip.learnedPreferences ? [...trip.learnedPreferences] : [];
                  }

                  const existsInTrip = trip.learnedPreferences.some(
                    (p: LearnedPreference) => p.type === preference_type && p.detail === detail
                  );
                  if (!existsInTrip) {
                    trip.learnedPreferences.push(newPreference);
                    updatedDataAccumulator.learnedPreferences = [...trip.learnedPreferences];
                    console.log('[STREAM] Recorded learned preference to trip:', newPreference);

                    if (userId) {
                      const { error: upsertError } = await supabase
                        .from('user_profiles')
                        .update({ learned_preferences: trip.learnedPreferences })
                        .eq('id', userId);

                      if (upsertError) {
                        console.error('[STREAM] Error saving learned preferences to DB:', upsertError.message);
                        output = { status: "partial_success", message: `Preference (${preference_type}) recorded locally, but failed to save persistently.` };
                      } else {
                        console.log('[STREAM] Successfully saved learned preferences to DB for user:', userId);
                        output = { status: "success", message: `Learned preference (${preference_type}) recorded.` };
                      }
                    } else {
                      output = { status: "success", message: `Learned preference (${preference_type}) recorded (session only).` };
                    }
                  } else {
                    output = { status: "success", message: `Preference (${preference_type}: ${detail}) already recorded.` };
                    console.log('[STREAM] Duplicate learned preference ignored:', newPreference);
                  }
                } else {
                  output = { status: "error", message: "Missing required arguments (preference_type, detail) for update_learned_preferences." };
                }
                break;
              case "suggest_places_of_interest":
                if (!args.location) {
                    const locationContext = updatedDataAccumulator.destination || trip?.destination;
                    if (locationContext) {
                        args.location = locationContext;
                    } else {
                        output = { status: "error", message: "Cannot suggest places without a location context." };
                        break;
                    }
                }
                output = await suggestPlacesOfInterestApiCall(args.location, trip, args.interests, args.activity_type, args.day_number);
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
                const currentFullItineraryForAdd = trip?.itinerary;
                const addActivityResult = await addActivityToDayApiCall(args.day_number, args.activity, currentFullItineraryForAdd);
                output = addActivityResult;
                if (addActivityResult.updatedItinerary) {
                    trip.itinerary = addActivityResult.updatedItinerary;
                    updatedDataAccumulator.itinerary = addActivityResult.updatedItinerary; 
                }
                if (addActivityResult.updatedItinerarySummary) {
                    trip.itinerarySummary = addActivityResult.updatedItinerarySummary;
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
                console.warn(`[STREAM] Unhandled tool call: ${functionName}`);
                output = { status: "error", message: `Unknown function: ${functionName}` };
            }
            // --- End Tool call switch statement ---
          } catch (toolError: any) {
            console.error(`[STREAM] Error processing tool ${functionName} (args: ${call.function.arguments}):`, toolError);
            // User-friendly error for the assistant
            output = { status: "error", message: `I encountered an issue trying to use the ${functionName} tool. Please try rephrasing your request or try again later.` };
          }
          toolOutputs.push({ tool_call_id: call.id, output: JSON.stringify(output) });
        } // End for loop for tool calls

        if (toolOutputs.length > 0 && runResult) {
          console.log('[STREAM] Submitting tool outputs...');
          try {
            // Submit tool outputs and DO NOT continue streaming from this call directly.
            await openai.beta.threads.runs.submitToolOutputs(runResult.thread_id, runResult.id, {
              tool_outputs: toolOutputs,
            });
            console.log('[STREAM] Tool outputs submitted. Transitioning to polling for run completion.');
            streamedToolSubmission = true; // Set flag
            break; // Exit the stream loop to start polling
          } catch (submitError: any) {
            console.error(`[STREAM] Error submitting tool outputs for run ${runResult.id}:`, submitError);
            runResult.status = "failed"; 
            runResult.last_error = { code: "server_error", message: `Failed to submit tool outputs: ${submitError.message}` };
            // This error will be handled when the 'thread.run.failed' event is processed or at the end.
          }
        }
      } else if (event.event === 'thread.run.completed') {
        console.log('[STREAM] Run completed.');
        runResult = event.data; // Capture final run state
        responseData.reply = finalReply.trim() || null;
        if (Object.keys(updatedDataAccumulator).length > 0 && !responseData.triggerItineraryGeneration) {
          responseData.updatedTripData = trip;
        }
        // If no reply but generation triggered, set a confirmation
        if (!responseData.reply && responseData.triggerItineraryGeneration) {
            responseData.reply = "Okay, I have all the details needed. The itinerary generation will start now.";
        }
        //MODIFICATION: DATE VALIDATION - Final check before successful response
        if (trip.startDate && trip.endDate) {
            try {
                const startDateObj = new Date(trip.startDate);
                const endDateObj = new Date(trip.endDate);
                if (endDateObj < startDateObj) {
                    console.warn("[API Chat Builder] Date validation failed on completion: End date is before start date.");
                    const dateValidationError = "Error: The end date cannot be before the start date. Please clarify your travel dates.";
                    responseData.reply = responseData.reply ? `${dateValidationError} ${responseData.reply}` : dateValidationError;
                    if(responseData.updatedTripData) {
                        delete responseData.updatedTripData.startDate;
                        delete responseData.updatedTripData.endDate;
                    }
                     if(trip) {
                        delete trip.startDate;
                        delete trip.endDate;
                    }
                    // For a 200 response, we modify the reply and data rather than changing status code here.
                    // The client will receive the corrected data and the AI's message will indicate the issue.
                }
            } catch (dateParseError) {
                console.error("[API Chat Builder] Error parsing dates for final validation:", dateParseError);
            }
        }
        break; // Exit the loop as the run is complete
      } else if (event.event === 'thread.run.failed') {
        console.error('[STREAM] Run failed.', event.data.last_error);
        runResult = event.data; // Capture final run state
        responseData.reply = responseData.reply || `Sorry, a processing error occurred (${event.data.last_error?.code || 'SERVER_ERROR'}). Please try again.`;
        if (Object.keys(updatedDataAccumulator).length > 0) {
          responseData.updatedTripData = trip;
        }
        return NextResponse.json(responseData, { status: 500 });
      } else if (event.event === 'thread.run.cancelled' || event.event === 'thread.run.expired') {
        console.warn(`[STREAM] Run ${event.event}.`);
        runResult = event.data;
        responseData.reply = responseData.reply || `The process was ${event.event}. Please try again.`;
        if (Object.keys(updatedDataAccumulator).length > 0) {
          responseData.updatedTripData = trip;
        }
        return NextResponse.json(responseData, { status: event.event === 'thread.run.expired' ? 504 : 503 });
      } else if (event.event === 'thread.run.step.created' || event.event === 'thread.run.step.in_progress' || event.event === 'thread.run.step.completed') {
        // console.log(`[STREAM] Run step event: ${event.event}, Step ID: ${event.data.id}`);
      } else if (event.event === 'thread.message.created' || event.event === 'thread.message.in_progress' || event.event === 'thread.message.completed') {
        // console.log(`[STREAM] Message event: ${event.event}, Message ID: ${event.data.id}`);
      }
    } // End of for await (const event of runStream)

    // If we broke from the stream loop due to tool submission, start polling
    if (streamedToolSubmission && runResult) {
      try {
        console.log(`[Polling] Starting polling for run completion: ${runResult.id}`);
        runResult = await waitForRunCompletion(runResult.thread_id, runResult.id);
        console.log(`[Polling] Run ${runResult.id} completed with status: ${runResult.status}`);

        if (runResult.status === 'completed') {
          // Fetch the latest messages to get the assistant's response post-tool use
          const messages = await openai.beta.threads.messages.list(runResult.thread_id, { order: 'desc', limit: 10 });
          const assistantMessages = messages.data.filter(m => m.run_id === runResult?.id && m.role === 'assistant');
          
          if (assistantMessages.length > 0 && assistantMessages[0].content.length > 0) {
            const firstContent = assistantMessages[0].content[0];
            if (firstContent?.type === 'text') {
              finalReply = firstContent.text.value; // Overwrite finalReply with the complete message
            }
          }
          responseData.reply = finalReply.trim() || null; // Use the fetched complete reply
          if (Object.keys(updatedDataAccumulator).length > 0 && !responseData.triggerItineraryGeneration) {
            responseData.updatedTripData = trip;
          }
          if (!responseData.reply && responseData.triggerItineraryGeneration) {
            responseData.reply = "Okay, I have all the details needed. The itinerary generation will start now.";
          }
        } 
        // This 'else if' for requires_action should ideally not be hit if waitForRunCompletion throws an error for it.
        // However, if waitForRunCompletion were to return it, this would be the handling.
        // For now, the throw in waitForRunCompletion is the primary gate.
        /* else if (runResult.status === 'requires_action') {
            console.warn("[Polling] Run completed polling but ended in 'requires_action' state again.");
            responseData.reply = "It seems I need more information or another action right away. Could you clarify your last point or command?";
        }*/ else {
          // Handle other terminal states if necessary (e.g. failed, though waitForRunCompletion throws for failed)
          console.error(`[Polling] Run ${runResult.id} ended with unexpected status after polling: ${runResult.status}`);
          responseData.reply = responseData.reply || `The process ended with status: ${runResult.status}. Please try again.`;
        }
      } catch (pollingError: any) {
        console.error('[POST Handler] Error during run processing (polling or tool submission issue):', pollingError);
        responseData.reply = responseData.reply || `Sorry, there was an issue processing your request: ${pollingError.message}. Please try again.`;
        
        let statusCode = 500;
        if (pollingError.message.includes("timed out")) statusCode = 504;
        // Check for the specific error thrown by our modified waitForRunCompletion
        if (pollingError.message.includes("requires further action unexpectedly")) statusCode = 500; // Internal server error, as our loop isn't handling it yet
        
        // If the error is the 400 "Can't add messages while run is active", it's a state management issue.
        // This usually means the client tried to send a new message before the previous run was fully resolved from the API's perspective.
        // This specific catch block is *after* polling, so direct 400s from message creation are caught earlier.

        return NextResponse.json(responseData, { status: statusCode });
      }
    }

    // Fallback if loop finishes without a clear "completed" or "failed" event handled (e.g., initial direct completion)
    // This part now mainly handles cases where the run completes *without* ever requiring tool action.
    else if (!runResult || (runResult.status !== 'completed' && runResult.status !== 'failed' && runResult.status !== 'cancelled' && runResult.status !== 'expired')) {
      console.warn('[API Chat Builder] Stream ended (or never started tool actions) without a definitive run completion state. Current run state:', runResult?.status);
      let lastKnownStatus = runResult?.status || "unknown";
      try {
        if(currentThreadId && runResult?.id) {
            const finalRunState = await openai.beta.threads.runs.retrieve(currentThreadId, runResult.id);
            lastKnownStatus = finalRunState.status;
            if(finalRunState.status === 'completed') {
                // If it actually completed, try to fetch messages again
                const messages = await openai.beta.threads.messages.list(currentThreadId, { order: 'desc', limit: 1 });
                const assistantMessage = messages.data.find(m => m.role === 'assistant');
                if (assistantMessage && assistantMessage.content.length > 0) {
                    const firstContent = assistantMessage.content[0];
                    if (firstContent?.type === 'text') {
                        responseData.reply = firstContent.text.value;
                    }
                }
                if (Object.keys(updatedDataAccumulator).length > 0 && !responseData.triggerItineraryGeneration) {
                    responseData.updatedTripData = trip;
                }
                if (!responseData.reply && responseData.triggerItineraryGeneration) {
                    responseData.reply = "Okay, I have all the details needed. The itinerary generation will start now.";
                }
                console.log('[API Chat Builder] Fallback check found run completed. Response prepared.');
                return NextResponse.json(responseData);
            }
        }
      } catch (retrieveError) {
          console.error('[API Chat Builder] Error retrieving final run state in fallback:', retrieveError);
      }

      responseData.reply = responseData.reply || `Sorry, the request seems to have timed out or ended unexpectedly (last known status: ${lastKnownStatus}). Please try again.`;
      if (Object.keys(updatedDataAccumulator).length > 0) {
          responseData.updatedTripData = trip;
      }
      return NextResponse.json(responseData, { status: 504 }); // Gateway Timeout
    }
    
    // If run completed successfully, responseData.reply and responseData.updatedTripData should be set.
    // If responseData.reply is still null here after a successful completion, it means no text was generated.
    if (runResult && runResult.status === 'completed' && responseData.reply === null && !responseData.triggerItineraryGeneration) {
        console.warn('[API Chat Builder] Run completed but no assistant message content found');
        responseData.reply = "Processing complete, but no further message generated."; 
    }

    console.log('[API Chat Builder] Final Response Data (trip object):', trip);
    console.log('[API Chat Builder] Final Response Data (responseData):', responseData);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[API Chat Builder] Unhandled Error in POST handler:', error);
    // Ensure responseData has threadId if available
    if (currentThreadId) responseData.threadId = currentThreadId;
    responseData.reply = responseData.reply || `Sorry, a critical server error occurred. Please try again. Details: ${error.message || 'Unknown error'}`;
    return NextResponse.json(responseData, { status: 500 });
  }
}
