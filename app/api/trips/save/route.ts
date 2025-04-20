import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server'; // Corrected import name
import type { TripData } from '@/store/tripStore'; // Adjust path if needed

// Keep nested schemas if they are correct in the frontend data
const petDetailsSchema = z.object({
  type: z.string(),
  size: z.string(),
}).optional(); // Make optional if it might not always be present

const activitySchema = z.object({
  name: z.string(),
  description: z.string(),
  petFriendly: z.boolean().optional(),
  location: z.string(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  cost: z.string().optional(),
  type: z.string().optional(),
});

const itineraryDaySchema = z.object({
  day: z.number(),
  date: z.string(),
  city: z.string(),
  activities: z.array(activitySchema).optional(),
  travel: z.string().optional(),
});

const itinerarySchema = z.object({
  days: z.array(itineraryDaySchema).optional(),
}).optional();

// Main schema reflecting frontend structure from logs
const tripDataSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  originCountry: z.string().optional(), // Added optional based on log
  destination: z.string().min(1, 'Destination is required'),
  destinationCountry: z.string().optional(), // Added optional based on log
  additionalCities: z.array(z.string()).optional(), // Added optional based on log
  additionalCountries: z.array(z.string()).optional(), // Added optional based on log
  startDate: z.string().nullable(), // Renamed from departureDate
  endDate: z.string().nullable(),   // Renamed from returnDate
  adults: z.number().min(0),
  children: z.number().min(0),
  pets: z.number().min(0),
  petDetails: z.array(petDetailsSchema).optional(), // Added based on log
  budget: z.string(), // Expecting string like "Moderate"
  accommodation: z.string().optional(), // Make optional if needed
  interests: z.array(z.string()).optional(),
  additionalInfo: z.string().optional(), // Added based on log
  itinerary: itinerarySchema, // Keep existing itinerary structure if correct
  // Add policyRequirements, generalPreparation etc. if they exist in frontend data
  policyRequirements: z.array(z.any()).optional(), // Placeholder
  generalPreparation: z.array(z.any()).optional(), // Placeholder
  preDeparturePreparation: z.array(z.any()).optional(), // Placeholder
});

export async function POST(request: NextRequest) {
  console.log('--- POST /api/trips/save invoked ---');

  const supabase = await createClient();

  try {
    console.log('Attempting authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[SAVE TRIP API] Authentication error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Authentication successful, User ID:', user.id);

    console.log('Parsing request body...');
    let body: any; // Use any temporarily for parsing before validation
    try {
        body = await request.json();
        console.log('Request body parsed successfully.');
    } catch (parseError) {
        console.error('[SAVE TRIP API] JSON Parsing error:', parseError);
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    console.log('Validating request body with updated schema...');
    const validationResult = tripDataSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('[SAVE TRIP API] Validation errors:', validationResult.error.errors);
      // Log the received body on validation failure for easier debugging
      console.error('[SAVE TRIP API] Invalid body received:', JSON.stringify(body, null, 2));
      return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.errors }, { status: 400 });
    }
    console.log('Validation successful.');

    // Explicitly type validated data after successful parsing
    const validatedTripData: z.infer<typeof tripDataSchema> = validationResult.data;

    // --- Updated Data Preparation --- 
    console.log('Preparing data for insertion...');
    const title = `Trip to ${validatedTripData.destination}`; // Use destination field
    // Use startDate and endDate fields for DB columns
    const startDateISO = validatedTripData.startDate ? new Date(validatedTripData.startDate).toISOString() : null;
    const endDateISO = validatedTripData.endDate ? new Date(validatedTripData.endDate).toISOString() : null;

    // Basic check for valid dates if not null
    if ((validatedTripData.startDate && !startDateISO) || (validatedTripData.endDate && !endDateISO)) {
        console.error('[SAVE TRIP API] Invalid date format provided:', { start: validatedTripData.startDate, end: validatedTripData.endDate });
        return NextResponse.json({ error: 'Invalid date format provided' }, { status: 400 });
    }

    const itineraryToInsert = {
      user_id: user.id,
      title: title,
      description: null, // Can potentially pull from additionalInfo?
      start_date: startDateISO, // Use ISO format date
      end_date: endDateISO,     // Use ISO format date
      location: validatedTripData.destination, // Use destination field for location column
      trip_data: validatedTripData as any, // Store the full validated object (matching frontend structure now)
      documents: null,
    };
    console.log('[SAVE TRIP API] Data prepared for insert:', JSON.stringify(itineraryToInsert, null, 2));

    console.log('Attempting database insert...');
    const { error: dbError } = await supabase
      .from('itineraries')
      .insert([itineraryToInsert]);

    if (dbError) {
      console.error('[SAVE TRIP API] Supabase DB error during insert:', dbError);
      return NextResponse.json({ error: 'Failed to save trip', details: dbError.message }, { status: 500 });
    }
    console.log('Database insert successful.');

    console.log('Returning success response.');
    return NextResponse.json({ message: 'Trip saved successfully' }, { status: 201 });

  } catch (error) {
    console.error('[SAVE TRIP API] Unexpected error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
