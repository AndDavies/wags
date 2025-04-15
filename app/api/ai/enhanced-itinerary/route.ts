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
}

interface Activity {
  name: string;
  description: string;
  petFriendly: boolean;
  location: string;
  coordinates: { lat: number; lng: number };
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
  try {
    console.log('[EnhancedItinerary API] Received POST request');

    // Parse the request body
    console.log('[EnhancedItinerary API] Parsing request body...');
    const tripData: TripData = await request.json();
    console.log('[EnhancedItinerary API] Request body parsed:', tripData);

    // Validate required fields
    console.log('[EnhancedItinerary API] Validating required fields...');
    const requiredFields = [
      'origin',
      'originCountry',
      'destination',
      'destinationCountry',
      'startDate',
      'endDate',
      'adults',
      'budget',
      'accommodation',
      'interests',
    ];
    const missingFields = requiredFields.filter(
      (field) => !tripData[field as keyof TripData]
    );
    if (missingFields.length > 0) {
      console.error('[EnhancedItinerary API] Validation failed:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate petDetails if pets > 0
    if (tripData.pets > 0 && (!tripData.petDetails || tripData.petDetails.length !== tripData.pets)) {
      console.error('[EnhancedItinerary API] Validation failed: petDetails does not match number of pets');
      return NextResponse.json(
        { error: 'petDetails must match the number of pets' },
        { status: 400 }
      );
    }

    console.log('[EnhancedItinerary API] Validation passed');

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

    // Query pet_policies table for entry requirements
    console.log('[EnhancedItinerary API] Initializing Supabase client...');
    const supabase = createClient();
    console.log('[EnhancedItinerary API] Querying pet_policies for country:', tripData.destinationCountry);
    const { data: petPolicies, error: policyError } = await (await supabase)
      .from('pet_policies')
      .select('*')
      .eq('country_name', tripData.destinationCountry)
      .single();

    if (policyError) {
      console.error('[EnhancedItinerary API] Error querying pet_policies:', policyError);
      return NextResponse.json(
        { error: `Failed to fetch pet policies: ${policyError.message}` },
        { status: 500 }
      );
    }
    console.log('[EnhancedItinerary API] pet_policies result:', petPolicies);

    // Format preparation requirements
    console.log('[EnhancedItinerary API] Formatting preparation requirements...');
    const preparation: Array<{ requirement: string; details: string }> = [];
    if (petPolicies) {
      const policy: PetPolicy = petPolicies;

      // Parse entry_requirements JSONB
      if (policy.entry_requirements) {
        console.log('[EnhancedItinerary API] Parsing entry_requirements:', policy.entry_requirements);
        Object.entries(policy.entry_requirements).forEach(([key, value]) => {
          preparation.push({
            requirement: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            details: value,
          });
        });
      }

      // Add quarantine info
      if (policy.quarantine_info) {
        console.log('[EnhancedItinerary API] Adding quarantine_info:', policy.quarantine_info);
        preparation.push({
          requirement: 'Quarantine Info',
          details: policy.quarantine_info,
        });
      }

      // Parse additional_info JSONB
      if (policy.additional_info) {
        console.log('[EnhancedItinerary API] Parsing additional_info:', policy.additional_info);
        Object.entries(policy.additional_info).forEach(([key, value]) => {
          preparation.push({
            requirement: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            details: value,
          });
        });
      }

      // Parse external_links JSONB and add primary external_link
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
      console.log('[EnhancedItinerary API] No pet policies found, adding fallback message');
      preparation.push({
        requirement: 'Check Requirements',
        details: `Please check the latest pet entry requirements for ${tripData.destinationCountry}.`,
      });
    }
    console.log('[EnhancedItinerary API] Preparation requirements:', preparation);

    // Use Google Places API to find activities
    console.log('[EnhancedItinerary API] Fetching activities with Google Places API...');
    const activitiesPerDay = 2; // 2 activities per day
    const totalActivitiesNeeded = (tripDays - 1) * activitiesPerDay; // -1 for travel day
    const activities: Activity[] = [];

    // Map interests to Google Places API keywords
    const interestToQuery: { [key: string]: string } = {
      Sightseeing: 'tourist attractions',
      'Outdoor Adventures': 'parks hiking trails',
      Sports: 'sports facilities',
      'Food Tours': 'restaurants cafes',
      Museums: 'museums',
      Shopping: 'shopping malls markets',
      'Spa and Wellness': 'spas wellness centers',
      'Local Experiences': 'local culture experiences',
      Photography: 'photography spots',
      'Wildlife Viewing': 'wildlife parks zoos',
      'Water Activities': 'beaches water sports',
      Nightlife: 'bars nightlife',
      'Historical Sites': 'historical sites',
      'Cultural Events': 'cultural events festivals',
      Other: 'attractions',
    };

    // Fetch activities for each interest
    for (const interest of tripData.interests) {
      const queryBase = interestToQuery[interest] || 'attractions';
      const query = tripData.pets > 0 ? `pet-friendly ${queryBase} in ${tripData.destination}` : `${queryBase} in ${tripData.destination}`;
      const url = `${PLACES_API_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
      console.log('[EnhancedItinerary API] Google Places API request URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        console.error('[EnhancedItinerary API] Google Places API error:', response.status, response.statusText);
        continue; // Skip this interest and try the next one
      }

      const data = await response.json();
      console.log('[EnhancedItinerary API] Google Places API response status:', data.status);
      if (data.status !== 'OK') {
        console.error('[EnhancedItinerary API] Google Places API error:', data.status, data.error_message);
        continue;
      }

      const places: Place[] = data.results || [];
      console.log('[EnhancedItinerary API] Google Places API results:', places.length, 'places found');
      places.forEach((place: Place) => {
        const petFriendly = tripData.pets > 0 ? query.includes('pet-friendly') : true; // Assume pet-friendly if explicitly searched
        activities.push({
          name: place.name,
          description: `Rating: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reviews)`,
          petFriendly,
          location: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
        });
      });
    }
    console.log('[EnhancedItinerary API] Total activities found:', activities.length);

    // Filter activities for proximity (within 10 km of the first activity's coordinates)
    console.log('[EnhancedItinerary API] Filtering activities for proximity...');
    const filteredActivities: Activity[] = [];
    if (activities.length > 0) {
      const baseCoords = activities[0].coordinates;
      console.log('[EnhancedItinerary API] Base coordinates for proximity filter:', baseCoords);
      filteredActivities.push(activities[0]);
      for (let i = 1; i < activities.length; i++) {
        const distance = haversineDistance(
          baseCoords.lat,
          baseCoords.lng,
          activities[i].coordinates.lat,
          activities[i].coordinates.lng
        );
        console.log(`[EnhancedItinerary API] Distance for activity ${activities[i].name}: ${distance.toFixed(2)} km`);
        if (distance <= 10) { // Within 10 km
          filteredActivities.push(activities[i]);
        }
      }
    }
    console.log('[EnhancedItinerary API] Filtered activities:', filteredActivities.length);

    // Fallback to AI-generated activities if not enough activities are found
    if (filteredActivities.length < totalActivitiesNeeded) {
      const remainingActivities = totalActivitiesNeeded - filteredActivities.length;
      console.log('[EnhancedItinerary API] Not enough activities, generating', remainingActivities, 'via OpenAI...');
      const interestsPrompt = tripData.interests.join(', ');
      const aiPrompt = `
Generate ${remainingActivities} pet-friendly activities in ${tripData.destination}, ${tripData.destinationCountry} that align with the following interests: ${interestsPrompt}.

Return the activities as a JSON array with the following structure:
[
  {
    "name": "Activity Name",
    "description": "Brief description",
    "petFriendly": true,
    "location": "Approximate address or area",
    "coordinates": { "lat": 48.8566, "lng": 2.3522 }
  }
]
`;

      console.log('[EnhancedItinerary API] Sending OpenAI API request with prompt:', aiPrompt);
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          { role: 'system', content: 'You are a helpful travel planner.' },
          { role: 'user', content: aiPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 32768,
      });

      console.log('[EnhancedItinerary API] OpenAI API response received');
      const aiActivities: Activity[] = JSON.parse(completion.choices[0].message.content!).map(
        (activity: any) => ({
          ...activity,
          petFriendly: true,
        })
      );
      console.log('[EnhancedItinerary API] AI-generated activities:', aiActivities);
      filteredActivities.push(...aiActivities);
    }

    // Generate the itinerary
    console.log('[EnhancedItinerary API] Generating itinerary...');
    const itinerary: Itinerary = { days: [] };
    let currentDate = new Date(startDate);
    let currentDay = 1;
    let currentCity = tripData.origin;

    // Day 1: Travel to destination (with preparation)
    console.log('[EnhancedItinerary API] Adding Day 1 (travel and preparation)...');
    itinerary.days.push({
      day: currentDay,
      date: currentDate.toISOString().split('T')[0],
      city: currentCity,
      activities: [],
      preparation: preparation.length > 0 ? preparation : undefined,
      travel: `Travel from ${tripData.origin}, ${tripData.originCountry} to ${tripData.destination}, ${tripData.destinationCountry}`,
    });

    // Increment day and date
    currentDay++;
    currentDate.setDate(currentDate.getDate() + 1);
    currentCity = tripData.destination;

    // Distribute activities across remaining days
    console.log('[EnhancedItinerary API] Distributing activities across remaining days...');
    const activitiesPerDayList = filteredActivities.slice(0, totalActivitiesNeeded);
    let activityIndex = 0;

    while (currentDay <= tripDays && activityIndex < activitiesPerDayList.length) {
      const dailyActivities = activitiesPerDayList.slice(
        activityIndex,
        activityIndex + activitiesPerDay
      );
      console.log(`[EnhancedItinerary API] Day ${currentDay}:`, dailyActivities);
      itinerary.days.push({
        day: currentDay,
        date: currentDate.toISOString().split('T')[0],
        city: currentCity,
        activities: dailyActivities,
      });

      activityIndex += activitiesPerDay;
      currentDay++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill remaining days with generic activities if needed
    console.log('[EnhancedItinerary API] Filling remaining days with generic activities...');
    while (currentDay <= tripDays) {
      itinerary.days.push({
        day: currentDay,
        date: currentDate.toISOString().split('T')[0],
        city: currentCity,
        activities: [
          {
            name: 'Explore the City',
            description: 'Spend the day exploring pet-friendly areas in the city.',
            petFriendly: true,
            location: currentCity,
            coordinates: { lat: 0, lng: 0 }, // Placeholder coordinates
          },
        ],
      });
      currentDay++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('[EnhancedItinerary API] Itinerary generated successfully:', itinerary);
    return NextResponse.json(itinerary, { status: 200 });
  } catch (error) {
    console.error('[EnhancedItinerary API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate itinerary: ${errorMessage}` },
      { status: 400 }
    );
  }
}