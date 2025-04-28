import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
// Keep ChatCompletionTool for type reference if needed, but primary interaction changes
// import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { createClient } from '@supabase/supabase-js'; // Import the standard Supabase client
import { TripData } from '@/store/tripStore'; // Keep TripData type

// Vercel: Increase max duration for Assistants API polling
export const maxDuration = 60; // Allow 60 seconds (adjust as needed up to 300 on Pro)

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
    //console.log(`[Function suggestPlacesOfInterest] Called with location: ${location}, interests: ${interests}, type: ${activity_type}`);
    if (!GOOGLE_PLACES_API_KEY) {
        console.error('[API Chatbot] Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.');
        // Return an empty array or a user-friendly error object instead of throwing
        return [{ error: 'Server configuration error preventing suggestions.' }];
    }

    let queries: string[] = [];
    const baseLocation = `in ${location}`;

    if (activity_type) {
        // Prioritize specific type if given
        queries.push(`pet friendly ${activity_type} ${baseLocation}`);
    } else if (interests && interests.length > 0) {
        // If interests, create a query for the combination, maybe one specific type?
        queries.push(`pet friendly ${interests.join(' or ')} ${baseLocation}`);
        // Add a query for a common pet-friendly type like parks
        if (!interests.some(i => i.toLowerCase().includes('park'))) {
           queries.push(`pet friendly park ${baseLocation}`);
        }
    } else {
        // Default broad query
        queries.push(`pet friendly attractions ${baseLocation}`);
        queries.push(`pet friendly park ${baseLocation}`); // Add park query as default too
    }

    // Limit queries to avoid excessive API calls
    queries = queries.slice(0, 2); // Max 2 queries for now

    const allResults: any[] = [];
    const fetchedPlaceIds = new Set<string>();

    console.log(`[Function suggestPlacesOfInterest] Using queries:`, queries);

    for (const query of queries) {
        const cleanedQuery = query.replace(/[^a-zA-Z0-9\s]/g, ''); // Basic sanitization
        const fields = 'name,formatted_address,vicinity,place_id,rating,types,geometry,photos'; // Add photos
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(cleanedQuery)}&key=${GOOGLE_PLACES_API_KEY}&fields=${fields}`;
        console.log(`[Function suggestPlacesOfInterest] Fetching URL: ${url}`);

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
                console.error('[Function suggestPlacesOfInterest] Google Places API Error:', data.status, data.error_message);
                // Don't throw, just log and continue to next query or return what we have
                continue;
            }

            if (data.results && data.results.length > 0) {
                data.results.forEach((place: any) => {
                   // Add only if place_id is valid and not already added
                   if (place.place_id && !fetchedPlaceIds.has(place.place_id)) {
                       allResults.push(place);
                       fetchedPlaceIds.add(place.place_id);
                   }
                });
            }
        } catch (error: any) {
            console.error(`[Function suggestPlacesOfInterest] Fetch Error for query "${query}":`, error);
            // Don't throw, just log and continue
            continue;
        }
    }

    // Process and map the combined results
    const mappedResults = allResults
        .slice(0, 5) // Limit total results sent back
        .map((place: any) => {
            const placeTypes = place.types || [];
            // Simple heuristic: Parks are generally pet friendly
            const isLikelyPetFriendly = placeTypes.includes('park') || placeTypes.includes('dog_park');
            // Get first photo reference if available
            const photoReference = place.photos?.[0]?.photo_reference;

            return {
                name: place.name,
                location: place.formatted_address || place.vicinity,
                rating: place.rating,
                place_id: place.place_id,
                types: placeTypes, // Include the types array
                coordinates: place.geometry?.location,
                petFriendlyGuess: isLikelyPetFriendly, // Add simple heuristic flag
                photoReference: photoReference // Add photo reference
            };
        });

     console.log(`[Function suggestPlacesOfInterest] Returning ${mappedResults.length} mapped results.`);
    return mappedResults;
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
    //console.log(`[Function checkTravelRegulations] Querying Supabase for ${destination_country}...`);
    const query = supabaseAdmin
        .from('pet_policies')
        .select('slug, entry_requirements')
        .ilike('country_name', destination_country)
        .limit(1);
    // Add potential filters for origin/pet_type here if schema supports
    const { data: dbResult, error: dbError } = await query.single();

    if (dbError && dbError.code !== 'PGRST116') {
        console.error('[API Chatbot] Supabase query error in checkTravelRegulations:', dbError); // Enhanced log
        // Log the error before throwing
        throw new Error(`Failed to fetch regulations from database: ${dbError.message}`);
    }

    if (!dbResult) {
       console.log(`[API Chatbot] No specific pet policies found for: ${destination_country}`);
       const result = { // Create result object first
            destination_country: destination_country,
            message: `No specific entry requirements found for ${destination_country} in the database. Please check official sources.`
        };
       console.log('[API Chatbot][checkTravelRegulations] Returning (not found):', JSON.stringify(result)); // Log before returning
       return result;
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
        console.log('[API Chatbot][checkTravelRegulations] Returning (found):', JSON.stringify(regulationsResult)); // Log before returning
        return regulationsResult;
    } else {
        // This case might be hit if entry_requirements is not an array or empty
        console.log(`[API Chatbot] Policy found for ${destination_country}, but no structured entry requirements.`);
        const result = { // Create result object first
            destination_country: destination_country,
            country_slug: dbResult.slug,
            message: `No specific entry requirements listed for ${destination_country} in the database, but a policy entry exists. Please check official sources or the country page.`
        };
        console.log('[API Chatbot][checkTravelRegulations] Returning (no reqs):', JSON.stringify(result)); // Log before returning
        return result;
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
  let threadId: string | undefined = undefined; // Initialize threadId

  try {
    const body: AssistantChatRequestBody = await req.json();
    const { messageContent, threadId: existingThreadId, tripData } = body;
    const actionsForFrontend: { action: string; payload: any }[] = [];

    if (!messageContent) {
      return NextResponse.json({ error: 'messageContent is required' }, { status: 400 });
    }

    // --- 1. Thread Management ---
    // Assign to the outer scope threadId
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
    //console.log('[API Chatbot] User message added to thread.');

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
    //console.log(`[API Chatbot] Creating run for thread ${threadId} with assistant ${assistantId}`);
    let run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      // Instructions could be overridden here if needed, but usually set on the Assistant
    });
    console.log(`[API Chatbot] Run created: ${run.id}, Status: ${run.status}`);

    // --- 4. Polling Loop ---
    const terminalStates = ["completed", "failed", "cancelled", "expired"];
    const actionState = "requires_action";
    const pollingIntervalMs = 1000; // Check status every 1 second
    const maxWaitTimeMs = 120000; // Max 2 minutes wait (Adjust if needed, but Vercel Hobby timeout is ~10s)
    let elapsedTimeMs = 0;

    while (!terminalStates.includes(run.status) && run.status !== actionState && elapsedTimeMs < maxWaitTimeMs) {
      await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
      elapsedTimeMs += pollingIntervalMs;
      // Only log polling every 5 seconds to reduce noise
      if (elapsedTimeMs % 5000 === 0) {
         console.log(`[API Chatbot] Polling Run Status... (${elapsedTimeMs / 1000}s)`);
      }
      run = await openai.beta.threads.runs.retrieve(threadId, run.id);
      // Log status only if it changes or requires action
      // if (run.status !== /* previousStatus */ || run.status === actionState || terminalStates.includes(run.status)) {
          console.log(`[API Chatbot] Run ${run.id} Status: ${run.status}`);
          // previousStatus = run.status; // Need to track previous status if only logging changes
      // }
    }

     // Check for timeout
    if (!terminalStates.includes(run.status) && run.status !== actionState) {
        console.error(`[API Chatbot] Run polling timed out after ${elapsedTimeMs / 1000}s for run ${run.id}. Status: ${run.status}`);
        // Potentially try to cancel the run?
        // await openai.beta.threads.runs.cancel(threadId, run.id);
        return NextResponse.json({ error: 'Processing your request took too long. Please try again.' }, { status: 504 }); // Gateway Timeout
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
              // Log successful tool output *before* stringifying
              console.log(`[API Chatbot] Tool ${functionName} successful output:`, output);
          } catch (error: any) {
             console.error(`[API Chatbot] Error executing tool ${functionName}:`, error);
             output = { error: `Tool ${functionName} failed. Error: ${error.message}` }; // Include error message
             console.error(`[API Chatbot] Tool ${functionName} error output (pre-stringify):`, output); // Log error output *before* stringify
          }

          // Add logging right before stringifying the output for submission
          console.log(`[API Chatbot] Attempting to stringify output for tool ${functionName}:`, output);
          let stringifiedOutput: string;
          try {
              stringifiedOutput = JSON.stringify(output);
              console.log(`[API Chatbot] Successfully stringified output for ${functionName}.`);
          } catch (stringifyError: any) {
              console.error(`[API Chatbot] !!! FAILED to stringify output for tool ${functionName}:`, stringifyError);
              console.error('[API Chatbot] Original output that failed stringify:', output); // Log the problematic object
              stringifiedOutput = JSON.stringify({ error: `Tool ${functionName} produced output that could not be serialized.` });
          }

          toolOutputs.push({
            tool_call_id: call.id,
            output: stringifiedOutput, // Use the safely stringified version
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
                 while (!terminalStates.includes(run.status) && elapsedTimeMs < maxWaitTimeMs) { // Use same max wait time
                    await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
                    elapsedTimeMs += pollingIntervalMs;
                     // Only log polling every 5 seconds to reduce noise
                    if (elapsedTimeMs % 5000 === 0) {
                       console.log(`[API Chatbot] Polling Run Status after tool submission... (${elapsedTimeMs / 1000}s)`);
                    }
                    run = await openai.beta.threads.runs.retrieve(threadId, run.id);
                     console.log(`[API Chatbot] Run ${run.id} Status after tool submission: ${run.status}`);
                }

                 // Check for timeout again after tool submission polling
                 if (!terminalStates.includes(run.status)) {
                    console.error(`[API Chatbot] Run polling timed out after tool submission (${elapsedTimeMs / 1000}s) for run ${run.id}. Status: ${run.status}`);
                    return NextResponse.json({ error: 'Processing your request took too long after tool execution. Please try again.' }, { status: 504 });
                 }

            } catch(submitError: any) {
                 console.error(`[API Chatbot] Error submitting tool outputs for run ${run.id}:`, submitError);
                 // Let the final status check handle it.
            }
        } else {
             console.warn(`[API Chatbot] Run ${run.id} required actions but no tool outputs were generated.`);
             // Handle this case - maybe cancel the run? Could cause run to fail.
        }
      } else {
           console.warn(`[API Chatbot] Run ${run.id} status is 'requires_action' but no tool calls found.`);
            // Handle this unexpected state
      }
    } // End if (run.status === actionState)

    // --- 6. Handle Final Run Status ---
    // Now check the definitive final status after all polling and potential tool submissions
    if (run.status === "completed") {
        console.log(`[API Chatbot] Run ${run.id} completed. Fetching messages...`); // ++ LOGGING
        const messages = await openai.beta.threads.messages.list(threadId, { order: 'desc', limit: 1 });
        console.log(`[API Chatbot] Fetched messages for ${threadId}. Message count: ${messages.data.length}`); // ++ LOGGING

        const assistantMessage = messages.data.find(m => m.role === 'assistant');

        if (assistantMessage && assistantMessage.content.length > 0) {
            // Handle different content types (e.g., text)
            const firstContent = assistantMessage.content[0];
            if (firstContent?.type === 'text') {
                finalReply = firstContent.text.value;
                console.log('[API Chatbot] Extracted final reply text.', { length: finalReply.length }); // ++ LOGGING (Avoid logging full potentially long reply)
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
       console.error(`[API Chatbot] Run ${run.id} did not complete successfully. Final status: ${run.status}`); // ++ LOGGING
       let userFriendlyError = "Sorry, I encountered an issue processing your request.";
       if (run.last_error) {
           console.error(`[API Chatbot] Run ${run.id} failed detail: ${run.last_error.code} - ${run.last_error.message}`);
           // Provide more specific user feedback if possible based on code
           if (run.last_error.code === 'rate_limit_exceeded') {
               userFriendlyError = "I'm experiencing high traffic right now. Please try again in a moment.";
           } else if (run.last_error.code === 'server_error') {
                userFriendlyError = `An internal error occurred on the AI provider's side (Status: ${run.status}). Please try again later.`;
           } else {
               userFriendlyError = `Sorry, something went wrong on my end (Status: ${run.status}). Please try again.`; // Generic fallback
           }
       } else {
            // Handle cases like 'cancelled' or 'expired' which might not have last_error
           userFriendlyError = `Sorry, the process didn't complete successfully (Status: ${run.status}). Please try again.`;
       }
       finalReply = userFriendlyError;
       // IMPORTANT: Still need to return JSON even on error
       console.log(`[API Chatbot] Sending error JSON response for thread ${threadId}...`); // ++ LOGGING
       return NextResponse.json({
            reply: finalReply, // Send the user-friendly error message
            actions: actionsForFrontend, // Usually empty here, but send anyway
            threadId: threadId // Send thread ID if available
        }, { status: 500 }); // Internal Server Error status
    }

    // --- 7. Construct Success Response ---
    console.log(`[API Chatbot] Attempting to send final success JSON response for thread ${threadId}...`); // ++ LOGGING
    return NextResponse.json({
        reply: finalReply,
        actions: actionsForFrontend,
        threadId: threadId
    });

  } catch (error: any) {
    console.error('[API Chatbot] Unhandled error in POST handler:', error); // ++ LOGGING (Log the actual error object)
    // Check for specific OpenAI API errors if needed
    // if (error instanceof OpenAI.APIError) { ... }

    // Ensure this critical catch block ALWAYS returns valid JSON
    console.log(`[API Chatbot] Sending critical error JSON response for thread ${threadId}...`); // ++ LOGGING
    return NextResponse.json({
        error: 'Sorry, an unexpected error occurred on the server. Please try again later.',
        reply: null, // Explicitly null reply on critical failure
        actions: [],
        threadId: threadId // Include threadId if available
     }, { status: 500 });
  }
}