'use server';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

// Vercel: Increase max duration for complex itinerary generation
export const maxDuration = 300; // Allow full 5 minutes (adjust if needed)

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
//console.log('[EnhancedItinerary API] OpenAI API Key (partial):', process.env.OPENAI_API_KEY?.slice(0, 5) + '...');

// Initialize Google Places API client (using Fetch for simplicity)
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
//console.log('[EnhancedItinerary API] Google Places API Key (partial):', GOOGLE_PLACES_API_KEY?.slice(0, 5) + '...');
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

// Haversine formula to calculate distance between two coordinates (in kilometers)
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface TripData {
  origin: string;
  originCountry: string;
  destination: string;
  destinationCountry: string;
  additionalCities: string[];
  additionalCountries?: string[];
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  pets: number;
  petDetails: { type: string; size: string }[];
  budget: string;
  accommodation: string;
  interests: string[];
  additionalInfo: string;
  draftId?: string;
}

interface PetPolicy {
  policy_id: number;
  country_name: string;
  slug: string;
  external_link?: string;
  quarantine_info?: string;
  entry_requirements?: Record<string, string>;
  additional_info?: Record<string, string>;
  external_links?: Record<string, string>;
  flag_path: string;
  created_at?: string;
  updated_at?: string;
}

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  vicinity?: string;
}

interface Activity {
  name: string;
  description: string;
  petFriendly: boolean;
  location: string;
  coordinates: { lat: number; lng: number };
  startTime?: string;
  endTime?: string;
  cost?: string;
  type?: 'flight' | 'transfer' | 'accommodation' | 'meal' | 'activity' | 'placeholder' | 'preparation';
  place_id?: string;
  website?: string;
  phone_number?: string;
  opening_hours?: string;
  photo_references?: any[];
  booking_link?: string;
  pet_friendliness_details?: string;
  estimated_duration?: number;
}

interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  activities: Activity[];
  preparation?: Array<{ requirement: string; details: string }>;
  travel?: string;
  narrative_intro?: string;
  narrative_outro?: string;
}

interface Itinerary {
  days: ItineraryDay[];
}

