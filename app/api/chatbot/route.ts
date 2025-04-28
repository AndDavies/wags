import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
// Keep ChatCompletionTool for type reference if needed, but primary interaction changes
// import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { createClient } from '@supabase/supabase-js'; // Import the standard Supabase client
import { TripData } from '@/store/tripStore'; // Keep TripData type

// Ensure your OpenAI API key is set in environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase Service Client setup (Keep as is)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
    : null;

// --- Define expected request structure for Assistant API ---
interface AssistantChatRequestBody {
  messageContent: string; // Just the user's new message
  threadId?: string;     // Optional ID of the existing conversation thread
  tripData?: TripData;   // Current trip context
}

// --- Keep Tool Implementation Functions (suggestPlacesOfInterest, findService) ---
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function suggestPlacesOfInterest(location: string, interests?: string[], activity_type?: string): Promise<any[]> {
  console.log(`[Function suggestPlacesOfInterest] Called with location: ${location}, interests: ${interests}, type: ${activity_type}`);
  if (!GOOGLE_PLACES_API_KEY) {
    console.error('[API Chatbot] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
    throw new Error('Server configuration error: Missing Google Maps API key.');
  }
  let query = `pet friendly ${activity_type || 'attractions'} in ${location}`;
  if (!activity_type && interests && interests.length > 0) {
      query = `pet friendly ${interests.join(' or ')} in ${location}`;
  }
  query = query.replace(/[^a-zA-Z0-9\s]/g, '');
  const fields = 'name,formatted_address,vicinity,place_id,rating,types,geometry';
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&fields=${fields}`;
  console.log(`[Function suggestPlacesOfInterest] Fetching URL: ${url}`);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Function suggestPlacesOfInterest] Google Places API Error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    if (!data.results || data.results.length === 0) return [];
    const mappedResults = data.results.slice(0, 5).map((place: any) => ({
      name: place.name,
      location: place.formatted_address || place.vicinity,
      rating: place.rating,
      place_id: place.place_id,
      types: place.types,
      coordinates: place.geometry?.location
    }));
    return mappedResults;
  } catch (error: any) {
    console.error('[Function suggestPlacesOfInterest] Fetch Error:', error);
    throw new Error(`Failed to fetch activity suggestions: ${error.message}`);
  }
}

async function findService(location: string, service_type: string): Promise<any[]> {
  console.log(`[Function findService] Called with location: ${location}, type: ${service_type}`);
   if (!GOOGLE_PLACES_API_KEY) {
    console.error('[API Chatbot] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
    throw new Error('Server configuration error: Missing Google Maps API key.');
  }

  // Map service type to a query string
  // Replace underscores for better search results, e.g., veterinary_care -> veterinary care
  const query = `${service_type.replace(/_/g, ' ')} in ${location}`;
  
  // Use Text Search API endpoint
  const fields = 'name,formatted_address,vicinity,place_id,rating,geometry,formatted_phone_number'; // Keep relevant fields
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&fields=${fields}`;
  
  console.log(`[Function findService] Fetching URL (Text Search): ${url}`);
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[Function findService] Google Places API Error:', data.status, data.error_message);
      // Provide a slightly more informative error message if possible
      const errorMessage = data.error_message ? `${data.status} - ${data.error_message}` : `${data.status} - Unknown error`;
      throw new Error(`Google Places API error: ${errorMessage}`);
    }
    if (!data.results || data.results.length === 0) return [];
    // Map results (vicinity might be less useful now, formatted_address might be better)
    const mappedResults = data.results.slice(0, 5).map((place: any) => ({
      name: place.name,
      location: place.formatted_address || place.vicinity, // Prefer formatted_address
      phone: place.formatted_phone_number,
      rating: place.rating,
      place_id: place.place_id,
      coordinates: place.geometry?.location
    }));
    return mappedResults;
  } catch (error: any) {
      console.error('[Function findService] Fetch Error:', error);
      // Pass the original error message up
      throw new Error(`Failed to find nearby services: ${error.message}`);
  }
}

