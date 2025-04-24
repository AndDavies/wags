import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Activity } from '@/store/tripStore'; // Assuming Activity type is exported
import { Client, PlaceInputType, TextSearchRequest, TextSearchResponse, Place, PlacePhoto } from '@googlemaps/google-maps-services-js';

// Define a Zod schema for the Activity structure to ensure type safety in the API
const CoordinateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const ActivitySchema = z.object({
  name: z.string(),
  description: z.string(),
  petFriendly: z.boolean(),
  location: z.string(),
  coordinates: CoordinateSchema,
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  cost: z.string().optional(),
  type: z.enum(['flight', 'transfer', 'accommodation', 'meal', 'activity', 'placeholder', 'preparation']).optional(),
  place_id: z.string().optional(),
  website: z.string().optional(),
  phone_number: z.string().optional(),
  opening_hours: z.string().optional(),
  photo_references: z.array(z.any()).optional(), // Keep photo_references flexible for now
  booking_link: z.string().optional(),
  pet_friendliness_details: z.string().optional(),
  estimated_duration: z.number().optional(),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
});

// Define the expected input schema using the detailed ActivitySchema
const SuggestActivityRequestSchema = z.object({
  dayNumber: z.number().int().positive(),
  city: z.string().min(1, "City is required"),
  coordinates: CoordinateSchema.optional(),
  interests: z.array(z.string()).optional(),
  budget: z.string().optional(),
  existingActivities: z.array(ActivitySchema).optional(), // Use the detailed ActivitySchema here
});

// Define the suggestion structure matching desired output fields
export interface ActivitySuggestion {
  place_id: string;
  name: string;
  location: string; // Formatted address or vicinity
  coordinates: { lat: number; lng: number };
  types?: string[];
  description?: string; // Not directly available from textSearch, might need Place Details
  photo_references?: PlacePhoto[]; // From Places API PlacePhoto type
  website?: string;
  // opening_hours?: any; // Opening hours requires Place Details call, omit for now
  rating?: number;
  user_ratings_total?: number;
  petFriendly: boolean; // Heuristic based on name/types
}

const googleMapsClient = new Client({});

/**
 * Determines if a place might be pet-friendly based on keywords.
 * This is a simple heuristic and not guaranteed.
 * @param place - The Google Place object.
 * @returns boolean indicating potential pet-friendliness.
 */
function isPotentiallyPetFriendly(place: Place): boolean {
  const nameLower = place.name?.toLowerCase() || '';
  const typesLower = place.types?.map(t => t.toLowerCase()) || [];

  const keywords = ['pet friendly', 'dog friendly', 'pets allowed', 'patio', 'outdoor seating', 'park', 'hike', 'trail'];
  const antiKeywords = ['no pets', 'service animals only'];

  if (antiKeywords.some(keyword => nameLower.includes(keyword))) {
      return false;
  }
  if (keywords.some(keyword => nameLower.includes(keyword))) {
      return true;
  }
  if (typesLower.includes('park')) {
      return true;
  }
  // Add more sophisticated checks if needed (e.g., check reviews via Place Details)
  return false; // Default to false if unsure
}


/**
 * POST handler for suggesting activities for a specific trip day.
 * Uses Google Places API (Text Search) to find relevant, pet-friendly activities.
 * 
 * @param req - The NextRequest object containing the request body.
 * @returns NextResponse with suggested activities or an error message.
 */
