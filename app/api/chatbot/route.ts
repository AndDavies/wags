import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { createClient } from '@supabase/supabase-js'; // Import the standard Supabase client

// Ensure your OpenAI API key is set in environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase Service Client (for direct DB access in API route)
// IMPORTANT: Ensure these are set in your server environment, NOT exposed client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client only if keys are available
const supabaseAdmin = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null;

// Define expected request structure
interface ChatRequestBody {
  messages: OpenAI.Chat.ChatCompletionMessageParam[]; // Full conversation history
  tripData?: any; // Optional: Pass relevant trip context
}

// --- Define Baggo's Tools (Functions) ---

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_trip_details',
      description: 'Retrieves the current user\'s trip plan details, including destination, dates, travelers, pet info, and any existing itinerary. Should be called if context is missing.',
      parameters: { type: 'object', properties: {} }, // No parameters needed
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_activity_to_day',
      description: 'Adds a new activity to a specific day in the user\'s itinerary. Requires confirmation from the user before calling.',
      parameters: {
        type: 'object',
        properties: {
          day_number: {
            type: 'number',
            description: 'The day number (e.g., 1, 2, 3) to add the activity to.',
          },
          activity: {
            type: 'object',
            description: 'Details of the activity to add.',
            properties: {
              name: { type: 'string', description: 'Name of the activity (e.g., "Visit Central Park").' },
              description: { type: 'string', description: 'Brief description of the activity.' },
              location: { type: 'string', description: 'Location name or address (e.g., "Central Park, New York, NY").' },
              start_time: { type: 'string', description: 'Optional start time (e.g., "10:00 AM").' },
              duration_minutes: { type: 'number', description: 'Optional estimated duration in minutes.' },
              pet_friendly_status: { type: 'string', enum: ['yes', 'no', 'unknown'], description: 'Whether the activity is known to be pet-friendly.'},
              pet_friendliness_details: { type: 'string', description: 'Optional specific details about pet policies (e.g., "Leashed dogs allowed on trails").'}
            },
            required: ['name', 'description', 'location', 'pet_friendly_status'],
          },
        },
        required: ['day_number', 'activity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_pet_friendly_activity',
      description: 'Suggests pet-friendly activities (like parks, cafes, trails, attractions) based on location, interests, and optional day.',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city or area to search for activities (e.g., "Paris, France", "Near Golden Gate Bridge").',
          },
          interests: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional list of user interests (e.g., ["Outdoor Adventures", "Food Tours"]).',
          },
          activity_type: {
              type: 'string',
              description: 'Optional specific type of activity to search for (e.g., "park", "cafe", "hike", "hotel").'
          },
           day_number: {
            type: 'number',
            description: 'Optional day number of the trip to provide context for the suggestion.',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
        name: 'find_nearby_service',
        description: 'Finds nearby pet-related services like vets, pet stores, or groomers.',
        parameters: {
            type: 'object',
            properties: {
                location: {
                    type: 'string',
                    description: 'The city or area to search within (e.g., "Downtown Denver").',
                },
                service_type: {
                    type: 'string',
                    enum: ['veterinary_care', 'pet_store', 'grooming', 'dog_park'],
                    description: 'The specific type of service to find.',
                },
            },
            required: ['location', 'service_type'],
        },
    },
  },
   {
    type: 'function',
    function: {
      name: 'save_trip_progress',
      description: 'Saves the current trip itinerary progress. Should be called when the user asks to save.',
      parameters: { type: 'object', properties: {} }, // No parameters needed
    },
  },
  {
    type: 'function',
    function: {
        name: 'check_travel_regulations',
        description: 'Checks the pet import regulations for a specific destination country, optionally considering the origin country and pet type.',
        parameters: {
            type: 'object',
            properties: {
                destination_country: {
                    type: 'string',
                    description: 'The destination country for which to check regulations (e.g., "France", "Japan").',
                },
                origin_country: {
                    type: 'string',
                    description: 'Optional: The country the pet is traveling from.',
                },
                pet_type: {
                    type: 'string',
                    description: 'Optional: The type of pet (e.g., "Dog", "Cat"). Filters results if provided.'
                },
            },
            required: ['destination_country'],
        },
    },
  },
  // --- Add more functions here (e.g., check_travel_regulations) ---
];

// --- Google Places API Implementations ---

// Use the correct environment variable name provided by the user
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Uses Google Places Text Search API to find pet-friendly activities.
 * @param location Text string describing the location (e.g., "parks in Paris, France").
 * @param interests Optional array of interests to potentially refine search keywords.
 * @param activity_type Optional specific type (e.g., "park", "cafe").
 * @returns Array of simplified place results or throws an error.
 */