// Keep checkTravelRegulations function (assuming it will be called as a tool)
async function checkTravelRegulations(destination_country: string, origin_country?: string, pet_type?: string): Promise<any> {
    if (!supabaseAdmin) {
        console.error('[API Chatbot] Supabase Admin client not initialized.');
        throw new Error('Database connection is not configured on the server.');
    }
    if (!destination_country) {
        throw new Error('Destination country is required for checking regulations.');
    }
    console.log(`[Function checkTravelRegulations] Querying Supabase for ${destination_country}...`);
    const query = supabaseAdmin
        .from('pet_policies')
        .select('slug, entry_requirements')
        .ilike('country_name', destination_country)
        .limit(1);
    // Add potential filters for origin/pet_type here if schema supports
    const { data: dbResult, error: dbError } = await query.single();

    if (dbError && dbError.code !== 'PGRST116') {
        console.error('[API Chatbot] Supabase query error:', dbError);
        throw new Error(`Failed to fetch regulations from database: ${dbError.message}`);
    }

    if (dbResult && Array.isArray(dbResult.entry_requirements) && dbResult.entry_requirements.length > 0) {
        const MAX_TEXT_LENGTH = 150;
        const truncatedRequirements = dbResult.entry_requirements.map((req: any) => {
            if (req.label && req.text) {
                const truncatedText = req.text.length > MAX_TEXT_LENGTH
                    ? req.text.substring(0, MAX_TEXT_LENGTH) + '...'
                    : req.text;
                return { label: req.label, text: truncatedText };
            }
            return null;
        }).filter(Boolean);
        const regulationsResult = {
            destination_country: destination_country,
            country_slug: dbResult.slug,
            requirements: truncatedRequirements
        };
        return regulationsResult;
    } else {
        return {
            destination_country: destination_country,
            message: `No specific entry requirements found for ${destination_country} in the database. Please check official sources.`
        };
    }
}


// --- API Route Handler ---

