'use server';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

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
}

interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  activities: Activity[];
  preparation?: Array<{ requirement: string; details: string }>;
  travel?: string;
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

    // --- Step 2: Fetch External Data (Policies, Places) --- 
    console.log('[EnhancedItinerary API] Fetching pet policies...');
    const supabase = await createClient();
    const { data: petPolicies, error: policyError } = await supabase
      .from('pet_policies')
      .select('*')
      .eq('country_name', tripData.destinationCountry)
      .single();

    if (policyError) {
      //console.warn('[EnhancedItinerary API] Warning: Error querying pet_policies:', policyError);
    } else if (petPolicies) {
      //console.log('[EnhancedItinerary API] Fetched pet_policies data for:', tripData.destinationCountry);
    } else {
      //console.log('[EnhancedItinerary API] No specific pet policies found for:', tripData.destinationCountry);
    }

    // Format preparation requirements and extract structured entry requirements
    //console.log('[EnhancedItinerary API] Formatting preparation requirements...');
    const preparation: Array<{ requirement: string; details: string }> = [];
    let policyRequirements: Array<{ step: number; label: string; text: string }> = [];

    if (petPolicies) {
      const policy: PetPolicy = petPolicies;

      if (policy.entry_requirements && Array.isArray(policy.entry_requirements)) {
        //console.log('[EnhancedItinerary API] Extracting structured entry_requirements:', policy.entry_requirements.length, 'steps');
        policyRequirements = policy.entry_requirements
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
          //console.log('[EnhancedItinerary API] Parsed policyRequirements:', policyRequirements);
      } else if (policy.entry_requirements) {
        //console.warn('[EnhancedItinerary API] entry_requirements field exists but is not a valid array:', typeof policy.entry_requirements);
        preparation.push({
             requirement: 'Entry Requirements Note',
             details: 'Could not parse specific entry requirement steps. Please refer to official sources.'
         });
      } else {
         //console.log('[EnhancedItinerary API] No entry_requirements field found in policy data.');
      }

      if (policy.quarantine_info) {
        //console.log('[EnhancedItinerary API] Adding quarantine_info:', policy.quarantine_info);
        preparation.push({
          requirement: 'Quarantine Info',
          details: policy.quarantine_info,
        });
      }

      if (policy.additional_info) {
        //console.log('[EnhancedItinerary API] Parsing additional_info:', policy.additional_info);
        Object.entries(policy.additional_info).forEach(([key, value]) => {
          preparation.push({
            requirement: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            details: value,
          });
        });
      }

      if (policy.external_link) {
        //console.log('[EnhancedItinerary API] Adding external_link:', policy.external_link);
        preparation.push({
          requirement: 'More Information',
          details: `Official Resource: ${policy.external_link}`,
        });
      }
      if (policy.external_links) {
        //console.log('[EnhancedItinerary API] Parsing external_links:', policy.external_links);
        Object.entries(policy.external_links).forEach(([key, value]) => {
          preparation.push({
            requirement: `Additional Resource (${key})`,
            details: value,
          });
        });
      }
    } else {
      //console.log('[EnhancedItinerary API] No pet policies found, adding fallback general message');
      preparation.push({
        requirement: 'Check Requirements',
        details: `Please check the latest pet entry requirements for ${tripData.destinationCountry}.`,
      });
    }
    //console.log('[EnhancedItinerary API] General preparation requirements:', preparation);
    //console.log('[EnhancedItinerary API] Structured policy requirements:', policyRequirements);

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
    let accommodationCoords = destinationAirportCoords; // Default to airport initially
    if (tripData.accommodation && tripData.accommodation !== 'Flexible') {
        const accommodationQuery = `pet friendly ${tripData.accommodation.toLowerCase()} in ${tripData.destination}`;
        // Bias search near airport first, or just general destination if no airport coords
        const accommodationOptions = await searchGooglePlaces(accommodationQuery, 'lodging', destinationAirportCoords || undefined, 20000); 
        if (accommodationOptions.length > 0 && accommodationOptions[0].geometry?.location) {
            recommendedAccommodation = accommodationOptions[0];
            accommodationCoords = recommendedAccommodation.geometry.location; // Update coords to hotel location
            //console.log(`[EnhancedItinerary API] Recommended accommodation: ${recommendedAccommodation.name} at`, accommodationCoords);
        } else {
            //console.warn(`[EnhancedItinerary API] No specific ${tripData.accommodation} found near airport/destination.`);
            // If no hotel found near airport, try geocoding destination center as fallback? (future enhancement)
        }
    } else {
        //console.log(`[EnhancedItinerary API] Accommodation preference is Flexible or not set.`);
    }
    // Use accommodation coords if found, otherwise stick with airport coords, finally fallback to 0,0
    const primaryLocationCoords = accommodationCoords || destinationAirportCoords || { lat: 0, lng: 0 }; 
    const accommodationName = recommendedAccommodation?.name || tripData.accommodation || "Your Accommodation";
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

    // Helper to convert a Place to an Activity
    const placeToActivity = (place: Place, type: Activity['type'] = 'activity'): Activity => {
         let description = place.types ? place.types.map(t => t.replace(/_/g, ' ')).join(', ') : (type === 'meal' ? 'Restaurant/Cafe' : 'Attraction');
         // Add rating if available
         // if (place.rating) { description += ` (Rating: ${place.rating}${place.user_ratings_total ? ` / ${place.user_ratings_total} reviews` : ''})`; }
         return {
            name: place.name || (type === 'meal' ? 'Pet-Friendly Meal Spot' : 'Interesting Place'),
            description: description,
            petFriendly: true, // Assumed true for places fetched by pet-friendly queries
            location: place.vicinity || place.formatted_address || tripData.destination,
            coordinates: place.geometry?.location || { lat: 0, lng: 0 },
            cost: placePriceLevelToCost(place.price_level), // Use helper
            type: type
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
      location: recommendedAccommodation?.vicinity || accommodationName,
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
            day1AfternoonActivity = { name: "Relax or Local Walk", description: "Settle in or take a short walk around your accommodation area.", petFriendly: true, location: accommodationName, coordinates: primaryLocationCoords, startTime: "16:00", endTime: "17:30", cost: "Free", type: 'placeholder' };
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
      travel: `Travel day from ${tripData.origin || 'Origin'} to ${tripData.destination}.`
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
        
        // --- Morning Activity --- 
        let morningAct = getUniqueActivity(remainingInterestActivitiesPool);
        if (!morningAct) {
            //console.log(`[EnhancedItinerary API] No activities in pool for Day ${currentDay} morning, searching fallback...`);
            const fallbackResults = await searchGooglePlaces(`pet friendly park or trail in ${currentCity}`, 'park', currentCoords, 10000);
            const fallbackOption = fallbackResults.find(p => !usedActivityPlaceIds.has(p.vicinity || p.formatted_address));
            if (fallbackOption) {
                morningAct = placeToActivity(fallbackOption, 'activity');
                usedActivityPlaceIds.add(morningAct.location);
            } else {
                morningAct = { name: 'Morning Exploration', description: `Discover a local park or interesting street in ${currentCity}.`, petFriendly: true, location: currentCity, coordinates: currentCoords, cost: "Free", type: 'placeholder'};
            }
        }
        dailyActivities.push({ ...morningAct, startTime: morningSlot.start, endTime: morningSlot.end });

        // --- Lunch --- 
        let lunchAct = getUniqueRestaurant(remainingRestaurantActivitiesPool);
        if (!lunchAct) {
            //console.log(`[EnhancedItinerary API] No restaurants in pool for Day ${currentDay} lunch, searching fallback...`);
            const fallbackResults = await searchGooglePlaces(`pet friendly cafe or restaurant in ${currentCity}`, 'cafe', currentCoords, 5000);
            const fallbackOption = fallbackResults.find(p => !usedActivityPlaceIds.has(p.vicinity || p.formatted_address));
            if (fallbackOption) {
                lunchAct = placeToActivity(fallbackOption, 'meal');
                usedActivityPlaceIds.add(lunchAct.location);
            } else {
                 lunchAct = { name: 'Lunch', description: `Find a local pet-friendly cafe or casual spot in ${currentCity}.`, petFriendly: true, location: currentCity, coordinates: currentCoords, cost: "$30 - $60", type: 'meal'};
            }
        }
         dailyActivities.push({ ...lunchAct, name: `Lunch: ${lunchAct.name}`, startTime: lunchSlot.start, endTime: lunchSlot.end });

        // --- Afternoon Activity --- 
        let afternoonAct = getUniqueActivity(remainingInterestActivitiesPool);
         if (!afternoonAct) {
            //console.log(`[EnhancedItinerary API] No activities in pool for Day ${currentDay} afternoon, searching fallback...`);
             const fallbackResults = await searchGooglePlaces(`pet friendly things to do in ${currentCity}`, 'point_of_interest', currentCoords, 10000);
             const fallbackOption = fallbackResults.find(p => !usedActivityPlaceIds.has(p.vicinity || p.formatted_address));
            if (fallbackOption) {
                afternoonAct = placeToActivity(fallbackOption, 'activity');
                usedActivityPlaceIds.add(afternoonAct.location);
            } else {
                 afternoonAct = { name: 'Afternoon Relaxation', description: `Visit a pet-friendly shop or relax near your location in ${currentCity}.`, petFriendly: true, location: currentCity, coordinates: currentCoords, cost: "Free", type: 'placeholder'};
            }
        }
        dailyActivities.push({ ...afternoonAct, startTime: afternoonSlot.start, endTime: afternoonSlot.end });

        // --- Dinner --- 
        let dinnerAct = getUniqueRestaurant(remainingRestaurantActivitiesPool);
        if (!dinnerAct) {
            //console.log(`[EnhancedItinerary API] No restaurants in pool for Day ${currentDay} dinner, searching fallback...`);
             const fallbackResults = await searchGooglePlaces(`pet friendly restaurant in ${currentCity}`, 'restaurant', currentCoords, 10000);
             const fallbackOption = fallbackResults.find(p => !usedActivityPlaceIds.has(p.vicinity || p.formatted_address));
            if (fallbackOption) {
                dinnerAct = placeToActivity(fallbackOption, 'meal');
                usedActivityPlaceIds.add(dinnerAct.location);
            } else {
                dinnerAct = { name: 'Dinner', description: `Explore the local dining scene for a pet-friendly restaurant in ${currentCity}.`, petFriendly: true, location: currentCity, coordinates: currentCoords, cost: "$40 - $100", type: 'meal'};
            }
        }
        dailyActivities.push({ ...dinnerAct, name: `Dinner: ${dinnerAct.name}`, startTime: dinnerSlot.start, endTime: dinnerSlot.end });

        // Add Last Day Specific Activities if applicable
        if (currentDay === tripDays && tripData.pets > 0) {
            //console.log(`[EnhancedItinerary API] Adding final day preparations for Day ${currentDay}...`);

             // Prepend Vet Visit
             dailyActivities.unshift({
               name: "Final Vet Check (Optional but Recommended)",
               description: "If your trip exceeded ~10-14 days or required specific entry paperwork, consider a final vet visit for a health check/certificate for your return or onward travel. [Review Best Practices](/blog/best-practices)",
               petFriendly: true,
               location: currentCity,
               coordinates: { lat: 0, lng: 0 }, // Placeholder
               startTime: "09:00",
               endTime: "10:00",
               cost: "Varies ($50-$150+)",
               type: 'preparation'
             });

             // Append Airport Transfer
             dailyActivities.push({
               name: "Transfer to Departure Airport",
               description: `Head to the airport for your departure. Arrange pet-friendly transport in advance. Check options like Uber Pet if available.`, // <-- Uber link placeholder
               petFriendly: true,
               location: currentCity,
               coordinates: { lat: 0, lng: 0 }, // Placeholder - Ideally airport coords
               startTime: "16:00", // Example - adjust based on flight
               endTime: "17:00",
               cost: "$50 - $100",
               type: 'transfer'
             });
        }

        //console.log(`[EnhancedItinerary API] Adding Day ${currentDay} with ${dailyActivities.length} activities...`);
        itinerary.days.push({
            day: currentDay,
            date: currentDate.toISOString().split('T')[0],
            city: currentCity,
            activities: dailyActivities,
        });

        currentDay++;
        currentDate.setDate(currentDate.getDate() + 1);

        // Basic logic for switching city (can be improved)
        // TODO: Implement better city switching and fetch/filter activities for new city
        if (tripData.additionalCities && tripData.additionalCities.length > 0 && currentDay > Math.floor(tripDays / (tripData.additionalCities.length + 1)) + 1) {
            // This logic needs refinement to handle multiple additional cities and refetching data
            if (currentCity === tripData.destination && tripData.additionalCities[0]) {
                currentCity = tripData.additionalCities[0];
                //console.log(`[EnhancedItinerary API] Switching city focus to: ${currentCity} (Data refetching TBD)`);
                // Reset pools (simplistic - ideally refetch based on new city)
                // remainingInterestActivitiesPool = []; 
                // remainingRestaurantActivitiesPool = []; 
                // Need to update currentCoords based on the new city (e.g., geocode)
                 currentCoords = { lat: 0, lng: 0 }; // Placeholder
            } 
        }
    }

    // --- Return Success Response --- 
    //console.log('[EnhancedItinerary API] Successfully generated structured itinerary.');
    return NextResponse.json(
      {
        itinerary: itinerary,
        policyRequirements: policyRequirements,
        generalPreparation: preparation,
        preDeparturePreparation: preDeparturePreparation // Include pre-departure steps
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