async function suggestActivity(location: string, interests?: string[], activity_type?: string): Promise<any[]> {
  console.log(`[Function suggestActivity] Called with location: ${location}, interests: ${interests}, type: ${activity_type}`);
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('[API Chatbot] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
    throw new Error('Server configuration error: Missing Google Maps API key.');
  }

  // Construct a search query
  // Prioritize activity_type if provided, otherwise use interests or generic terms.
  let query = `pet friendly ${activity_type || 'attractions'} in ${location}`;
  if (!activity_type && interests && interests.length > 0) {
      query = `pet friendly ${interests.join(' or ')} in ${location}`;
  }
  // Basic sanitization
  query = query.replace(/[^a-zA-Z0-9\s]/g, '');

  const fields = 'name,formatted_address,vicinity,place_id,rating,types,geometry'; // Add geometry for coordinates
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&fields=${fields}`;

  console.log(`[Function suggestActivity] Fetching URL: ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Function suggestActivity] Google Places API Error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.results || data.results.length === 0) {
      return []; // No results found
    }

    // Map results to a simpler format for the AI
    const mappedResults = data.results.slice(0, 5).map((place: any) => ({
      name: place.name,
      location: place.formatted_address || place.vicinity,
      rating: place.rating,
      place_id: place.place_id,
      types: place.types,
      // Extract coordinates if needed, handle potential absence
      coordinates: place.geometry?.location // { lat: number, lng: number }
      // Note: Determining actual pet-friendliness often requires more than just the API query.
      // This provides candidates that *might* be pet-friendly.
    }));

    return mappedResults;

  } catch (error: any) {
    console.error('[Function suggestActivity] Fetch Error:', error);
    throw new Error(`Failed to fetch activity suggestions: ${error.message}`);
  }
}

/**
 * Uses Google Places Nearby Search API to find specific pet services.
 * @param location Text string describing the location (e.g., "Downtown Denver").
 * @param service_type The type of service (e.g., 'veterinary_care').
 * @returns Array of simplified place results or throws an error.
 */
async function findService(location: string, service_type: string): Promise<any[]> {
  console.log(`[Function findService] Called with location: ${location}, type: ${service_type}`);
   if (!GOOGLE_PLACES_API_KEY) {
    console.error('[API Chatbot] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
    throw new Error('Server configuration error: Missing Google Maps API key.');
  }

  // Use Nearby Search - requires a location bias or coordinates.
  // For simplicity, we'll use the location text query, but rankby distance might be better with coordinates.
  // Map service_type to Google Places type
  const googleType = service_type; // Types often match directly, but mapping might be needed

  const fields = 'name,vicinity,formatted_phone_number,place_id,rating,geometry';
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(googleType)}&location=${encodeURIComponent(location)}&radius=5000&key=${GOOGLE_PLACES_API_KEY}&fields=${fields}`;
  // Note: Nearby Search without explicit lat/lng and using text `location` can be inaccurate.
  // Ideally, geocode the location first or use lat/lng from tripData if available.
  // Using radius=5000 (5km) as an example.

   console.log(`[Function findService] Fetching URL: ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Function findService] Google Places API Error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Map results
    const mappedResults = data.results.slice(0, 5).map((place: any) => ({
      name: place.name,
      location: place.vicinity, // Vicinity is often better for nearby search
      phone: place.formatted_phone_number,
      rating: place.rating,
      place_id: place.place_id,
      coordinates: place.geometry?.location
    }));

    return mappedResults;

  } catch (error: any) {
      console.error('[Function findService] Fetch Error:', error);
      throw new Error(`Failed to find nearby services: ${error.message}`);
  }
}

// --- API Route Handler ---