export async function POST(req: NextRequest) {
  console.log('[API /api/trip/suggest-activity] Received POST request');

  let requestBody;
  try {
    requestBody = await req.json();
  } catch (error) {
    console.error('[API /api/trip/suggest-activity] Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const validationResult = SuggestActivityRequestSchema.safeParse(requestBody);

  if (!validationResult.success) {
    console.error('[API /api/trip/suggest-activity] Invalid request body:', validationResult.error.errors);
    return NextResponse.json({ error: 'Invalid request data.', details: validationResult.error.flatten() }, { status: 400 });
  }

  const { dayNumber, city, coordinates, interests, budget, existingActivities } = validationResult.data;
  const existingPlaceIds = new Set(existingActivities?.map(act => act.place_id).filter(Boolean));
  console.log(`[API /api/trip/suggest-activity] Processing suggestion request for Day ${dayNumber} in ${city}. Existing place IDs: ${Array.from(existingPlaceIds).join(', ')}`);

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.error('[API /api/trip/suggest-activity] Google Maps API key is missing.');
    return NextResponse.json({ error: 'Server configuration error: Missing API key.' }, { status: 500 });
  }

  try {
    // 1. Construct query
    // Combine city, interests, and pet-friendly terms for a broad search
    const interestQuery = interests ? interests.join(' ') : 'things to do';
    // Prioritize pet-friendly terms
    const searchQuery = `pet friendly ${interestQuery} in ${city}`;

    // 2. Prepare request parameters
    const searchParams: TextSearchRequest['params'] = {
        query: searchQuery,
        key: GOOGLE_MAPS_API_KEY,
        // Define fields to request to potentially avoid needing Place Details call
        // Note: Not all fields might be returned by Text Search, Place Details is more comprehensive
        // Basic fields are typically: formatted_address, geometry, name, place_id, types
        // Adding others might incur higher costs or not be available in Text Search.
        // Let's start basic and add if needed.
        // fields: ['place_id', 'name', 'geometry.location', 'formatted_address', 'vicinity', 'types', 'photos', 'website', 'rating', 'user_ratings_total'] 
    };

    // 2b. Add location bias if coordinates are provided
    if (coordinates) {
        searchParams.location = `${coordinates.lat},${coordinates.lng}`;
        searchParams.radius = 10000; // 10km radius bias, adjust as needed
        console.log(`[API /api/trip/suggest-activity] Using location bias: ${searchParams.location}, radius: ${searchParams.radius}m`);
    }
    
    console.log(`[API /api/trip/suggest-activity] Performing Google Places Text Search with query: "${searchQuery}"`);

    // 4. Fetch results from Google Places API
    const response = await googleMapsClient.textSearch({
        params: searchParams,
        timeout: 5000, // Timeout in milliseconds
    });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.error('[API /api/trip/suggest-activity] Google Places API Error:', response.data.status, response.data.error_message);
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
    }

    const results = response.data.results || [];
    console.log(`[API /api/trip/suggest-activity] Received ${results.length} results from Google.`);

    // 5. Process results
    const suggestions: ActivitySuggestion[] = results
        .filter(place => place.place_id && !existingPlaceIds.has(place.place_id)) // Filter out duplicates and places without ID
        .map((place): ActivitySuggestion | null => {
            if (!place.place_id || !place.name || !place.geometry?.location) {
                console.warn('[API /api/trip/suggest-activity] Skipping place with missing essential data:', place.name);
                return null; // Skip if essential data is missing
            }
            
            return {
                place_id: place.place_id,
                name: place.name,
                location: place.formatted_address || place.vicinity || city, // Fallback order for location string
                coordinates: { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
                types: place.types,
                photo_references: place.photos,
                website: place.website, // Note: Website often requires Place Details
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                petFriendly: isPotentiallyPetFriendly(place), // Use heuristic
                // description and opening_hours would typically require a Place Details call
            };
        })
        .filter((suggestion): suggestion is ActivitySuggestion => suggestion !== null); // Filter out nulls

    console.log(`[API /api/trip/suggest-activity] Formatted ${suggestions.length} valid suggestions after filtering.`);

    return NextResponse.json({ suggestions: suggestions }, { status: 200 });

  } catch (error: any) {
    console.error('[API /api/trip/suggest-activity] Error during suggestion processing:', error);
    // Check if it's an Axios error from the client library for more details
    const details = error.response?.data?.error_message || error.message || 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch activity suggestions.', details }, { status: 500 });
  }
} 