export async function POST(req: NextRequest) {
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  if (!assistantId) {
      console.error('[API Chatbot] Error: OPENAI_ASSISTANT_ID is not set.');
      return NextResponse.json({ error: 'Server configuration error: Assistant ID missing.' }, { status: 500 });
  }

  // Declare finalReply at the start of the main try block
  let finalReply: string | null = null; 

  try {
    const body: AssistantChatRequestBody = await req.json();
    const { messageContent, threadId: existingThreadId, tripData } = body;
    const actionsForFrontend: { action: string; payload: any }[] = [];

    if (!messageContent) {
      return NextResponse.json({ error: 'messageContent is required' }, { status: 400 });
    }

    // --- 1. Thread Management ---
    let threadId: string;
    if (existingThreadId) {
        console.log(`[API Chatbot] Using existing thread: ${existingThreadId}`);
        threadId = existingThreadId;
        // Potentially check if thread still exists using openai.beta.threads.retrieve(existingThreadId), but skip for brevity
    } else {
        console.log('[API Chatbot] Creating new thread...');
        const thread = await openai.beta.threads.create();
        threadId = thread.id;
        console.log(`[API Chatbot] New thread created: ${threadId}`);
    }

    // --- 2. Add Messages (User + Context) ---
    // Add the actual user message
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: messageContent,
    });
    console.log('[API Chatbot] User message added to thread.');

    // Add TripData as context - IMPORTANT: Assistant Instructions must tell it to use this!
    if (tripData) {
         // Limit the size/depth of tripData if necessary

         // --- Create a simplified itinerary summary --- 
         let itinerarySummary = null;
         if (tripData.itinerary && tripData.itinerary.days && tripData.itinerary.days.length > 0) {
             itinerarySummary = tripData.itinerary.days.map(day => ({
                 day: day.day,
                 date: day.date, // Keep date for temporal reference
                 city: day.city,
                 // Extract names of key activities (e.g., accommodation, flights, transfers, maybe first/last activity)
                 keyActivities: day.activities
                     ?.filter(act => 
                         act.type === 'accommodation' || 
                         act.type === 'flight' || 
                         act.type === 'transfer' ||
                         act === day.activities[0] || // Include first activity
                         act === day.activities[day.activities.length - 1] // Include last activity
                     )
                     .map(act => ({ name: act.name, type: act.type, location: act.location })) // Include name, type, and location
                     ?? [], // Handle case where activities might be null/undefined
                 activityCount: day.activities?.length ?? 0,
             }));
         }
         // --- End simplified itinerary summary ---

         const contextTripData = {
            destination: tripData.destination,
            destinationCountry: tripData.destinationCountry,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            interests: tripData.interests,
            pets: tripData.pets,
            petDetails: tripData.petDetails,
            itinerarySummary: itinerarySummary, // <-- Include the summary here
         };

        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          // Use a clear prefix so the assistant knows this is context, not a direct user query
          content: `CONTEXT UPDATE:\nCurrent trip data: ${JSON.stringify(contextTripData)}\nRefer to this context when answering the latest user message.`,
          // Consider message attachments if supported and useful for large contexts
        });
        console.log('[API Chatbot] TripData context added to thread.');
    }

    // --- 3. Create and Run ---
    console.log(`[API Chatbot] Creating run for thread ${threadId} with assistant ${assistantId}`);
    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      // Instructions could be overridden here if needed, but usually set on the Assistant
    });
    console.log(`[API Chatbot] Run created: ${run.id}, Status: ${run.status}`);

    // --- 4. Polling Loop ---
    const terminalStates = ["completed", "failed", "cancelled", "expired"];
    const actionState = "requires_action";
    const pollingIntervalMs = 1000; // Check status every 1 second
    const maxWaitTimeMs = 120000; // Max 2 minutes wait
    let elapsedTimeMs = 0;

    while (!terminalStates.includes(run.status) && run.status !== actionState && elapsedTimeMs < maxWaitTimeMs) {
      await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
      elapsedTimeMs += pollingIntervalMs;
      console.log(`[API Chatbot] Polling Run Status... (${elapsedTimeMs / 1000}s)`);
      run = await openai.beta.threads.runs.retrieve(threadId, run.id);
      console.log(`[API Chatbot] Run ${run.id} Status: ${run.status}`);
    }

    // --- 5. Handle requires_action ---
    if (run.status === actionState) {
      console.log(`[API Chatbot] Run requires action: ${run.id}`);
      const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];
      const requiredActions = run.required_action?.submit_tool_outputs.tool_calls;

      if (requiredActions) {
         console.log(`[API Chatbot] Required actions: ${requiredActions.length}`);
        // Use Promise.all to run tools in parallel
        await Promise.all(requiredActions.map(async (call) => {
          const functionName = call.function.name;
          const functionArgs = JSON.parse(call.function.arguments || '{}');
          let output: any = null;
          console.log(`[API Chatbot] Executing tool: ${functionName}`, functionArgs);

          try {
             switch (functionName) {
                case 'suggest_places_of_interest':
                  output = await suggestPlacesOfInterest(functionArgs.location, functionArgs.interests, functionArgs.activity_type);
                  break;
                case 'find_nearby_service':
                  output = await findService(functionArgs.location, functionArgs.service_type);
                  break;
                case 'check_travel_regulations':
                   output = await checkTravelRegulations(functionArgs.destination_country, functionArgs.origin_country, functionArgs.pet_type);
                  break;

                // --- Frontend Delegation ---
                case 'add_activity_to_day':
                    actionsForFrontend.push({ action: functionName, payload: functionArgs });
                    // Submit confirmation back to Assistant
                    output = { status: "success", message: `Delegated '${functionName}' to frontend.` };
                    break;
                 case 'save_trip_progress':
                     actionsForFrontend.push({ action: functionName, payload: {} });
                     output = { status: "success", message: `Delegated '${functionName}' to frontend.` };
                     break;
                 case 'get_trip_details': // If Assistant asks for it explicitly
                    // Provide the tripData context it should already have (or relevant parts)
                    const contextData = tripData ? {
                       destination: tripData.destination,
                       destinationCountry: tripData.destinationCountry,
                       startDate: tripData.startDate,
                       endDate: tripData.endDate,
                       interests: tripData.interests,
                       hasItinerary: !!tripData.itinerary?.days?.length
                    } : { message: "No current trip data available from client." };
                    output = contextData;
                    break;
                // --- Add other tool cases here ---

                default:
                  console.warn(`[API Chatbot] Unknown function call requested: ${functionName}`);
                  output = { error: `Unknown function: ${functionName}` };
              }
              console.log(`[API Chatbot] Tool ${functionName} output generated.`);
          } catch (error: any) {
             console.error(`[API Chatbot] Error executing tool ${functionName}:`, error);
             // Only set the output for the tool submission, don't set finalReply here
             output = { error: `Tool ${functionName} failed. Please inform the user.` };
          }

          toolOutputs.push({
            tool_call_id: call.id,
            output: JSON.stringify(output), // Output MUST be a string
          });
        })); // End Promise.all map

        // Submit outputs if any were generated
        if (toolOutputs.length > 0) {
            console.log('[API Chatbot] Submitting tool outputs...');
            try {
                 run = await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
                    tool_outputs: toolOutputs,
                });
                console.log(`[API Chatbot] Tool outputs submitted. Run Status: ${run.status}`);

                // Continue polling after submitting outputs
                elapsedTimeMs = 0; // Reset timer for the post-tool-submission wait
                while (!terminalStates.includes(run.status) && elapsedTimeMs < maxWaitTimeMs) {
                    await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
                    elapsedTimeMs += pollingIntervalMs;
                    console.log(`[API Chatbot] Polling Run Status after tool submission... (${elapsedTimeMs / 1000}s)`);
                    run = await openai.beta.threads.runs.retrieve(threadId, run.id);
                    console.log(`[API Chatbot] Run ${run.id} Status: ${run.status}`);
                }
            } catch(submitError: any) {
                 console.error(`[API Chatbot] Error submitting tool outputs for run ${run.id}:`, submitError);
                 // Don't try to cancel or set finalReply here. Let the final status check handle it.
                 // We just log the error and let the run likely proceed to a failed state.
            }
        } else {
             console.warn(`[API Chatbot] Run ${run.id} required actions but no tool outputs were generated.`);
             // Handle this case - maybe cancel the run?
        }
      } else {
           console.warn(`[API Chatbot] Run ${run.id} status is 'requires_action' but no tool calls found.`);
            // Handle this unexpected state
      }
    } // End if (run.status === actionState)

    // --- 6. Handle Final Run Status ---
    // Now check the definitive final status after all polling and potential tool submissions
    if (run.status === "completed") {
      console.log(`[API Chatbot] Run ${run.id} completed.`);
      const messages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 1 });
      const assistantMessage = messages.data.find(m => m.role === 'assistant');

      if (assistantMessage && assistantMessage.content.length > 0) {
          // Handle different content types (e.g., text)
          const firstContent = assistantMessage.content[0];
          if (firstContent?.type === 'text') {
              finalReply = firstContent.text.value;
              console.log('[API Chatbot] Final reply:', finalReply);
          } else {
              console.warn('[API Chatbot] Assistant message content is not text:', firstContent);
               finalReply = "I received a response, but couldn't display it.";
          }
      } else {
          console.warn('[API Chatbot] Run completed but no assistant message found or content empty.');
          finalReply = "I finished processing, but didn't generate a message.";
      }
    } else { 
       // --- Handle ALL non-completed final states (failed, cancelled, expired, etc.) ---
       console.error(`[API Chatbot] Run ${run.id} did not complete. Final status: ${run.status}`);
       let userFriendlyError = "Sorry, I encountered an issue processing your request.";
       if (run.last_error) {
           console.error(`[API Chatbot] Run ${run.id} failed detail: ${run.last_error.code} - ${run.last_error.message}`);
           if (run.last_error.code === 'rate_limit_exceeded') {
               userFriendlyError = "I'm experiencing high traffic right now. Please try again in a moment.";
           } else {
               userFriendlyError = `Sorry, something went wrong on my end (Status: ${run.status}). Please try again.`; // Include status
           }
       } else {
           userFriendlyError = `Sorry, the process didn't complete successfully (Status: ${run.status}). Please try again.`; // Include status
       }
       finalReply = userFriendlyError;
    }

    // --- 7. Construct Response ---
    return NextResponse.json({
        reply: finalReply,
        actions: actionsForFrontend,
        threadId: threadId
    });

  } catch (error: any) {
    console.error('[API Chatbot] Unhandled error in POST handler:', error);
    // Check for specific OpenAI API errors if needed
    // if (error instanceof OpenAI.APIError) { ... }
    // Avoid exposing detailed internal errors to the client
    return NextResponse.json({ error: 'Sorry, an unexpected error occurred on the server. Please try again later.' }, { status: 500 });
  }
}