export async function POST(request: NextRequest) {
  //console.log('[EnhancedItinerary API] Received POST request');
  let tripData: TripData;

  try {
    // --- Step 1: Parse and Validate Input --- 
   /// console.log('[EnhancedItinerary API] Parsing request body...');
    try {
      tripData = await request.json();
      //console.log('[EnhancedItinerary API] Request body parsed:', tripData);
    } catch (parseError) {
     // console.error('[EnhancedItinerary API] Failed to parse request JSON:', parseError);
      return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }

    console.log('[EnhancedItinerary API] Validating required fields...');
    const requiredFields = ['origin', 'originCountry', 'destination', 'destinationCountry', 'startDate', 'endDate', 'adults', 'budget', 'accommodation', 'interests'];
    const missingFields = requiredFields.filter(field => !(tripData as any)[field]);
    if (missingFields.length > 0) {
     // console.error('[EnhancedItinerary API] Validation failed:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    if (tripData.pets > 0 && (!tripData.petDetails || tripData.petDetails.length !== tripData.pets)) {
      console.error('[EnhancedItinerary API] Validation failed: petDetails does not match number of pets');
      return NextResponse.json(
        { error: 'petDetails must match the number of pets' },
        { status: 400 }
      );
    }

    // Calculate trip duration
   // console.log('[EnhancedItinerary API] Calculating trip duration...');
    const startDate = new Date(tripData.startDate);
    const endDate = new Date(tripData.endDate);
    const tripDays =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (tripDays < 1) {
     // console.error('[EnhancedItinerary API] Invalid trip dates:', tripData.startDate, tripData.endDate);
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }
    console.log('[EnhancedItinerary API] Trip duration:', tripDays, 'days');

    console.log('[EnhancedItinerary API] Input validation passed');

    // --- Step 2a: Interpret Additional Info with OpenAI --- 
    let userPreferences: string[] = [];
    if (tripData.additionalInfo && tripData.additionalInfo.trim().length > 0) {
        //console.log('[EnhancedItinerary API] Interpreting additionalInfo with OpenAI...');
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are an assistant analyzing user requests for a pet-friendly trip. Extract key constraints, preferences, or needs mentioned in the user's additional information. Focus on actionable items relevant to itinerary planning (e.g., 'needs quiet walks', 'prefers ground floor', 'avoids crowds', 'specific dietary need mentioned'). Output ONLY a valid JSON list of strings. If no relevant preferences are found, output an empty list [].",
                    },
                    {
                        role: "user",
                        content: `User's additional information: "${tripData.additionalInfo}"`,
                    },
                ],
                response_format: { type: "json_object" }, // Request JSON output
                temperature: 0.2, // Lower temperature for more deterministic extraction
            });

            const rawResponse = completion.choices[0]?.message?.content;
            if (rawResponse) {
                //console.log('[EnhancedItinerary API] Raw OpenAI response for preferences:', rawResponse);
                // Attempt to parse the JSON list directly from the content
                try {
                    const parsedJson = JSON.parse(rawResponse);
                    // Check if the parsed result is an array of strings
                    if (Array.isArray(parsedJson) && parsedJson.every(item => typeof item === 'string')) {
                        userPreferences = parsedJson;
                        //console.log('[EnhancedItinerary API] Parsed user preferences:', userPreferences);
                    } else if (typeof parsedJson === 'object' && parsedJson !== null) {
                         // Sometimes the model might wrap the list in an object, e.g. {"preferences": []}
                         const key = Object.keys(parsedJson)[0];
                         if (key && Array.isArray(parsedJson[key]) && parsedJson[key].every((item: unknown) => typeof item === 'string')) {
                            userPreferences = parsedJson[key];
                           // console.log('[EnhancedItinerary API] Parsed user preferences (from nested object):', userPreferences);
                         } else {
                            // console.warn('[EnhancedItinerary API] OpenAI response JSON was not the expected list format.', parsedJson);
                         }
                    } else {
                        //console.warn('[EnhancedItinerary API] OpenAI response was not a valid JSON list of strings.');
                    }
                } catch (parseError) {
                    //console.error('[EnhancedItinerary API] Failed to parse OpenAI preferences JSON:', parseError, 'Raw content:', rawResponse);
                    // Fallback: Try to extract simple phrases if JSON fails? (Optional)
                }
            } else {
               // console.log('[EnhancedItinerary API] No content received from OpenAI for preferences.');
            }
        } catch (error) {
            console.error('[EnhancedItinerary API] Error calling OpenAI for preferences:', error);
            // Continue without preferences if OpenAI fails
        }
    } else {
       // console.log('[EnhancedItinerary API] No additionalInfo provided by user.');
    }

    // --- Step 2b: Fetch External Data (Policies, Places) --- 
    console.log('[EnhancedItinerary API] Fetching pet policies...');
    const supabase = await createClient();
    // Fetch only slug and entry_requirements
    const { data: petPolicyData, error: policyError } = await supabase
      .from('pet_policies')
      .select('slug, entry_requirements') // Select only necessary fields
      .eq('country_name', tripData.destinationCountry)
      .single();

    if (policyError && policyError.code !== 'PGRST116') { // Allow 'No rows found'
      console.warn('[EnhancedItinerary API] Warning: Error querying pet_policies:', policyError);
      // Continue execution, but policy data will be missing
    } else if (petPolicyData) {
      console.log('[EnhancedItinerary API] Fetched pet_policies data (slug, requirements) for:', tripData.destinationCountry);
    } else {
      console.log('[EnhancedItinerary API] No specific pet policies found for:', tripData.destinationCountry);
    }

    // Format preparation requirements and extract structured entry requirements
    console.log('[EnhancedItinerary API] Formatting preparation requirements...');
    // Initialize generalPreparation with a default message if policies aren't found
    const generalPreparation: Array<{ requirement: string; details: string | { url: string; title: string } }> = []; 
    let policyRequirements: Array<{ step: number; label: string; text: string }> = [];
    let destinationSlug: string | undefined = undefined;

    if (petPolicyData) {
      destinationSlug = petPolicyData.slug; // Store the slug

      if (petPolicyData.entry_requirements && Array.isArray(petPolicyData.entry_requirements)) {
        console.log('[EnhancedItinerary API] Extracting structured entry_requirements:', petPolicyData.entry_requirements.length, 'steps');
        policyRequirements = petPolicyData.entry_requirements
          .filter((item: any) =>
              typeof item === 'object' && item !== null &&
              typeof item.step === 'number' &&
              typeof item.label === 'string' &&
              typeof item.text === 'string'
          )
          .map((item: any) => ({
              step: item.step,
              label: item.label,
              text: item.text,
          }))
          .sort((a, b) => a.step - b.step);
          console.log('[EnhancedItinerary API] Parsed policyRequirements:', policyRequirements);
      } else {
        console.warn('[EnhancedItinerary API] entry_requirements field exists but is not a valid array or is missing.');
        // Add a note to general preparation if steps couldn't be parsed
        generalPreparation.push({
             requirement: 'Entry Requirements Note',
             details: 'Could not parse specific entry requirement steps. Please refer to official sources.'
         });
      }
      
      // Remove processing of other policy fields like quarantine, additional_info, external_links into generalPreparation
      // They are available on the full policy page via the slug link

    } else {
      console.log('[EnhancedItinerary API] No pet policies found, adding fallback general message');
      generalPreparation.push({
        requirement: 'Check Requirements',
        details: `Please check the latest pet entry requirements for ${tripData.destinationCountry} via official sources.`,
      });
    }
    console.log('[EnhancedItinerary API] Final general preparation requirements:', generalPreparation);
    console.log('[EnhancedItinerary API] Final structured policy requirements:', policyRequirements);
    console.log('[EnhancedItinerary API] Destination Slug:', destinationSlug);

    // --- Step 3: Fetch Richer Data from Google Places ---

    // Function to perform Places API Text Search, now with optional location bias
    const searchGooglePlaces = async (
        query: string,
        type?: string,
        location?: { lat: number; lng: number },
        radius?: number // Radius in meters
    ): Promise<Place[]> => {
        //console.log(`[EnhancedItinerary API] Querying Places: ${query} ${type ? `(Type: ${type})` : ''}${location ? ` near (${location.lat}, ${location.lng})` : ''}`);
        let url = `${PLACES_API_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
        if (type) {
            url += `&type=${type}`;
        }
        // Add budget constraints for relevant types
        if ((type === 'lodging' || type === 'restaurant') && tripData.budget) {
            if (tripData.budget === 'Budget' && type !== 'lodging') { // Maxprice often less useful for lodging
                url += `&maxprice=2`;
            } else if (tripData.budget === 'Luxury') {
                url += `&minprice=3`;
            }
            // 'Moderate' doesn't map cleanly to min/max, so no parameter added.
        }
        if (location && radius) {
             // Add location bias for more relevant local results
             url += `&location=${location.lat},${location.lng}&radius=${radius}`;
             //console.log(`[EnhancedItinerary API] Applying location bias: ${location.lat},${location.lng} with radius ${radius}m`);
        }
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok || data.status !== 'OK') {
                //console.warn(`[EnhancedItinerary API] Google Places API error for query "${query}": ${data.status} - ${data.error_message || response.statusText}`);
                return [];
            }
            //console.log(`[EnhancedItinerary API] Places found for query "${query}": ${data.results?.length || 0}`);
            return data.results || [];
        } catch (error) {
            //console.error(`[EnhancedItinerary API] Network error fetching places for query "${query}":`, error);
            return [];
        }
    };

    // --- NEW HELPER FUNCTION: Fetch Place Details ---
    const fetchPlaceDetails = async (placeId: string): Promise<any | null> => {
        if (!placeId) {
            console.warn('[EnhancedItinerary API] fetchPlaceDetails called with empty placeId.');
            return null;
        }
        //console.log(`[EnhancedItinerary API] Fetching Place Details for ID: ${placeId}`);
        const fields = [
            'place_id',
            'name',
            'formatted_address',
            'vicinity',
            'website',
            'formatted_phone_number',
            'opening_hours',
            'reviews',
            'photos',
            'geometry',
            'price_level',
            'rating',
            'user_ratings_total',
            'types'
        ].join(',');

        const url = `${PLACES_API_BASE_URL}/details/json?place_id=${encodeURIComponent(placeId)}&key=${GOOGLE_PLACES_API_KEY}&fields=${fields}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || data.status !== 'OK') {
                console.warn(`[EnhancedItinerary API] Google Place Details API error for placeId "${placeId}": ${data.status} - ${data.error_message || data.status || response.statusText}`);
                return null;
            }

            //console.log(`[EnhancedItinerary API] Place Details fetched successfully for ${placeId}: ${data.result?.name}`);
            return data.result || null; // Return the 'result' object
        } catch (error) {
            console.error(`[EnhancedItinerary API] Network error fetching place details for placeId "${placeId}":`, error);
            return null;
        }
    };

    // --- Fetch Foundational Data ---
    // Destination Airport Coords (Best effort)
    let destinationAirportCoords: { lat: number; lng: number } | null = null;
    const airportResults = await searchGooglePlaces(`${tripData.destination} airport`, 'airport');
    if (airportResults.length > 0 && airportResults[0].geometry?.location) {
        destinationAirportCoords = airportResults[0].geometry.location;
        //console.log('[EnhancedItinerary API] Found destination airport coordinates:', destinationAirportCoords);
    } else {
        //console.warn('[EnhancedItinerary API] Could not find coordinates for destination airport.');
    }

    // Fetch Accommodation (Best effort)
    let recommendedAccommodation: Place | null = null;
    let recommendedAccommodationDetails: any | null = null; // <-- Store full details
    let accommodationCoords = destinationAirportCoords; // Default to airport initially
    if (tripData.accommodation && tripData.accommodation !== 'Flexible') {
        const accommodationQuery = `pet friendly ${tripData.accommodation.toLowerCase()} in ${tripData.destination}`;
        const accommodationOptions = await searchGooglePlaces(accommodationQuery, 'lodging', destinationAirportCoords || undefined, 20000); 
        if (accommodationOptions.length > 0 && accommodationOptions[0].place_id) {
            recommendedAccommodation = accommodationOptions[0]; // Keep basic Place info
            // --- Fetch Full Details --- 
            recommendedAccommodationDetails = await fetchPlaceDetails(accommodationOptions[0].place_id);
            if (recommendedAccommodationDetails?.geometry?.location) {
                accommodationCoords = recommendedAccommodationDetails.geometry.location; // Update coords from details
                //console.log(`[EnhancedItinerary API] Recommended accommodation details fetched: ${recommendedAccommodationDetails.name} at`, accommodationCoords);
            } else {
                // Fallback to search result coords if details lack geometry
                if (recommendedAccommodation.geometry?.location) {
                    accommodationCoords = recommendedAccommodation.geometry.location;
                }
                //console.warn(`[EnhancedItinerary API] Could not get coordinates from Place Details for accommodation, using search result coords.`);
            }
        } else {
            //console.warn(`[EnhancedItinerary API] No specific ${tripData.accommodation} found near airport/destination.`);
        }
    } else {
        //console.log(`[EnhancedItinerary API] Accommodation preference is Flexible or not set.`);
    }
    const primaryLocationCoords = accommodationCoords || destinationAirportCoords || { lat: 0, lng: 0 }; 
    // Use detailed name if available, fallback to search name, then accommodation type
    const accommodationName = recommendedAccommodationDetails?.name || recommendedAccommodation?.name || tripData.accommodation || "Your Accommodation";
    //console.log(`[EnhancedItinerary API] Primary location coordinates for searches set to:`, primaryLocationCoords);

    // Fetch General Pet-Friendly Restaurants near primary location
    const restaurantQuery = `pet friendly restaurant in ${tripData.destination}`;
    const generalPetFriendlyRestaurants = await searchGooglePlaces(restaurantQuery, 'restaurant', primaryLocationCoords, 15000); // 15km radius around hotel/airport
    //console.log(`[EnhancedItinerary API] Found ${generalPetFriendlyRestaurants.length} general pet-friendly restaurants near primary location.`);

    // --- Fetch Interest-Based Activities (Refined Queries) ---
    //console.log('[EnhancedItinerary API] Fetching activities based on interests...');
    const interestBasedActivities: Activity[] = [];
    const MAX_ACTIVITIES_PER_INTEREST_TYPE = 3; // Limit results per specific query type
    const activitiesPerDayGoal = 2;
    const totalActivitiesNeeded = Math.max(0, (tripDays - 1) * activitiesPerDayGoal);

    // Refined mapping of interests to specific Place Types/Keywords
    // Keys are interests from your constants, values are arrays of queries/types
    const interestToQueries: { [key: string]: { query?: string; type?: string }[] } = {
        Sightseeing: [
            { type: 'tourist_attraction' }, 
            { type: 'landmark' }
        ],
        'Outdoor Adventures': [
            { query: 'pet friendly hiking trail' }, 
            { query: 'pet friendly park' }, 
            { type: 'dog_park' },
            { type: 'park' } // General fallback
        ],
        Sports: [
            { type: 'stadium' }, 
            { query: 'sports complex' } // Keyword search
        ],
        'Food Tours': [ // Note: Restaurants are fetched separately, focus on cafes/breweries etc.
            { query: 'pet friendly cafe', type: 'cafe' },
            { query: 'pet friendly brewery', type: 'bar' }, // Breweries often classified as bars
        ],
        Museums: [
            { type: 'museum' }, 
            { type: 'art_gallery' }
        ],
        Shopping: [
            { type: 'shopping_mall' }, 
            { query: 'pet friendly market', type: 'market' }, // May need adjustment
            { query: 'pet friendly shops' }, // General keyword
        ],
        'Spa and Wellness': [
            // Difficult for pets, maybe focus on relaxing outdoor spots?
            { query: 'quiet park', type: 'park' }
        ],
        'Local Experiences': [
             { query: 'pet friendly walking tour'}, // Keyword
             { query: 'local market', type: 'market' },
             { type: 'tourist_attraction' } // Broader
        ],
        Photography: [
            { query: 'scenic viewpoint', type: 'point_of_interest' },
            { type: 'park' }, 
            { type: 'landmark' }
        ],
        'Wildlife Viewing': [
            // Often not pet-friendly, maybe suggest specific reserves if known?
            { query: 'nature reserve', type: 'park' }
        ],
        'Water Activities': [
            { query: 'pet friendly beach', type: 'beach' },
            { query: 'dog beach', type: 'beach' }
        ],
        Nightlife: [
            { query: 'pet friendly bar', type: 'bar' }, 
            { query: 'pet friendly pub', type: 'bar' }
        ],
        'Historical Sites': [
            { type: 'historical_landmark' }, 
            { query: 'historic site' }
        ],
        'Cultural Events': [
            // Hard to find via Places API directly, focus on venues
            { query: 'outdoor theater', type: 'performing_arts_theater' },
        ],
        Other: [{ type: 'point_of_interest' }],
    };

    const fetchedPlaceIds = new Set<string>();
    generalPetFriendlyRestaurants.forEach(p => p.place_id && fetchedPlaceIds.add(p.place_id));
    if (recommendedAccommodation?.place_id) fetchedPlaceIds.add(recommendedAccommodation.place_id);

    for (const interest of tripData.interests) {
        const queries = interestToQueries[interest] || interestToQueries['Other'];
        let placesForInterest: Place[] = [];

        for (const { query: specificQuery, type } of queries) {
             // Construct query text: prioritize specific query term, fall back to type
            let queryText = specificQuery ? specificQuery.includes(tripData.destination) ? specificQuery : `${specificQuery} in ${tripData.destination}` : `${type?.replace(/_/g, ' ') || 'place'} in ${tripData.destination}`;
            if (tripData.pets > 0 && !queryText.toLowerCase().includes('pet friendly') && !queryText.toLowerCase().includes('dog park')) {
                queryText = `pet friendly ${queryText}`;
            }

            // Use primary location coords (hotel/airport) for biasing
            const results = await searchGooglePlaces(queryText, type, primaryLocationCoords, 15000); // 15km radius
            placesForInterest.push(...results);
            // Limit per specific query type within the interest
            if (placesForInterest.length >= MAX_ACTIVITIES_PER_INTEREST_TYPE) break; 
        }
        
        //console.log(`[EnhancedItinerary API] Interest '${interest}': Found ${placesForInterest.length} potential places.`);

        placesForInterest.forEach((place: Place) => {
            if (!place.place_id || fetchedPlaceIds.has(place.place_id)) {
                // console.log(`[EnhancedItinerary API] Skipping duplicate or invalid place: ${place.name}`);
                return; 
            }
            fetchedPlaceIds.add(place.place_id);

            const explicitlySearchedPetFriendly = tripData.pets > 0; 
            let description = place.types ? place.types.map(t => t.replace(/_/g, ' ')).join(', ') : 'Attraction';
            // Add rating if available
            // if (place.rating) { description += ` (Rating: ${place.rating}${place.user_ratings_total ? ` / ${place.user_ratings_total} reviews` : ''})`; }
            
            let estimatedCost = placePriceLevelToCost(place.price_level); // Use helper
            // Refine cost estimate based on type if price level is missing
            if (estimatedCost === placePriceLevelToCost(undefined)) { // Check if it used the default
                 const placeTypes = place.types || [];
                 if (placeTypes.includes('museum') || placeTypes.includes('tourist_attraction') || placeTypes.includes('amusement_park') || placeTypes.includes('zoo')) {
                    estimatedCost = "$20 - $50";
                 } else if (placeTypes.includes('park') || placeTypes.includes('landmark') || placeTypes.includes('hiking_area') || placeTypes.includes('natural_feature')) {
                    estimatedCost = "Free - $20";
                 } else if (placeTypes.includes('cafe') || placeTypes.includes('bar')) {
                     estimatedCost = "$10 - $30";
                 }
            }

            interestBasedActivities.push({
                name: place.name,
                description: description,
                petFriendly: explicitlySearchedPetFriendly, // Assumption based on query
                location: place.vicinity || place.formatted_address || tripData.destination,
                coordinates: place.geometry.location,
                cost: estimatedCost,
                type: 'activity' 
            });
        });
    }
    //console.log('[EnhancedItinerary API] Total unique interest-based activities fetched:', interestBasedActivities.length);

    // Shuffle activities to add variety before selection
    interestBasedActivities.sort(() => Math.random() - 0.5);

    // Select activities needed for subsequent days
    let filteredSubsequentActivities: Activity[] = interestBasedActivities.slice(0, totalActivitiesNeeded); 
    //console.log('[EnhancedItinerary API] Selected activities for subsequent days:', filteredSubsequentActivities.length);

    // Convert general restaurant Places to Activity type
    const restaurantActivities: Activity[] = generalPetFriendlyRestaurants.map(place => {
         let description = place.types ? place.types.map(t => t.replace(/_/g, ' ')).join(', ') : 'Restaurant/Cafe';
         // Calculate approximate cost based on price level
         let cost = "$30 - $60"; // Default
         if (place.price_level) {
            if (place.price_level <= 1) cost = "$ - $"; // Inexpensive
            else if (place.price_level === 2) cost = "$$ - $$"; // Moderate
            else if (place.price_level === 3) cost = "$$$ - $$$$"; // Expensive
            else if (place.price_level >= 4) cost = "$$$$+"; // Very Expensive
         }

        return {
            name: place.name || "Pet-Friendly Restaurant",
            description: description,
            petFriendly: true, // Assumed from query
            location: place.vicinity || place.formatted_address || tripData.destination,
            coordinates: {
                lat: place.geometry?.location?.lat || 0,
                lng: place.geometry?.location?.lng || 0
            },
            cost: cost,
            type: 'meal' as const // Explicitly cast string literal to type
        };
    });
    //console.log('[EnhancedItinerary API] Converted restaurants to activities:', restaurantActivities.length);

    // --- Step 4: Generate Structured Itinerary (with Improved Fallbacks) ---
    //console.log('[EnhancedItinerary API] Generating structured itinerary with improved fallbacks...');
    const itinerary: Itinerary = { days: [] };
    let currentDate = new Date(startDate);
    let currentDay = 1;
    let remainingInterestActivitiesPool = [...filteredSubsequentActivities]; // Pool for days 2+
    let remainingRestaurantActivitiesPool = [...restaurantActivities]; // Pool for days 1+
    const usedActivityPlaceIds = new Set<string>(); // Track used activities to avoid reuse across days

    // Helper to get a unique activity from the pool
    const getUniqueActivity = (pool: Activity[]): Activity | undefined => {
        while (pool.length > 0) {
            const activity = pool.shift();
            // Check if location (acting as a proxy for place_id here) has been used
            if (activity && !usedActivityPlaceIds.has(activity.location)) {
                usedActivityPlaceIds.add(activity.location);
                return activity;
            }
        }
        return undefined;
    };
    
    // Helper to get a unique restaurant from the pool
    const getUniqueRestaurant = (pool: Activity[]): Activity | undefined => {
         while (pool.length > 0) {
            const restaurant = pool.shift();
             // Check if location (acting as a proxy for place_id here) has been used
            if (restaurant && !usedActivityPlaceIds.has(restaurant.location)) {
                usedActivityPlaceIds.add(restaurant.location);
                return restaurant;
            }
        }
        return undefined;
    };

    // Helper to convert a Place OR Place Details to an Activity (Enhanced)
    const placeToActivity = (placeOrDetails: Place | any, type: Activity['type'] = 'activity'): Activity => {
        const isDetails = placeOrDetails && typeof placeOrDetails === 'object' && 'place_id' in placeOrDetails && 'formatted_phone_number' in placeOrDetails; // Heuristic to check if it's details
        const source = isDetails ? placeOrDetails : (placeOrDetails as Place);

        let description = source.types ? source.types.map((t: string) => t.replace(/_/g, ' ')).join(', ') : (type === 'meal' ? 'Restaurant/Cafe' : 'Attraction');
        if (source.rating) {
            description += ` (Rating: ${source.rating}${source.user_ratings_total ? ` / ${source.user_ratings_total} reviews` : ''})`;
        }

        // Simple Pet Friendliness Check & Budget Context
        let petFriendlinessNotes = "Pet policies based on available data, please verify directly.";
        if (isDetails && source.reviews) {
            const reviewText = source.reviews.slice(0, 3).map((r: any) => r.text).join(' ').toLowerCase();
            if (reviewText.includes('pet') || reviewText.includes('dog') || reviewText.includes('allowed') || reviewText.includes('patio')) {
                 petFriendlinessNotes = "Reviews may mention pets (e.g., on patio). Please verify policy directly.";
            }
        }
        
        // Add budget context for LLM later
        petFriendlinessNotes += ` (User Budget: ${tripData.budget})`; 

        // Format opening hours
        const openingHoursStr = source.opening_hours?.weekday_text?.join(', ') || undefined;

        // Estimate duration based on type
        let duration = 90; // Default duration in minutes
        const types = source.types || [];
        if (types.includes('restaurant') || types.includes('bar')) duration = 75;
        else if (types.includes('cafe')) duration = 45;
        else if (types.includes('museum') || types.includes('zoo') || types.includes('amusement_park')) duration = 120;
        else if (types.includes('park') || types.includes('tourist_attraction') || types.includes('landmark')) duration = 90;
        else if (types.includes('shopping_mall')) duration = 120;

         return {
            name: source.name || (type === 'meal' ? 'Pet-Friendly Meal Spot' : 'Interesting Place'),
            description: description, // Keep simple for now, LLM will enhance later
            petFriendly: true, // Assumed true for places fetched by pet-friendly queries (refine later)
            location: source.vicinity || source.formatted_address || tripData.destination,
            coordinates: source.geometry?.location || { lat: 0, lng: 0 },
            cost: placePriceLevelToCost(source.price_level), // Use helper
            type: type,
            // --- Populate new fields ---
            place_id: source.place_id,
            website: source.website,
            phone_number: source.formatted_phone_number,
            opening_hours: openingHoursStr,
            photo_references: source.photos, // Store raw photo references for now
            // booking_link: undefined, // Add logic later if needed
            pet_friendliness_details: petFriendlinessNotes, 
            estimated_duration: duration // Use estimated duration
        };
    };

    // --- Pre-Departure Preparation --- 
    const preDeparturePreparation: Activity[] = [];
    if (tripData.pets > 0) {
        //console.log('[EnhancedItinerary API] Adding pre-departure preparations...');
        preDeparturePreparation.push({
            name: "Veterinarian Visit & Paperwork",
            description: "Schedule a vet appointment 1-2 weeks before departure. Obtain required vaccinations/treatments and a health certificate stating your pet is fit to travel. Ensure all documentation matches the destination country's requirements. [Review Best Practices](/blog/best-practices)",
            petFriendly: true,
            location: tripData.origin || "Origin City",
            coordinates: { lat: 0, lng: 0 }, // Placeholder
            cost: "Varies ($50-$200+)",
            type: 'preparation'
        });
        preDeparturePreparation.push({
            name: "Airline & Transport Confirmation",
            description: "Confirm pet booking with your airline. Review their specific check-in procedures and crate requirements. Arrange pet-friendly transport to the airport. [Check Airline Policies](/blog/airline-pet-policies)", // Placeholder for actual link
            petFriendly: true,
            location: tripData.origin || "Origin City",
            coordinates: { lat: 0, lng: 0 }, // Placeholder
            cost: "Varies",
            type: 'preparation'
        });
    }

    // --- Day 1: Arrival & Settling In (Refined) ---
    //console.log('[EnhancedItinerary API] Adding structured Day 1...');
    const day1Activities: Activity[] = [];
    const defaultCoords = destinationAirportCoords || { lat: 0, lng: 0 }; // Use airport or fallback

     // Pre-Flight Prep (Added)
    day1Activities.push({
      name: "Final Travel Prep",
      description: `Check flight status. Ensure all pet documents (vet certificates, airline forms) are easily accessible. Confirm airline's specific pet check-in procedure.`,
      petFriendly: true,
      location: tripData.origin, // Starts at origin
      coordinates: { lat: 0, lng: 0 }, // Placeholder for origin
      startTime: "08:00", // Example time, depends on flight
      endTime: "09:00",
      cost: "Free",
      type: 'preparation' // New type? Or activity? Using activity for now.
    });

    // Flight Arrival
    day1Activities.push({
      name: `Arrive in ${tripData.destination}`,
      description: `Flight from ${tripData.origin}. Proceed through immigration/customs (if applicable). Collect baggage and pet at designated area.`,
      petFriendly: true,
      location: `${tripData.destination} Airport Area`, // More specific location
      coordinates: defaultCoords,
      startTime: "11:00", // Example time
      endTime: "12:00",
      cost: "Flight cost varies",
      type: 'flight'
    });

    // Airport Transfer
    day1Activities.push({
      name: "Transfer to Accommodation",
      description: `Take pre-booked pet-friendly taxi/shuttle or arrange transport to ${accommodationName}. Check options like Uber Pet if available.`, // <-- Uber link placeholder
      petFriendly: true,
      location: tripData.destination,
      coordinates: defaultCoords, // Assume starts near airport
      startTime: "12:00",
      endTime: "13:00", // Adjust based on typical transfer time?
      cost: "$50 - $100",
      type: 'transfer'
    });

    // Hotel Check-in
    day1Activities.push({
      name: `Check-in: ${accommodationName}`,
      description: `Check into ${accommodationName}. Settle your pet in. Confirm pet policies and any designated relief areas with staff.`,
      petFriendly: true,
      location: recommendedAccommodationDetails?.vicinity || accommodationName, // Use details vicinity if available
      coordinates: primaryLocationCoords, // Use primary coords
      startTime: "14:00",
      endTime: "14:30",
      cost: "Accommodation cost varies",
      type: 'accommodation'
    });

    // Day 1 Lunch (Use nearby options or fallback search)
    let day1LunchActivity = getUniqueRestaurant(remainingRestaurantActivitiesPool);
    if (!day1LunchActivity) {
        //console.log('[EnhancedItinerary API] No restaurants left in pool for Day 1 lunch, searching nearby...');
        const nearbyLunchOptions = await searchGooglePlaces(`pet friendly restaurant near ${accommodationName}`, 'restaurant', primaryLocationCoords, 5000);
        if (nearbyLunchOptions.length > 0 && !usedActivityPlaceIds.has(nearbyLunchOptions[0].vicinity || nearbyLunchOptions[0].formatted_address)) {
            day1LunchActivity = placeToActivity(nearbyLunchOptions[0], 'meal');
            usedActivityPlaceIds.add(day1LunchActivity.location); // Mark as used
        } else {
           //console.log('[EnhancedItinerary API] No nearby restaurant found, using placeholder.');
            day1LunchActivity = { name: "Lunch Near Accommodation", description: "Find a nearby pet-friendly cafe or restaurant.", petFriendly: true, location: accommodationName, coordinates: primaryLocationCoords, startTime: "14:30", endTime: "15:30", cost: "$30 - $60", type: 'meal' };
        }
    }
    day1Activities.push({ ...day1LunchActivity, name: `Lunch: ${day1LunchActivity.name}`, startTime: "14:30", endTime: "15:30" });
    
    // Day 1 Afternoon Activity (Use nearby park/relaxing place or fallback search)
    let day1AfternoonActivity = getUniqueActivity(remainingInterestActivitiesPool);
    if (!day1AfternoonActivity || !['park', 'hiking'].some(type => day1AfternoonActivity!.description.toLowerCase().includes(type))) {
        //console.log('[EnhancedItinerary API] No suitable activity in pool for Day 1 afternoon, searching nearby park...');
         if(day1AfternoonActivity) remainingInterestActivitiesPool.unshift(day1AfternoonActivity); // Put back if not suitable
        const nearbyParkOptions = await searchGooglePlaces(`pet friendly park near ${accommodationName}`, 'park', primaryLocationCoords, 5000);
        if (nearbyParkOptions.length > 0 && !usedActivityPlaceIds.has(nearbyParkOptions[0].vicinity || nearbyParkOptions[0].formatted_address)) {
            day1AfternoonActivity = placeToActivity(nearbyParkOptions[0], 'activity');
            usedActivityPlaceIds.add(day1AfternoonActivity.location);
        } else {
            //console.log('[EnhancedItinerary API] No nearby park found, using placeholder.');
            day1AfternoonActivity = { name: `Morning Exploration in ${tripData.destination}`, description: "Settle in or take a short walk around your accommodation area.", petFriendly: true, location: tripData.destination, coordinates: primaryLocationCoords, startTime: "16:00", endTime: "17:30", cost: "Free", type: 'placeholder' };
        }
    }
    day1Activities.push({ ...day1AfternoonActivity, name: `Afternoon: ${day1AfternoonActivity.name}`, startTime: "16:00", endTime: "17:30" });

    // Day 1 Dinner (Use pool or fallback search)
    let day1DinnerActivity = getUniqueRestaurant(remainingRestaurantActivitiesPool);
    if (!day1DinnerActivity) {
        //console.log('[EnhancedItinerary API] No restaurants left in pool for Day 1 dinner, searching nearby...');
        const nearbyDinnerOptions = await searchGooglePlaces(`pet friendly restaurant near ${accommodationName}`, 'restaurant', primaryLocationCoords, 5000);
         // Find one not already used for lunch
        const dinnerOption = nearbyDinnerOptions.find(p => !usedActivityPlaceIds.has(p.vicinity || p.formatted_address));
        if (dinnerOption) {
            day1DinnerActivity = placeToActivity(dinnerOption, 'meal');
            usedActivityPlaceIds.add(day1DinnerActivity.location);
        } else {
            //console.log('[EnhancedItinerary API] No unused nearby restaurant found, using placeholder.');
            day1DinnerActivity = { name: "Dinner Near Accommodation", description: "Find a pet-friendly restaurant near your accommodation.", petFriendly: true, location: accommodationName, coordinates: primaryLocationCoords, startTime: "19:00", endTime: "20:30", cost: "$40 - $100", type: 'meal' };
        }
    }
    day1Activities.push({ ...day1DinnerActivity, name: `Dinner: ${day1DinnerActivity.name}`, startTime: "19:00", endTime: "20:30" });

    itinerary.days.push({
      day: currentDay,
      date: currentDate.toISOString().split('T')[0],
      city: tripData.destination,
      activities: day1Activities,
      travel: `Travel day from ${tripData.origin || 'Origin'} to ${tripData.destination}.`,
      narrative_intro: "Welcome to your destination!",
      narrative_outro: "Enjoy your stay!"
    });

    // --- Subsequent Days (with Fallback Searches) ---
    currentDay++;
    currentDate.setDate(currentDate.getDate() + 1);
    let currentCity = tripData.destination;
    let currentCoords = primaryLocationCoords;

    //console.log('[EnhancedItinerary API] Distributing remaining activities with fallbacks...');
    const activityDays = tripDays - 1; 
    
    const morningSlot = { start: "10:00", end: "13:00" };
    const afternoonSlot = { start: "15:00", end: "18:00" };
    const lunchSlot = { start: "13:00", end: "14:00" };
    const dinnerSlot = { start: "19:00", end: "20:30" };

    while (currentDay <= tripDays) {
        const dailyActivities: Activity[] = [];
        const dayData: { city: string; coords: { lat: number; lng: number } } = { city: currentCity, coords: currentCoords }; // Store current day's context
        
        // Helper to fetch details and convert/update Activity for the daily loop
        const getActivityWithDetails = async (input: Activity | string): Promise<Activity | null> => {
            let activity: Activity | null = null;
            let placeIdToFetch: string | undefined = undefined;

            if (typeof input === 'string') { // Input is a place_id
                placeIdToFetch = input;
            } else { // Input is an existing Activity object
                activity = input;
                // Only fetch if it seems like a place-based activity and lacks details
                if (activity.place_id && !activity.website && activity.type !== 'preparation' && activity.type !== 'placeholder' && activity.type !== 'flight' && activity.type !== 'transfer') {
                    placeIdToFetch = activity.place_id;
                }
            }

            // If no place_id to fetch and we don't have an activity object, return null
            if (!placeIdToFetch && !activity) return null;
            
            // If we have a placeId to fetch details for...
            if (placeIdToFetch) {
                 // Check cache first (e.g., for accommodation)
                if (placeIdToFetch === recommendedAccommodationDetails?.place_id) {
                    //console.log(`[EnhancedItinerary API] Using cached details for ${recommendedAccommodationDetails.name}`);
                    return placeToActivity(recommendedAccommodationDetails, activity?.type || 'activity');
                }
                
                // Fetch details
                //console.log(`[EnhancedItinerary API] Fetching details for placeId: ${placeIdToFetch}`);
                const details = await fetchPlaceDetails(placeIdToFetch);
                
                if (details) {
                    // Create/update activity using full details
                    return placeToActivity(details, activity?.type || 'activity'); 
                } else {
                    // If fetching details failed, return the original activity object if we had one, otherwise null
                    //console.warn(`[EnhancedItinerary API] Failed to get details for ${placeIdToFetch}.`);
                    return activity; 
                }
            }

            // If we didn't need to fetch details, just return the original activity
            return activity;
        };
        
        // --- Morning Activity --- 
        let morningPoolItem = getUniqueActivity(remainingInterestActivitiesPool);
        let morningAct: Activity | null = null; // Initialize as null
        if (morningPoolItem) { // Check if item exists before calling
            morningAct = await getActivityWithDetails(morningPoolItem);
        }
         
        if (!morningAct) {
            //console.log(`[EnhancedItinerary API] No activities in pool for Day ${currentDay} morning, searching fallback...`);
            const fallbackResults = await searchGooglePlaces(`pet friendly park or trail in ${dayData.city}`, 'park', dayData.coords, 10000);
            // Find the first unused result that HAS a place_id
            const fallbackOption = fallbackResults.find(p => p.place_id && !usedActivityPlaceIds.has(p.place_id)); 
            if (fallbackOption) { // Check if fallbackOption is found
                morningAct = await getActivityWithDetails(fallbackOption.place_id); // Pass place_id
                if (morningAct?.place_id) usedActivityPlaceIds.add(morningAct.place_id); // Mark as used
            } else {
                // Create placeholder only if still no activity
                morningAct = { 
                    name: `Morning Exploration in ${dayData.city}`, 
                    description: `Discover a local park or interesting street in ${dayData.city}.`, 
                    petFriendly: true, location: dayData.city, coordinates: dayData.coords, cost: "Free", type: 'placeholder', 
                    place_id: undefined, website: undefined, phone_number: undefined, opening_hours: undefined, photo_references: undefined, booking_link: undefined, pet_friendliness_details: "N/A", estimated_duration: 60 };
            }
        }
        // Ensure we only push if morningAct is not null
        if (morningAct) dailyActivities.push({ ...morningAct, startTime: morningSlot.start, endTime: morningSlot.end });

        // --- Lunch --- 
        let lunchPoolItem = getUniqueRestaurant(remainingRestaurantActivitiesPool);
        let lunchAct: Activity | null = null; // Initialize as null
        if (lunchPoolItem) { // Check if item exists
             lunchAct = await getActivityWithDetails(lunchPoolItem);
        }

        if (!lunchAct) {
            //console.log(`[EnhancedItinerary API] No restaurants in pool for Day ${currentDay} lunch, searching fallback...`);
            const fallbackResults = await searchGooglePlaces(`pet friendly cafe or restaurant in ${dayData.city}`, 'cafe', dayData.coords, 5000);
            // Find the first unused result that HAS a place_id
            const fallbackOption = fallbackResults.find(p => p.place_id && !usedActivityPlaceIds.has(p.place_id));
            if (fallbackOption) { // Check if found
                lunchAct = await getActivityWithDetails(fallbackOption.place_id); // Pass place_id
                if (lunchAct?.place_id) usedActivityPlaceIds.add(lunchAct.place_id);
            } else {
                 // Create placeholder only if still no activity
                 lunchAct = { name: `Lunch in ${dayData.city}`, description: `Find a local pet-friendly cafe or casual spot in ${dayData.city}.`, petFriendly: true, location: dayData.city, coordinates: dayData.coords, cost: "$30 - $60", type: 'meal', place_id: undefined, website: undefined, phone_number: undefined, opening_hours: undefined, photo_references: undefined, booking_link: undefined, pet_friendliness_details: "N/A", estimated_duration: 45 };
            }
        }
        // Ensure we only push if lunchAct is not null
         if (lunchAct) dailyActivities.push({ ...lunchAct, name: `Lunch: ${lunchAct.name}`, startTime: lunchSlot.start, endTime: lunchSlot.end });

        // --- Afternoon Activity --- 
        let afternoonPoolItem = getUniqueActivity(remainingInterestActivitiesPool);
        let afternoonAct: Activity | null = null; // Initialize as null
        if (afternoonPoolItem) { // Check if item exists
             afternoonAct = await getActivityWithDetails(afternoonPoolItem); // Pass Activity object
        }

         if (!afternoonAct) {
            //console.log(`[EnhancedItinerary API] No activities in pool for Day ${currentDay} afternoon, searching fallback...`);
             const fallbackResults = await searchGooglePlaces(`pet friendly things to do in ${dayData.city}`, 'point_of_interest', dayData.coords, 10000);
             // Find the first unused result that HAS a place_id
             const fallbackOption = fallbackResults.find(p => p.place_id && !usedActivityPlaceIds.has(p.place_id));
            if (fallbackOption) { // Check if found
                afternoonAct = await getActivityWithDetails(fallbackOption.place_id); // Pass place_id
                 if (afternoonAct?.place_id) usedActivityPlaceIds.add(afternoonAct.place_id);
            } else {
                 // Create placeholder only if still no activity
                 afternoonAct = { name: `Afternoon Relaxation in ${dayData.city}`, description: `Visit a pet-friendly shop or relax near your location in ${dayData.city}.`, petFriendly: true, location: dayData.city, coordinates: dayData.coords, cost: "Free", type: 'placeholder', place_id: undefined, website: undefined, phone_number: undefined, opening_hours: undefined, photo_references: undefined, booking_link: undefined, pet_friendliness_details: "N/A", estimated_duration: 90 };
            }
        }
        // Ensure we only push if afternoonAct is not null
        if (afternoonAct) dailyActivities.push({ ...afternoonAct, startTime: afternoonSlot.start, endTime: afternoonSlot.end });

        // --- Dinner --- 
         let dinnerPoolItem = getUniqueRestaurant(remainingRestaurantActivitiesPool);
         let dinnerAct: Activity | null = null; // Initialize as null
         if (dinnerPoolItem) { // Check if item exists
            dinnerAct = await getActivityWithDetails(dinnerPoolItem); // Pass Activity object
         }

        if (!dinnerAct) {
            //console.log(`[EnhancedItinerary API] No restaurants in pool for Day ${currentDay} dinner, searching fallback...`);
             const fallbackResults = await searchGooglePlaces(`pet friendly restaurant in ${dayData.city}`, 'restaurant', dayData.coords, 10000);
             // Find the first unused result that HAS a place_id
             const fallbackOption = fallbackResults.find(p => p.place_id && !usedActivityPlaceIds.has(p.place_id));
            if (fallbackOption) { // Check if found
                dinnerAct = await getActivityWithDetails(fallbackOption.place_id); // Pass place_id
                 if (dinnerAct?.place_id) usedActivityPlaceIds.add(dinnerAct.place_id);
            } else {
                // Create placeholder only if still no activity
                dinnerAct = { name: `Dinner in ${dayData.city}`, description: `Explore the local dining scene for a pet-friendly restaurant in ${dayData.city}.`, petFriendly: true, location: dayData.city, coordinates: dayData.coords, cost: "$40 - $100", type: 'meal', place_id: undefined, website: undefined, phone_number: undefined, opening_hours: undefined, photo_references: undefined, booking_link: undefined, pet_friendliness_details: "N/A", estimated_duration: 75 };
            }
        }
        // Ensure we only push if dinnerAct is not null
        if (dinnerAct) dailyActivities.push({ ...dinnerAct, name: `Dinner: ${dinnerAct.name}`, startTime: dinnerSlot.start, endTime: dinnerSlot.end });

        // Add Last Day Specific Activities if applicable (Keep existing logic, details not needed for these prep/transfer activities)
        if (currentDay === tripDays && tripData.pets > 0) {
            // ... existing logic for final vet check and airport transfer ...
            // Ensure placeholder activities added here also have default values for new fields if necessary
             dailyActivities.unshift({
               name: "Final Vet Check (Optional but Recommended)",
               description: "If your trip exceeded ~10-14 days or required specific entry paperwork, consider a final vet visit for a health check/certificate for your return or onward travel. [Review Best Practices](/blog/best-practices)",
               petFriendly: true, location: currentCity, coordinates: { lat: 0, lng: 0 }, 
               startTime: "09:00", endTime: "10:00", cost: "Varies ($50-$150+)", type: 'preparation',
               place_id: undefined, website: undefined, phone_number: undefined, opening_hours: undefined, photo_references: undefined, booking_link: undefined, pet_friendliness_details: "N/A", estimated_duration: 60
             });
             dailyActivities.push({
               name: "Transfer to Departure Airport",
               description: `Head to the airport for your departure. Arrange pet-friendly transport in advance (e.g., [Uber Pet](https://www.uber.com/us/en/ride/uberpet/)).`,
               petFriendly: true, location: currentCity, coordinates: { lat: 0, lng: 0 }, 
               startTime: "16:00", endTime: "17:00", cost: "$50 - $100", type: 'transfer',
               place_id: undefined, website: undefined, phone_number: undefined, opening_hours: undefined, photo_references: undefined, booking_link: undefined, pet_friendliness_details: "N/A", estimated_duration: 60
             });
        }

        //console.log(`[EnhancedItinerary API] Adding Day ${currentDay} with ${dailyActivities.length} activities...`);
        itinerary.days.push({
            day: currentDay,
            date: currentDate.toISOString().split('T')[0],
            city: currentCity,
            activities: dailyActivities,
            // Narratives will be added by LLM later
            narrative_intro: undefined, // Placeholder
            narrative_outro: undefined  // Placeholder
        });

        currentDay++;
        currentDate.setDate(currentDate.getDate() + 1);

        // Basic logic for switching city (Refine later with Geocoding + Search Rerun)
        // TODO: Implement step 4 properly (Geocoding, Search Rerun)
        // ... existing city switching logic ...
    }

    // --- Step 5: Enhance Descriptions & Add Narratives with OpenAI --- 
    //console.log('[EnhancedItinerary API] Enhancing descriptions and adding narratives with OpenAI...');
    try {
        const enhancedDaysPromises = itinerary.days.map(async (day) => {
            // Enhance activity descriptions for the current day
            const enhancedActivitiesPromises = day.activities.map(async (activity) => {
                // Skip enhancement for certain types or if description seems sufficient
                if (activity.type === 'placeholder' || activity.type === 'preparation' || activity.type === 'flight' || activity.type === 'transfer' || activity.description?.length > 150) {
                    return activity; // Return original activity
                }

                // Prepare context for the prompt
                const interestsString = tripData.interests.join(', ') || 'general travel';
                const preferencesString = userPreferences.length > 0 ? `User preferences: ${userPreferences.join(', ')}.` : 'No specific preferences mentioned.';
                const petFriendlinessInfo = activity.pet_friendliness_details || "No specific pet friendliness details available.";
                const existingDesc = activity.description || 'Activity/Place'; // Use existing basic desc as context
                
                const descriptionPrompt = `You are writing a concise pet travel itinerary description for a user interested in ${interestsString}. 
Generate a short, engaging, pet-friendly description (1-2 sentences, max 200 chars) for the following activity. Use simple city names (e.g., 'Paris' not 'Paris, France').
 Name: ${activity.name}
 Type/Context: ${existingDesc}
 Location: ${activity.location}
${preferencesString}
Pet Friendliness Notes: ${petFriendlinessInfo}
Focus on the experience and highlight pet-friendly aspects if relevant and positive based on the notes. Be concise and appealing. Do not include the original type/context in your response. Do not add greetings or signoffs. Output only the description text.`;

                try {
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: descriptionPrompt }],
                        temperature: 0.6,
                        max_tokens: 60,
                    });
                    const newDescription = completion.choices[0]?.message?.content?.trim();
                    if (newDescription) {
                        //console.log(`[EnhancedItinerary API] Enhanced description for ${activity.name}: ${newDescription}`);
                        return { ...activity, description: newDescription }; // Return activity with updated description
                    } else {
                        //console.warn(`[EnhancedItinerary API] OpenAI returned empty description for ${activity.name}`);
                        return activity; // Return original on empty response
                    }
                } catch (error) {
                    console.error(`[EnhancedItinerary API] Error enhancing description for ${activity.name}:`, error);
                    return activity; // Return original activity on error
                }
            });

            // Generate Intro Narrative for the day
            const activityNames = day.activities.map(a => a.name).join(', ');
            const introPrompt = `Write a brief, thematic 1-sentence introduction for Day ${day.day} of a pet-friendly trip to ${day.city}. Use simple city names (e.g., 'Paris' not 'Paris, France'). Activities include: ${activityNames}. Focus on the vibe or main theme. Max 150 chars. Output only the sentence.`;
            let narrativeIntro = day.narrative_intro; // Keep placeholder if LLM fails
            try {
                const introCompletion = await openai.chat.completions.create({
                     model: "gpt-4o-mini",
                     messages: [{ role: "user", content: introPrompt }],
                     temperature: 0.7,
                     max_tokens: 50,
                 });
                 narrativeIntro = introCompletion.choices[0]?.message?.content?.trim() || narrativeIntro;
            } catch (error) {
                 console.error(`[EnhancedItinerary API] Error generating intro narrative for Day ${day.day}:`, error);
            }
            
             // Generate Outro Narrative for the day
            const outroPrompt = `Write a brief, positive 1-sentence closing remark for Day ${day.day} of a pet-friendly trip to ${day.city}. Use simple city names (e.g., 'Paris' not 'Paris, France'). Activities include: ${activityNames}. Max 150 chars. Output only the sentence.`;
            let narrativeOutro = day.narrative_outro; // Keep placeholder if LLM fails
             try {
                 const outroCompletion = await openai.chat.completions.create({
                      model: "gpt-4o-mini",
                      messages: [{ role: "user", content: outroPrompt }],
                      temperature: 0.7,
                      max_tokens: 50,
                  });
                  narrativeOutro = outroCompletion.choices[0]?.message?.content?.trim() || narrativeOutro;
             } catch (error) {
                  console.error(`[EnhancedItinerary API] Error generating outro narrative for Day ${day.day}:`, error);
             }

            // Wait for all activity descriptions for the current day to be processed
            const enhancedActivities = await Promise.all(enhancedActivitiesPromises);
            
            // --- Step 3e: Refine Scheduling with OpenAI ---
            let scheduledActivities = enhancedActivities; // Default to original order if scheduling fails
            if (enhancedActivities.length > 1) { // Only schedule if there's more than one activity
                 // Prepare data for scheduling prompt
                const activitiesForScheduling = enhancedActivities.map(act => ({ 
                     name: act.name, 
                     location: act.location,
                     coordinates: act.coordinates,
                     estimated_duration: act.estimated_duration || 60, // Default if missing
                     type: act.type
                 }));
                
                const schedulingPrompt = `You are a travel planner creating a pet-friendly itinerary for Day ${day.day} in ${day.city}. 
The user's budget level is ${tripData.budget} and preferences include: [${userPreferences.join(', ') || 'None specified'}].
Arrange these activities in a logical sequence, starting around 9:30 AM. Minimize travel between locations. Include estimated travel time (briefly, e.g., "(15 min travel)"). 
Ensure activities are spaced reasonably. Consider lunch around 12-2 PM and dinner around 6-8 PM (if meal activities exist).
Activities list (with estimated duration in minutes):
${JSON.stringify(activitiesForScheduling, null, 2)}
Output ONLY a valid JSON array of the activity objects, in the scheduled order, with added 'startTime' and 'endTime' fields (HH:MM format). Example object: {"name": "...", "startTime": "10:00", "endTime": "11:30"}. Do not include coordinates or other fields not present in the example.`;

                try {
                    const scheduleCompletion = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        messages: [{ role: "user", content: schedulingPrompt }],
                        response_format: { type: "json_object" },
                        temperature: 0.4,
                        max_tokens: 1024, // Allow more tokens for potentially longer JSON
                    });
                    
                    const rawScheduleResponse = scheduleCompletion.choices[0]?.message?.content;
                    if (rawScheduleResponse) {
                        //console.log(`[EnhancedItinerary API] Raw schedule response for Day ${day.day}:`, rawScheduleResponse);
                        try {
                            let parsedSchedule = JSON.parse(rawScheduleResponse);
                            // Handle potential nesting like {"schedule": [...]} 
                            if (typeof parsedSchedule === 'object' && parsedSchedule !== null && !Array.isArray(parsedSchedule)) {
                                const key = Object.keys(parsedSchedule)[0];
                                if (key && Array.isArray(parsedSchedule[key])) {
                                    parsedSchedule = parsedSchedule[key];
                                }
                            }

                            if (Array.isArray(parsedSchedule) && parsedSchedule.length === enhancedActivities.length) {
                                // Create a map for quick lookup
                                const originalActivitiesMap = new Map(enhancedActivities.map(act => [act.name, act]));
                                
                                // Reconstruct the activities array with timing from LLM
                                const tempScheduledActivities: Activity[] = [];
                                let schedulingApplied = true;
                                for (const scheduledItem of parsedSchedule) {
                                    const originalActivity = originalActivitiesMap.get(scheduledItem.name);
                                    if (originalActivity && scheduledItem.startTime && scheduledItem.endTime) {
                                        tempScheduledActivities.push({ 
                                             ...originalActivity, 
                                             startTime: scheduledItem.startTime, 
                                             endTime: scheduledItem.endTime 
                                         });
                                    } else {
                                        //console.warn(`[EnhancedItinerary API] Scheduling mismatch for Day ${day.day}: Item "${scheduledItem.name}" not found or missing times. Reverting to original order for this day.`);
                                        schedulingApplied = false;
                                        break; // Exit loop if any item is bad
                                    }
                                }
                                
                                if (schedulingApplied) {
                                     scheduledActivities = tempScheduledActivities;
                                     //console.log(`[EnhancedItinerary API] Successfully applied LLM scheduling for Day ${day.day}.`);
                                }
                                
                            } else {
                               // console.warn(`[EnhancedItinerary API] Parsed schedule for Day ${day.day} is not a valid array or length mismatch.`);
                            }
                        } catch (parseError) {
                            //console.error(`[EnhancedItinerary API] Failed to parse schedule JSON for Day ${day.day}:`, parseError, 'Raw content:', rawScheduleResponse);
                        }
                    } else {
                        //console.warn(`[EnhancedItinerary API] OpenAI returned empty schedule for Day ${day.day}.`);
                    }
                } catch (error) {
                    console.error(`[EnhancedItinerary API] Error getting schedule for Day ${day.day}:`, error);
                }
            } // End if enhancedActivities.length > 1
            
            // Return the day object with enhanced activities (now potentially timed) and narratives
            return { ...day, activities: scheduledActivities, narrative_intro: narrativeIntro, narrative_outro: narrativeOutro };
        });

        // Wait for all days to be processed
        const enhancedItineraryDays = await Promise.all(enhancedDaysPromises);
        itinerary.days = enhancedItineraryDays; // Update the main itinerary object

        //console.log('[EnhancedItinerary API] Descriptions and narratives enhanced.');
    } catch (error) {
        console.error('[EnhancedItinerary API] Error during OpenAI enhancement phase:', error);
        // Proceed with the non-enhanced itinerary if this phase fails
    }

    // --- Step 6: Return Success Response --- 
    console.log('[EnhancedItinerary API] Successfully generated structured itinerary.');
    return NextResponse.json(
      {
        itinerary: itinerary,
        policyRequirements: policyRequirements,
        generalPreparation: generalPreparation,
        preDeparturePreparation: preDeparturePreparation,
        destinationSlug: destinationSlug 
      },
      { status: 200 }
    );

  } catch (error) {
    //console.error('[EnhancedItinerary API] Internal Server Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An internal server error occurred during itinerary generation.' },
      { status: 500 }
    );
  }
}

// --- Helper Function for Price Level ---
function placePriceLevelToCost(priceLevel: number | undefined): string {
    if (priceLevel === undefined) return "$30 - $60"; // Default if undefined
    if (priceLevel <= 1) return "$ - $"; // Inexpensive
    else if (priceLevel === 2) return "$$ - $$"; // Moderate
    else if (priceLevel === 3) return "$$$ - $$$$"; // Expensive
    else if (priceLevel >= 4) return "$$$$+"; // Very Expensive
    return "$30 - $60"; // Fallback
}