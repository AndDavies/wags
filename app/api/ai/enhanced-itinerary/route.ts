'use server';

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log('[EnhancedItinerary API] OpenAI API Key (partial):', process.env.OPENAI_API_KEY?.slice(0, 5) + '...');

// Initialize Google Places API client (using Fetch for simplicity)
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
console.log('[EnhancedItinerary API] Google Places API Key (partial):', GOOGLE_PLACES_API_KEY?.slice(0, 5) + '...');
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
  console.log('[EnhancedItinerary API] Received POST request');
  let tripData: TripData;

  try {
    // --- Step 1: Parse and Validate Input --- 
    console.log('[EnhancedItinerary API] Parsing request body...');
    try {
      tripData = await request.json();
      console.log('[EnhancedItinerary API] Request body parsed:', tripData);
    } catch (parseError) {
      console.error('[EnhancedItinerary API] Failed to parse request JSON:', parseError);
      return NextResponse.json({ error: 'Invalid request body: Malformed JSON.' }, { status: 400 });
    }

    console.log('[EnhancedItinerary API] Validating required fields...');
    const requiredFields = ['origin', 'originCountry', 'destination', 'destinationCountry', 'startDate', 'endDate', 'adults', 'budget', 'accommodation', 'interests'];
    const missingFields = requiredFields.filter(field => !(tripData as any)[field]);
    if (missingFields.length > 0) {
      console.error('[EnhancedItinerary API] Validation failed:', missingFields);
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
    console.log('[EnhancedItinerary API] Calculating trip duration...');
    const startDate = new Date(tripData.startDate);
    const endDate = new Date(tripData.endDate);
    const tripDays =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (tripDays < 1) {
      console.error('[EnhancedItinerary API] Invalid trip dates:', tripData.startDate, tripData.endDate);
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
      console.warn('[EnhancedItinerary API] Warning: Error querying pet_policies:', policyError);
    } else if (petPolicies) {
      console.log('[EnhancedItinerary API] Fetched pet_policies data for:', tripData.destinationCountry);
    } else {
      console.log('[EnhancedItinerary API] No specific pet policies found for:', tripData.destinationCountry);
    }

    // Format preparation requirements and extract structured entry requirements
    console.log('[EnhancedItinerary API] Formatting preparation requirements...');
    const preparation: Array<{ requirement: string; details: string }> = [];
    let policyRequirements: Array<{ step: number; label: string; text: string }> = [];

    if (petPolicies) {
      const policy: PetPolicy = petPolicies;

      if (policy.entry_requirements && Array.isArray(policy.entry_requirements)) {
        console.log('[EnhancedItinerary API] Extracting structured entry_requirements:', policy.entry_requirements.length, 'steps');
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
          console.log('[EnhancedItinerary API] Parsed policyRequirements:', policyRequirements);
      } else if (policy.entry_requirements) {
        console.warn('[EnhancedItinerary API] entry_requirements field exists but is not a valid array:', typeof policy.entry_requirements);
        preparation.push({
             requirement: 'Entry Requirements Note',
             details: 'Could not parse specific entry requirement steps. Please refer to official sources.'
         });
      } else {
         console.log('[EnhancedItinerary API] No entry_requirements field found in policy data.');
      }

      if (policy.quarantine_info) {
        console.log('[EnhancedItinerary API] Adding quarantine_info:', policy.quarantine_info);
        preparation.push({
          requirement: 'Quarantine Info',
          details: policy.quarantine_info,
        });
      }

      if (policy.additional_info) {
        console.log('[EnhancedItinerary API] Parsing additional_info:', policy.additional_info);
        Object.entries(policy.additional_info).forEach(([key, value]) => {
          preparation.push({
            requirement: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            details: value,
          });
        });
      }

      if (policy.external_link) {
        console.log('[EnhancedItinerary API] Adding external_link:', policy.external_link);
        preparation.push({
          requirement: 'More Information',
          details: `Official Resource: ${policy.external_link}`,
        });
      }
      if (policy.external_links) {
        console.log('[EnhancedItinerary API] Parsing external_links:', policy.external_links);
        Object.entries(policy.external_links).forEach(([key, value]) => {
          preparation.push({
            requirement: `Additional Resource (${key})`,
            details: value,
          });
        });
      }
    } else {
      console.log('[EnhancedItinerary API] No pet policies found, adding fallback general message');
      preparation.push({
        requirement: 'Check Requirements',
        details: `Please check the latest pet entry requirements for ${tripData.destinationCountry}.`,
      });
    }
    console.log('[EnhancedItinerary API] General preparation requirements:', preparation);
    console.log('[EnhancedItinerary API] Structured policy requirements:', policyRequirements);

    // --- Step 3: Fetch Richer Data from Google Places ---

    // Function to perform Places API Text Search, now with optional location bias
    const searchGooglePlaces = async (
        query: string,
        type?: string,
        location?: { lat: number; lng: number },
        radius?: number // Radius in meters
    ): Promise<Place[]> => {
        console.log(`[EnhancedItinerary API] Querying Places: ${query} ${type ? `(Type: ${type})` : ''}${location ? ` near (${location.lat}, ${location.lng})` : ''}`);
        let url = `${PLACES_API_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
        if (type) {
            url += `&type=${type}`;
        }
        if (location && radius) {
             // Add location bias for more relevant local results
             url += `&location=${location.lat},${location.lng}&radius=${radius}`;
             console.log(`[EnhancedItinerary API] Applying location bias: ${location.lat},${location.lng} with radius ${radius}m`);
        }
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok || data.status !== 'OK') {
                console.warn(`[EnhancedItinerary API] Google Places API error for query "${query}": ${data.status} - ${data.error_message || response.statusText}`);
                return [];
            }
            console.log(`[EnhancedItinerary API] Places found for query "${query}": ${data.results?.length || 0}`);
            return data.results || [];
        } catch (error) {
            console.error(`[EnhancedItinerary API] Network error fetching places for query "${query}":`, error);
            return [];
        }
    };

    // Fetch Destination Airport Coordinates (Best effort)
    let destinationAirportCoords: { lat: number; lng: number } | null = null;
    const airportResults = await searchGooglePlaces(`${tripData.destination} airport`, 'airport');
    if (airportResults.length > 0) {
        destinationAirportCoords = airportResults[0].geometry.location;
        console.log('[EnhancedItinerary API] Found destination airport coordinates:', destinationAirportCoords);
    } else {
        console.warn('[EnhancedItinerary API] Could not find coordinates for destination airport.');
        // Fallback: Geocode destination city (could add later if needed)
    }
    
    // Fetch Pet-Friendly Restaurants
    const restaurantQuery = `pet friendly restaurants in ${tripData.destination}`;
    const petFriendlyRestaurants = await searchGooglePlaces(restaurantQuery, 'restaurant');

    // Fetch Accommodation based on user preference
    let accommodationOptions: Place[] = [];
    let recommendedAccommodation: Place | null = null;
    if (tripData.accommodation && tripData.accommodation !== 'Flexible') {
        const accommodationQuery = `pet friendly ${tripData.accommodation.toLowerCase()} in ${tripData.destination}`;
        accommodationOptions = await searchGooglePlaces(accommodationQuery, 'lodging', destinationAirportCoords || undefined, 20000); // Wider radius from airport or city center
        if (accommodationOptions.length > 0) {
            // Basic selection: pick the first result for now.
            // Future: Could use rating, price_level, or proximity to city center if geocoded.
            recommendedAccommodation = accommodationOptions[0];
            console.log(`[EnhancedItinerary API] Recommended accommodation: ${recommendedAccommodation.name}`);
        } else {
            console.warn(`[EnhancedItinerary API] No specific ${tripData.accommodation} found, will use generic check-in.`);
        }
    } else {
        console.log(`[EnhancedItinerary API] Accommodation preference is Flexible or not set, skipping specific search.`);
    }
    const accommodationCoords = recommendedAccommodation?.geometry?.location || destinationAirportCoords || { lat: 0, lng: 0 }; // Use hotel, airport, or fallback coords
    const accommodationName = recommendedAccommodation?.name || tripData.accommodation || "Your Accommodation";

    // Fetch Activities based on Interests
    console.log('[EnhancedItinerary API] Fetching activities based on interests...');
    const interestBasedActivities: Activity[] = [];
    const MAX_ACTIVITIES_PER_INTEREST = 5; // Limit results per interest
    const activitiesPerDayGoal = 2; // Target non-meal activities per day
    const totalActivitiesNeeded = Math.max(0, (tripDays - 1) * activitiesPerDayGoal); // Calculate total needed (min 0)
    
    // Map interests to Google Places API keywords (keep existing map)
    const interestToQuery: { [key: string]: string } = {
        Sightseeing: 'tourist_attraction', // Use specific types
        'Outdoor Adventures': 'park hiking',
        Sports: 'stadium sports_complex',
        'Food Tours': 'restaurant cafe', // Already handled partly by restaurant search
        Museums: 'museum art_gallery',
        Shopping: 'shopping_mall market clothing_store',
        'Spa and Wellness': 'spa',
        'Local Experiences': 'tourist_attraction landmark', // Broader category
        Photography: 'tourist_attraction park',
        'Wildlife Viewing': 'zoo aquarium park',
        'Water Activities': 'beach amusement_park', // Adjust as needed
        Nightlife: 'bar night_club',
        'Historical Sites': 'landmark historical_landmark',
        'Cultural Events': 'performing_arts_theater museum', // Approximate
        Other: 'point_of_interest', // Generic fallback
    };

    const fetchedPlaceIds = new Set<string>(); // Track fetched places to avoid duplicates

    // Add restaurants to the set to avoid re-adding them as activities
    petFriendlyRestaurants.forEach(p => fetchedPlaceIds.add(p.place_id));

    for (const interest of tripData.interests) {
        const types = interestToQuery[interest]?.split(' ') || ['point_of_interest'];
        let placesForInterest: Place[] = [];

        for (const type of types) {
            if (interestBasedActivities.length >= totalActivitiesNeeded + 5) break; // Stop fetching if we have enough potential activities

            const query = tripData.pets > 0
                ? `pet friendly ${type.replace(/_/g, ' ')} in ${tripData.destination}`
                : `${type.replace(/_/g, ' ')} in ${tripData.destination}`;
            
            const results = await searchGooglePlaces(query, type);
            placesForInterest.push(...results);
            if (placesForInterest.length >= MAX_ACTIVITIES_PER_INTEREST) break; // Limit per type within interest
        }
        
        console.log(`[EnhancedItinerary API] Found ${placesForInterest.length} potential places for interest '${interest}'`);

        placesForInterest.slice(0, MAX_ACTIVITIES_PER_INTEREST).forEach((place: Place) => {
            if (fetchedPlaceIds.has(place.place_id)) {
                console.log(`[EnhancedItinerary API] Skipping duplicate place: ${place.name}`);
                return; // Skip duplicates
            }
            fetchedPlaceIds.add(place.place_id);

            const explicitlySearchedPetFriendly = tripData.pets > 0; // Assume pet-friendly if pets > 0 for now
            let description = place.types ? place.types.map(t => t.replace(/_/g, ' ')).join(', ') : 'Attraction';
            if (place.rating) {
                description += ` (Rating: ${place.rating} / ${place.user_ratings_total || 0} reviews)`;
            }
            
            let estimatedCost: string | undefined = undefined;
            // Simplified cost estimation based on type
            const placeTypes = place.types || [];
            if (placeTypes.includes('museum') || placeTypes.includes('tourist_attraction') || placeTypes.includes('amusement_park') || placeTypes.includes('zoo')) {
                estimatedCost = "$20 - $50";
            } else if (placeTypes.includes('park') || placeTypes.includes('landmark')) {
                 estimatedCost = "Free - $20";
            } // Restaurants handled separately

            interestBasedActivities.push({
                name: place.name,
                description: description,
                petFriendly: explicitlySearchedPetFriendly, // Needs refinement later maybe via Place Details
                location: place.formatted_address || tripData.destination,
                coordinates: place.geometry.location,
                cost: estimatedCost,
                type: 'activity' // Set type
            });
        });
    }
    console.log('[EnhancedItinerary API] Total interest-based activities fetched:', interestBasedActivities.length);

    // Combine and filter activities (replace previous proximity filter with simple deduplication already done)
    // Ensure arrays are explicitly typed
    let allActivities: Activity[] = [...interestBasedActivities]; // Start with interest-based
    console.log('[EnhancedItinerary API] Total unique activities before filtering:', allActivities.length);
    
    // Simple shuffle to vary results slightly
    allActivities.sort(() => Math.random() - 0.5);

    // Select needed activities, ensuring we have enough variety potentially
    let filteredActivities: Activity[] = allActivities.slice(0, totalActivitiesNeeded); // Take the required number
    console.log('[EnhancedItinerary API] Selected activities for itinerary:', filteredActivities.length);

    // Convert restaurant Places to Activity type
    const restaurantActivities: Activity[] = petFriendlyRestaurants.map(place => {
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

    console.log('[EnhancedItinerary API] Found pet-friendly restaurants:', restaurantActivities.length);

    // --- Step 4: Generate Structured Itinerary ---
    console.log('[EnhancedItinerary API] Generating structured itinerary...');
    const itinerary: Itinerary = { days: [] };
    let currentDate = new Date(startDate);
    let currentDay = 1;
    let remainingInterestActivities = [...filteredActivities]; // Use activities meant for Days 2+
    let remainingRestaurantActivities = [...restaurantActivities]; // Use general restaurant list

    // --- Pre-Departure Preparation (If Pets > 0) ---
    const preDeparturePreparation: Activity[] = [];
    if (tripData.pets > 0) {
        console.log('[EnhancedItinerary API] Adding pre-departure preparations...');
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
    console.log('[EnhancedItinerary API] Adding structured Day 1...');
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
    // Attempt to find hotel coordinates (Best Effort - can be complex)
    // For now, using destination city center as a placeholder if no better coords exist
    // Future: Could add a Google Geocoding step here if accommodation name is reliable
    const accommodationPlaceholderCoords = defaultCoords; // Simple fallback for now
     day1Activities.push({
      name: `Check-in: ${accommodationName}`,
      description: `Check into ${accommodationName}. Settle your pet in. Confirm pet policies and any designated relief areas with staff.`,
      petFriendly: true,
      location: recommendedAccommodation?.vicinity || recommendedAccommodation?.formatted_address || tripData.destination, // Use specific location if available
      coordinates: accommodationCoords, // Use fetched coords
      startTime: "14:00", // Shifted later
      endTime: "14:30",
      cost: "Accommodation cost varies",
      type: 'accommodation'
    });

    // Day 1 Lunch (Using airport-nearby options first)
    let day1LunchPlace: Place | undefined = petFriendlyRestaurants.shift();
    if (day1LunchPlace) {
        console.log(`[EnhancedItinerary API] Using nearby restaurant for Day 1 lunch: ${day1LunchPlace.name}`);
        day1Activities.push({
            name: `Lunch: ${day1LunchPlace.name}`,
            description: day1LunchPlace.types ? day1LunchPlace.types.map(t => t.replace(/_/g, ' ')).join(', ') : 'Restaurant/Cafe',
            petFriendly: true, // Assumed from query
            location: day1LunchPlace.vicinity || day1LunchPlace.formatted_address || tripData.destination,
            coordinates: day1LunchPlace.geometry?.location || defaultCoords,
            cost: placePriceLevelToCost(day1LunchPlace.price_level), // Helper function needed
            startTime: "14:30",
            endTime: "15:30",
            type: 'meal'
        });
         // Remove this used restaurant from the general list if it exists there
        remainingRestaurantActivities = remainingRestaurantActivities.filter(r => r.location !== (day1LunchPlace.vicinity || day1LunchPlace.formatted_address));
    } else {
        console.log('[EnhancedItinerary API] No specific Day 1 lunch option found, using placeholder.');
        day1Activities.push({ name: "Lunch Near Accommodation", description: "Find a nearby pet-friendly cafe or restaurant.", petFriendly: true, location: accommodationName, coordinates: accommodationCoords, startTime: "14:30", endTime: "15:30", cost: "$30 - $60", type: 'meal' });
    }

     // Day 1 Afternoon Activity (Using airport-nearby park/relaxing place first)
    let day1AfternoonPlace: Place | undefined = petFriendlyRestaurants.shift();
    if (day1AfternoonPlace) {
         console.log(`[EnhancedItinerary API] Using nearby place for Day 1 afternoon: ${day1AfternoonPlace.name}`);
         day1Activities.push({
            name: `Afternoon: ${day1AfternoonPlace.name}`,
            description: `Relax or take a gentle walk at this nearby pet-friendly spot (${day1AfternoonPlace.types ? day1AfternoonPlace.types.map(t => t.replace(/_/g, ' ')).join(', ') : 'Place'}).`,
            petFriendly: true, // Assumed from query or type (park)
            location: day1AfternoonPlace.vicinity || day1AfternoonPlace.formatted_address || tripData.destination,
            coordinates: day1AfternoonPlace.geometry?.location || defaultCoords,
            cost: "Free - $20", // Parks usually free/low cost
            startTime: "16:00",
            endTime: "17:30", // Slightly shorter time
            type: 'activity'
        });
         // Remove this used activity from the general list if it exists there
         remainingInterestActivities = remainingInterestActivities.filter(a => a.location !== (day1AfternoonPlace.vicinity || day1AfternoonPlace.formatted_address));
    } else {
         console.log('[EnhancedItinerary API] No specific Day 1 afternoon option found, using placeholder.');
        day1Activities.push({ name: "Relax or Local Walk", description: "Settle in or take a short walk around your accommodation area.", petFriendly: true, location: accommodationName, coordinates: accommodationCoords, startTime: "16:00", endTime: "17:30", cost: "Free", type: 'placeholder' });
    }

    // Day 1 Dinner (Use general list)
     let dinnerActivity: Activity | undefined = remainingRestaurantActivities.shift();
     if (dinnerActivity) {
        console.log(`[EnhancedItinerary API] Using general restaurant for Day 1 dinner: ${dinnerActivity.name}`);
        day1Activities.push({
            ...dinnerActivity,
            name: `Dinner: ${dinnerActivity.name}`,
            startTime: "19:00",
            endTime: "20:30",
             type: 'meal' // Ensure type is set
        });
    } else {
         console.log('[EnhancedItinerary API] No remaining restaurants for Day 1 dinner, using placeholder.');
        day1Activities.push({ name: "Dinner Near Accommodation", description: "Enjoy dinner at a pet-friendly restaurant near your accommodation.", petFriendly: true, location: accommodationName, coordinates: accommodationCoords, startTime: "19:00", endTime: "20:30", cost: "$40 - $100", type: 'meal' });
    }

    // Add Last Day Specific Activities if it's the final day and pets > 0
    if (currentDay === tripDays && tripData.pets > 0) {
        console.log(`[EnhancedItinerary API] Adding final day preparations for Day ${currentDay}...`);

         // Prepend Vet Visit
         day1Activities.unshift({
           name: "Final Vet Check (Optional but Recommended)",
           description: "If your trip exceeded ~10-14 days or required specific entry paperwork, consider a final vet visit for a health check/certificate for your return or onward travel. [Review Best Practices](/blog/best-practices)",
           petFriendly: true,
           location: tripData.destination,
           coordinates: { lat: 0, lng: 0 }, // Placeholder
           startTime: "09:00",
           endTime: "10:00",
           cost: "Varies ($50-$150+)",
           type: 'preparation'
         });

         // Append Airport Transfer
         day1Activities.push({
           name: "Transfer to Departure Airport",
           description: `Head to the airport for your departure. Arrange pet-friendly transport in advance. Check options like Uber Pet if available.`, // <-- Uber link placeholder
           petFriendly: true,
           location: tripData.destination,
           coordinates: { lat: 0, lng: 0 }, // Placeholder - Ideally airport coords
           startTime: "16:00", // Example - adjust based on flight
           endTime: "17:00",
           cost: "$50 - $100",
           type: 'transfer'
         });
    }

    itinerary.days.push({
      day: currentDay,
      date: currentDate.toISOString().split('T')[0],
      city: tripData.destination,
      activities: day1Activities,
      travel: `Travel day from ${tripData.origin} to ${tripData.destination}.`
    });

    // --- Subsequent Days ---
    currentDay++;
    currentDate.setDate(currentDate.getDate() + 1);
    let currentCity = tripData.destination; // Start with primary destination

    console.log('[EnhancedItinerary API] Distributing remaining activities and meals...');
    const activityDays = tripDays - 1; // Remaining days for activities
    
    // Rough time slots for subsequent days
    const morningSlot = { start: "10:00", end: "13:00" };
    const afternoonSlot = { start: "15:00", end: "18:00" };
    const lunchSlot = { start: "13:00", end: "14:00" };
    const dinnerSlot = { start: "19:00", end: "20:30" };

    while (currentDay <= tripDays) {
        const dailyActivities: Activity[] = [];
        
        // Add Morning Activity
        let morningAct = remainingInterestActivities.shift();
        if (morningAct) {
            dailyActivities.push({ ...morningAct, startTime: morningSlot.start, endTime: morningSlot.end, type: 'activity' });
        } else {
             dailyActivities.push({ name: `Morning Exploration in ${currentCity}`, description: 'Discover a local park, pet-friendly cafe, or interesting street near your accommodation.', petFriendly: true, location: currentCity, coordinates: { lat: 0, lng: 0 }, startTime: morningSlot.start, endTime: morningSlot.end, cost: "Free - $30", type: 'placeholder'});
        }

        // Add Lunch
        let lunchAct = remainingRestaurantActivities.shift();
        if (lunchAct) {
             dailyActivities.push({ ...lunchAct, name: `Lunch: ${lunchAct.name}`, startTime: lunchSlot.start, endTime: lunchSlot.end, type: 'meal' });
        } else {
             dailyActivities.push({ name: `Lunch in ${currentCity}`, description: 'Find a local pet-friendly cafe or casual restaurant for lunch.', petFriendly: true, location: currentCity, coordinates: { lat: 0, lng: 0 }, startTime: lunchSlot.start, endTime: lunchSlot.end, cost: "$30 - $60", type: 'meal'});
        }

        // Add Afternoon Activity
        let afternoonAct = remainingInterestActivities.shift();
         if (afternoonAct) {
            dailyActivities.push({ ...afternoonAct, startTime: afternoonSlot.start, endTime: afternoonSlot.end, type: 'activity' });
        } else {
             dailyActivities.push({ name: `Afternoon Relaxation in ${currentCity}`, description: 'Visit a pet-friendly shop, relax at your accommodation, or find a quiet spot.', petFriendly: true, location: currentCity, coordinates: { lat: 0, lng: 0 }, startTime: afternoonSlot.start, endTime: afternoonSlot.end, cost: "Free - $20", type: 'placeholder'});
        }

        // Add Dinner
        let dinnerAct = remainingRestaurantActivities.shift();
        if (dinnerAct) {
             dailyActivities.push({ ...dinnerAct, name: `Dinner: ${dinnerAct.name}`, startTime: dinnerSlot.start, endTime: dinnerSlot.end, type: 'meal' });
        } else {
             dailyActivities.push({ name: `Dinner in ${currentCity}`, description: 'Explore the local dining scene and find a pet-friendly restaurant for dinner.', petFriendly: true, location: currentCity, coordinates: { lat: 0, lng: 0 }, startTime: dinnerSlot.start, endTime: dinnerSlot.end, cost: "$40 - $100", type: 'meal'});
        }

        // Add Last Day Specific Activities if it's the final day and pets > 0
        if (currentDay === tripDays && tripData.pets > 0) {
            console.log(`[EnhancedItinerary API] Adding final day preparations for Day ${currentDay}...`);

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

      console.log(`[EnhancedItinerary API] Adding Day ${currentDay} with ${dailyActivities.length} planned entries...`);

      itinerary.days.push({
        day: currentDay,
        date: currentDate.toISOString().split('T')[0],
        city: currentCity,
        activities: dailyActivities, // Add the structured day
      });

      currentDay++;
      currentDate.setDate(currentDate.getDate() + 1);

      // Placeholder logic for switching city (needs refinement)
      // TODO: Improve city switching logic based on trip duration and number of additional cities
      if (tripData.additionalCities.length > 0 && activityDays > 1 && currentDay > Math.floor(tripDays / (tripData.additionalCities.length + 1)) + 1) {
          if (currentCity === tripData.destination) { // Switch to first additional city
              currentCity = tripData.additionalCities[0];
               console.log(`[EnhancedItinerary API] Switched city focus to: ${currentCity}`);
              // TODO: Refetch/filter activities for the new city? Reset remaining activity lists?
               remainingInterestActivities = []; // Simple reset for now
               remainingRestaurantActivities = []; // Simple reset
          } // Add logic for switching to subsequent additional cities if needed
      }
    }


    // --- Return Success Response ---
    console.log('[EnhancedItinerary API] Successfully generated structured itinerary.');
    // console.log('Final Itinerary:', JSON.stringify(itinerary, null, 2)); // Deep log if needed
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
    console.error('[EnhancedItinerary API] Internal Server Error:', error);
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