export async function POST(req: NextRequest) {
  let currentTripData = null; // Variable to hold tripData if fetched

  try {
    const body: ChatRequestBody = await req.json();
    const { messages, tripData } = body;
    currentTripData = tripData; // Store tripData passed from the client

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const systemPrompt: OpenAI.Chat.ChatCompletionSystemMessageParam = {
       role: 'system',
       content: `You are Baggo, a friendly and highly knowledgeable pet travel assistant for the Wags and Wanders application. Your goal is to help users plan the best possible pet-friendly trips.
       - Be concise and helpful.
       - Use get_trip_details function if you need context about the trip plan (destination, dates, pets, itinerary) that isn't in the recent chat history.
       - Use add_activity_to_day function to add activities. ALWAYS ask for user confirmation before calling this.
       - Use suggest_pet_friendly_activity to find relevant activity ideas.
       - Use find_nearby_service for vets, pet stores etc.
       - Use check_travel_regulations to look up pet import rules for specific countries. Use the user's destination country from trip details if available, otherwise ask.
       - When presenting regulations from check_travel_regulations, if a 'country_slug' is provided in the function result, ALWAYS include a Markdown link like '[View Full Details](/directory/policies/[country_slug])' at the end of your summary.
       - Use save_trip_progress when the user asks to save.
       - Prioritize pet safety, comfort, and local regulations.
       - When asked to add an activity, extract details like name, description, location, pet-friendliness. If details are missing, ask the user.
       - Be conversational and empathetic.`,
    };

    const messagesWithSystemPrompt: OpenAI.Chat.ChatCompletionMessageParam[] = [systemPrompt, ...messages];

    console.log('[API Chatbot] Sending initial request to OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystemPrompt,
      tools: tools,
      tool_choice: 'auto',
    });

    const responseMessage = completion.choices[0]?.message;
    console.log('[API Chatbot] Received initial response:', responseMessage);

    if (!responseMessage) {
      throw new Error('No response message received from OpenAI.');
    }

    const toolCalls = responseMessage.tool_calls;
    let finalReply = responseMessage.content;
    const actionsForFrontend: { action: string; payload: any }[] = [];
    const tool_results: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];
    let needsSecondOpenAICall = false;

    if (toolCalls) {
      console.log('[API Chatbot] Initial response requires tool calls:', toolCalls.length);

      await Promise.all(toolCalls.map(async (call) => {
        const functionName = call.function.name;
        const functionArgs = JSON.parse(call.function.arguments || '{}');
        let functionResultContent = '';
        console.log(`[API Chatbot] Processing tool call: ${functionName}`, functionArgs);

        try {
          switch (functionName) {
            // --- Backend Execution Cases ---
            case 'suggest_pet_friendly_activity':
              const suggestions = await suggestActivity(functionArgs.location, functionArgs.interests, functionArgs.activity_type);
              functionResultContent = JSON.stringify(suggestions);
              needsSecondOpenAICall = true;
              break;
            case 'find_nearby_service':
              const services = await findService(functionArgs.location, functionArgs.service_type);
              functionResultContent = JSON.stringify(services);
              needsSecondOpenAICall = true;
              break;

            // --- Frontend Delegation Cases ---
            case 'get_trip_details':
              actionsForFrontend.push({ action: functionName, payload: {} });
              functionResultContent = '{"status": "delegated_to_frontend", "action": "get_trip_details"}';
              break;
            case 'add_activity_to_day':
              actionsForFrontend.push({ action: functionName, payload: functionArgs });
              functionResultContent = '{"status": "delegated_to_frontend", "action": "add_activity"}'; // Signal frontend action
              break;
            case 'save_trip_progress':
                 actionsForFrontend.push({ action: functionName, payload: {} });
                 functionResultContent = '{"status": "delegated_to_frontend", "action": "save_trip"}';
                 break;

            // --- NEW TOOL DEFINITION ---
            case 'check_travel_regulations':
              if (!supabaseAdmin) {
                  console.error('[API Chatbot] Supabase Admin client not initialized. Check environment variables SUPABASE_SERVICE_ROLE_KEY.');
                  throw new Error('Database connection is not configured on the server.');
              }
              const { destination_country, origin_country, pet_type } = functionArgs;
              if (!destination_country) {
                  throw new Error('Destination country is required for checking regulations.');
              }

              console.log(`[API Chatbot] Querying Supabase (Admin) for ${destination_country}...`);

              // Fetch only the necessary fields
              const query = supabaseAdmin
                  .from('pet_policies') // Your table name
                  .select(`
                      slug,
                      entry_requirements
                  `)
                  .ilike('country_name', destination_country) // Case-insensitive match
                  .limit(1);
              
              // TODO: Add .eq() or other filters for origin_country, pet_type if schema supports
              // if (origin_country) query = query.eq('origin_column', origin_country);
              // if (pet_type) query = query.eq('pet_type_column', pet_type);
              
              const { data: dbResult, error: dbError } = await query.single(); // Use .single() if expecting one row

              if (dbError && dbError.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found) error
                  console.error('[API Chatbot] Supabase query error:', dbError);
                  throw new Error(`Failed to fetch regulations from database: ${dbError.message}`);
              }

              console.log('[API Chatbot] Raw Supabase dbResult (partial):', JSON.stringify(dbResult, null, 2));

              if (dbResult && Array.isArray(dbResult.entry_requirements) && dbResult.entry_requirements.length > 0) {
                   // Extract truncated requirements
                   const MAX_TEXT_LENGTH = 150; // Max characters per requirement text
                   const truncatedRequirements = dbResult.entry_requirements.map((req: any) => {
                       if (req.label && req.text) {
                           const truncatedText = req.text.length > MAX_TEXT_LENGTH
                               ? req.text.substring(0, MAX_TEXT_LENGTH) + '...'
                               : req.text;
                           return { label: req.label, text: truncatedText }; // Return label and truncated text
                       } else {
                           return null; // Skip if label or text is missing
                       }
                   }).filter(Boolean); // Remove null entries

                   // Construct an object with the truncated requirements
                   const regulationsResult = {
                      destination_country: destination_country,
                      country_slug: dbResult.slug,
                      requirements: truncatedRequirements // Send the array of {label, text}
                  };
                  console.log('[API Chatbot] Constructed regulations object with truncated text:', JSON.stringify(regulationsResult, null, 2));
                  functionResultContent = JSON.stringify(regulationsResult);
              } else {
                  console.log(`[API Chatbot] No valid entry requirements found in DB for ${destination_country}.`);
                  functionResultContent = JSON.stringify({ 
                      destination_country: destination_country, 
                      message: `No specific entry requirements found for ${destination_country} in the database. Please check official sources.` 
                  });
              }
              // console.log('[API Chatbot] Stringified functionResultContent:', functionResultContent); // Log moved for clarity
              needsSecondOpenAICall = true;
              break;
            // --- END TOOL MODIFICATION ---

            default:
              console.warn(`[API Chatbot] Unknown function call requested: ${functionName}`);
              functionResultContent = JSON.stringify({ error: `Unknown function: ${functionName}` });
          }
        } catch (error: any) {
             console.error(`[API Chatbot] Error executing function ${functionName}:`, error);
             functionResultContent = JSON.stringify({ error: error.message || 'An error occurred during function execution' });
        }

        tool_results.push({
          tool_call_id: call.id,
          role: 'tool',
          content: functionResultContent,
        });
      })); // End Promise.all

      if (needsSecondOpenAICall && tool_results.length > 0) {
        console.log('[API Chatbot] Sending function results back to OpenAI:', JSON.stringify(tool_results, null, 2));

        const secondCompletionMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            ...messagesWithSystemPrompt,
            responseMessage, // Include the initial assistant message with tool_calls
            ...tool_results, // Include the results from the tool calls
        ];

        try {
            const secondCompletion = await openai.chat.completions.create({
                model: 'gpt-4-turbo', // Or your chosen model
                messages: secondCompletionMessages,
                tools: tools,
                tool_choice: 'auto',
            });

            const secondResponseMessage = secondCompletion.choices[0]?.message;
            console.log('[API Chatbot] Raw response from second OpenAI call:', JSON.stringify(secondResponseMessage, null, 2));

            if (secondResponseMessage?.content) {
                finalReply = secondResponseMessage.content;
                console.log('[API Chatbot] Received final response after tool call:', finalReply);
            } else {
                console.log('[API Chatbot] Second OpenAI call did NOT return content.');
                 // Potentially handle cases where the second call results in another tool call (though less likely here)
                if (secondResponseMessage?.tool_calls) {
                     console.log('[API Chatbot] Second OpenAI call resulted in another tool call (unexpected for regulations).');
                     // Handle further tool calls if necessary, or set a fallback
                }
                // If finalReply is still null/empty AND no further action is needed, the fallback below might trigger
            }
         } catch (error: any) {
            console.error('[API Chatbot] Error during second OpenAI call:', error);
             finalReply = 'Sorry, I encountered an issue while processing the information.'; // Set an error reply
         }
      }
    } // End if(toolCalls)

    // Fallback message logic (only if finalReply is still null/empty after potential tool calls)
    if (!finalReply && actionsForFrontend.length > 0 && !needsSecondOpenAICall) {
        finalReply = "Okay, I'll take care of that for you.";
        console.log('[API Chatbot] Using fallback message.');
    } else if (!finalReply) {
        finalReply = "Sorry, I couldn't generate a response. Could you try rephrasing?";
        console.log('[API Chatbot] Using generic error/rephrase message.');
    }

    return NextResponse.json({ reply: finalReply, actions: actionsForFrontend });

  } catch (error: any) {
    console.error('[API Chatbot] Unhandled error in POST handler:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}