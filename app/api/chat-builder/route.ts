import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TripData } from '@/store/tripStore'; // Keep TripData type

// Vercel: Increase max duration for Assistants API polling
export const maxDuration = 180; // Allow 3 minutes (adjust as needed)

// Ensure your OpenAI API key is set in environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * Tries to parse potentially fuzzy date descriptions.
 * Attempts YYYY-MM-DD, common month names, and falls back to original string.
 * @param dateString The user's date description.
 * @returns A string (YYYY-MM-DD, YYYY-MM, Month Name, or original) or the original string if parsing fails.
 */
function parseDate(dateString: string): string {
   const cleanString = dateString.trim().toLowerCase();
   console.log(`[API Chat Builder] Attempting to parse date: ${cleanString}`);

   // 1. Check for YYYY-MM-DD format
   const yyyyMmDdRegex = /^\d{4}-\d{2}-\d{2}$/;
   if (yyyyMmDdRegex.test(cleanString)) {
       console.log(`[API Chat Builder] Parsed as YYYY-MM-DD: ${cleanString}`);
       return cleanString; // Already in correct format
   }

   // 2. Attempt basic Date constructor parsing (handles many simple formats)
   try {
      const date = new Date(dateString); // Use original string for Date constructor
      // Check if the parsed date is valid AND seems reasonable (e.g., not 1970)
      if (!isNaN(date.getTime()) && date.getFullYear() > 1970) {
          const formattedDate = date.toISOString().split('T')[0];
          console.log(`[API Chat Builder] Parsed via Date constructor to YYYY-MM-DD: ${formattedDate}`);
          return formattedDate;
      }
   } catch (e) {
      // Ignore errors, try next method
   }

   // 3. Check for Month names (case-insensitive)
   const months: { [key: string]: string } = {
       january: '01', feb: '02', february: '02', mar: '03', march: '03', apr: '04', april: '04', may: '05',
       jun: '06', june: '06', jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09',
       oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12'
   };
   const monthMatch = Object.keys(months).find(m => cleanString.includes(m));
   if (monthMatch) {
       const currentYear = new Date().getFullYear();
       // Basic assumption: if just month name, assume this year
       // TODO: Handle cases like "June next year"
       const year = cleanString.includes('next year') ? currentYear + 1 : currentYear;
       const monthNum = months[monthMatch];
       // Return YYYY-MM for now, frontend can decide how to display
       const formattedMonth = `${year}-${monthNum}`;
       console.log(`[API Chat Builder] Parsed as Month (YYYY-MM): ${formattedMonth}`);
       return formattedMonth; 
   }

   // TODO: Add logic for relative terms ("next week", "tomorrow", "summer")
   // TODO: Add logic for durations ("for 3 days", "a week") - might need startDate context

   // 4. Fallback: Return the original cleaned string if no parsing worked
   console.log(`[API Chat Builder] Could not parse date, returning original: ${cleanString}`);
   return cleanString; 
}

// --- Placeholder for external function calls (like Google Places) ---
async function findPointsOfInterestApiCall(query: string, location: string): Promise<any> {
    console.log(`[API Chat Builder] TODO: Implement API call to find points of interest for query: "${query}" in location: "${location}"`);
    // Replace with actual Google Places API call logic
    // Example dummy response:
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    return {
        status: "success",
        results: [
            { name: `Suggested Park near ${location}`, type: "park" },
            { name: `Suggested Cafe near ${location}`, type: "cafe" },
        ]
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
  let currentThreadId: string | undefined = undefined; // To store/pass back the thread ID

  try {
    const body: ChatBuilderRequestBody = await req.json();
    let { messageContent, threadId: existingThreadId, currentTripData } = body;
    let trip = currentTripData || {}; // Use empty object if null

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
    if (existingThreadId) {
        console.log(`[API Chat Builder] Using existing thread: ${existingThreadId}`);
        currentThreadId = existingThreadId;
        // Optional: Verify thread exists openai.beta.threads.retrieve(existingThreadId);
    } else {
        console.log('[API Chat Builder] Creating new thread...');
        const thread = await openai.beta.threads.create();
        currentThreadId = thread.id;
        console.log(`[API Chat Builder] New thread created: ${currentThreadId}`);
    }
    responseData.threadId = currentThreadId; // Ensure thread ID is passed back

    // 2. Add Messages (User + Context)
    // Add the actual user message
    await openai.beta.threads.messages.create(currentThreadId, {
      role: "user",
      content: messageContent,
    });
    console.log('[API Chat Builder] User message added to thread.');

    // Add TripData as context (simplified) - Assistant Instructions MUST tell it to use this!
    if (currentTripData) {
        const contextTripData = {
            destination: currentTripData.destination,
            destinationCountry: currentTripData.destinationCountry,
            startDate: currentTripData.startDate,
            endDate: currentTripData.endDate,
            adults: currentTripData.adults,
            children: currentTripData.children,
            pets: currentTripData.pets,
            budget: currentTripData.budget,
            accommodation: currentTripData.accommodation,
            interests: currentTripData.interests,
            // Flag if essentials are collected - helps Assistant know the state
            essentialsCollected: !!(currentTripData.destination && currentTripData.destinationCountry && currentTripData.startDate && currentTripData.endDate),
            travelersCollected: !!(currentTripData.adults !== undefined && currentTripData.children !== undefined && currentTripData.pets !== undefined),
            // Include the special flag if present
            sourceFlag: currentTripData.additionalInfo === 'SYSTEM_FLAG: Example trip loaded.' ? 'example_trip_loaded' : null
        };
        await openai.beta.threads.messages.create(currentThreadId, {
          role: "user", // Use 'user' role for context messages as per best practices now
          content: `CONTEXT UPDATE:\nCurrent trip planning state: ${JSON.stringify(contextTripData)}\nUse this state to determine the next question or action.`,
        });
        console.log('[API Chat Builder] TripData context added to thread.');
    }

    // 3. Create and Run
    console.log(`[API Chat Builder] Creating run for thread ${currentThreadId} with assistant ${CONVERSATIONAL_ASSISTANT_ID}`);
    let run = await openai.beta.threads.runs.create(currentThreadId, {
      assistant_id: CONVERSATIONAL_ASSISTANT_ID,
      // Instructions are primarily set on the Assistant itself
      // We could add additional_instructions here if needed per-run
    });
    console.log(`[API Chat Builder] Run created: ${run.id}, Status: ${run.status}`);

    // 4. Polling Loop
    const terminalStates = ["completed", "failed", "cancelled", "expired", "requires_action"];
    const pollingIntervalMs = 1000;
    const maxWaitTimeMs = maxDuration * 1000 - 5000; // Max duration minus buffer
    let elapsedTimeMs = 0;
    let lastLoggedStatus = run.status;

    while (!terminalStates.includes(run.status) && elapsedTimeMs < maxWaitTimeMs) {
      await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
      elapsedTimeMs += pollingIntervalMs;
      run = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);

      if (run.status !== lastLoggedStatus) {
          console.log(`[API Chat Builder] Run ${run.id} Status: ${run.status}`);
          lastLoggedStatus = run.status;
      } else if (elapsedTimeMs % 10000 === 0) { // Log progress every 10s if status hasn't changed
          console.log(`[API Chat Builder] Run ${run.id} still '${run.status}'... (${elapsedTimeMs / 1000}s)`);
      }
    }

     // Check for timeout
    if (!terminalStates.includes(run.status)) {
        console.error(`[API Chat Builder] Run polling timed out after ${elapsedTimeMs / 1000}s for run ${run.id}. Status: ${run.status}`);
        try { await openai.beta.threads.runs.cancel(currentThreadId, run.id); } catch (cancelError) { console.error("Error cancelling run:", cancelError); }
        responseData.reply = 'Sorry, the request took too long to process. Please try again.';
        return NextResponse.json(responseData, { status: 504 }); // Gateway Timeout
    }

    // 5. Handle requires_action
    if (run.status === "requires_action") {
      const requiredActions = run.required_action?.submit_tool_outputs.tool_calls;
      if (!requiredActions) {
          throw new Error("Run requires action, but no tool calls were provided.");
      }

      console.log(`[API Chat Builder] Run requires action. Tool calls: ${requiredActions.length}`);
      const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];

      // Process tool calls (can be parallelized if needed)
      for (const call of requiredActions) {
          const functionName = call.function.name;
          let output: any = null;
          let args: any = {};
          try {
             args = JSON.parse(call.function.arguments || '{}');
             console.log(`[API Chat Builder] Executing tool: ${functionName}`, args);

          switch (functionName) {
            case "set_destination":
              if (args.destination) updatedDataAccumulator.destination = args.destination;
              if (args.destinationCountry) updatedDataAccumulator.destinationCountry = args.destinationCountry;
                    output = { status: "success", message: `Destination set to ${args.destination}, ${args.destinationCountry}` };
              break;
            case "set_travel_dates":
                    // Use parseDate helper for potentially fuzzy dates from AI
              if (args.startDate) updatedDataAccumulator.startDate = parseDate(args.startDate);
              if (args.endDate) updatedDataAccumulator.endDate = parseDate(args.endDate);
                    output = { status: "success", message: `Dates set: ${args.startDate} to ${args.endDate}` };
              break;
            case "set_travelers":
              if (args.adults !== undefined) updatedDataAccumulator.adults = args.adults;
                    // Ensure children defaults to 0 if not provided by AI, despite schema requiring it
              updatedDataAccumulator.children = args.children !== undefined ? args.children : 0;
              if (args.pets !== undefined) updatedDataAccumulator.pets = args.pets;
                    output = { status: "success", message: `Travelers set: ${args.adults} adults, ${updatedDataAccumulator.children} children, ${args.pets} pets` };
              break;
            case "set_preferences":
                    // Update only provided preferences
              if (args.budget) updatedDataAccumulator.budget = args.budget;
                    // Handle potential empty arrays based on strict schema
                    if (args.accommodation !== undefined) updatedDataAccumulator.accommodation = Array.isArray(args.accommodation) ? args.accommodation.join(', ') : '';
                    if (args.interests !== undefined) updatedDataAccumulator.interests = Array.isArray(args.interests) ? args.interests : [];
                    output = { status: "success", message: "Preferences updated." };
                    break;
                case "find_points_of_interest":
                    // ** Placeholder / Actual Implementation Needed **
                    const poiResult = await findPointsOfInterestApiCall(args.query, args.location);
                    output = poiResult; // Submit the results from the API call
                    break;
                 case "add_interest_or_preference":
                    if (args.interest_to_add) {
                        const interest = args.interest_to_add;
                        // Safely get current interests or initialize empty array
                        const currentInterests = Array.isArray(updatedDataAccumulator.interests)
                            ? updatedDataAccumulator.interests
                            : (Array.isArray(trip?.interests) ? [...trip.interests] : []);

                        if (!currentInterests.includes(interest)) {
                            updatedDataAccumulator.interests = [...currentInterests, interest];
                             output = { status: "success", message: `Interest '${interest}' added.` };
                        } else {
                            output = { status: "success", message: `Interest '${interest}' already present.` };
                        }
                    } else {
                         output = { status: "error", message: "'interest_to_add' argument missing." };
              }
              break;
            case "generate_itinerary":
                    console.log("[API Chat Builder] Tool call: generate_itinerary received.");
                    // Check essential fields before setting trigger flag
              const finalTripStateForGenCheck = { ...trip, ...updatedDataAccumulator };
                    if (finalTripStateForGenCheck.destination && finalTripStateForGenCheck.destinationCountry && finalTripStateForGenCheck.startDate && finalTripStateForGenCheck.endDate) {
                  responseData.triggerItineraryGeneration = true;
                        output = { status: "success", message: "Itinerary generation triggered for frontend." };
              } else {
                        console.warn("[API Chat Builder] 'generate_itinerary' called, but essentials missing.");
                        // Let Assistant handle replying about missing info
                        output = { status: "error", message: "Essential fields (destination, country, dates) missing. Cannot generate." };
                        // Clear the trigger flag if it was accidentally set
                        responseData.triggerItineraryGeneration = false;
              }
              break;
            default:
              console.warn(`[API Chat Builder] Unhandled tool call: ${functionName}`);
                  output = { status: "error", message: `Unknown function: ${functionName}` };
              }
          } catch (toolError: any) {
              console.error(`[API Chat Builder] Error processing tool ${functionName} (args: ${call.function.arguments}):`, toolError);
              output = { status: "error", message: `Failed to execute ${functionName}. Error: ${toolError.message}` };
          }

          toolOutputs.push({
            tool_call_id: call.id,
            output: JSON.stringify(output), // Output must be a string
          });
      } // End for loop

      // Submit outputs
      if (toolOutputs.length > 0) {
          console.log('[API Chat Builder] Submitting tool outputs...');
          try {
               run = await openai.beta.threads.runs.submitToolOutputs(currentThreadId, run.id, {
                  tool_outputs: toolOutputs,
              });
              console.log(`[API Chat Builder] Tool outputs submitted. New Run Status: ${run.status}`);

              // --- Continue Polling after submission ---
              elapsedTimeMs = 0; // Reset timer
              lastLoggedStatus = run.status;
              while (!terminalStates.includes(run.status) && elapsedTimeMs < maxWaitTimeMs) {
                  await new Promise(resolve => setTimeout(resolve, pollingIntervalMs));
                  elapsedTimeMs += pollingIntervalMs;
                  run = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
                  if (run.status !== lastLoggedStatus) {
                     console.log(`[API Chat Builder] Run ${run.id} Status (Post-Submit): ${run.status}`);
                     lastLoggedStatus = run.status;
                  } else if (elapsedTimeMs % 10000 === 0) {
                      console.log(`[API Chat Builder] Run ${run.id} still '${run.status}' (Post-Submit)... (${elapsedTimeMs / 1000}s)`);
                  }
              }
              // Check for timeout again
              if (!terminalStates.includes(run.status)) {
                  console.error(`[API Chat Builder] Run polling timed out after tool submission (${elapsedTimeMs / 1000}s) for run ${run.id}. Status: ${run.status}`);
                  try { await openai.beta.threads.runs.cancel(currentThreadId, run.id); } catch (cancelError) { console.error("Error cancelling run:", cancelError);}
                  responseData.reply = 'Sorry, the request took too long after processing tools. Please try again.';
                  return NextResponse.json(responseData, { status: 504 });
              }
              // --- End Continuous Polling ---

          } catch(submitError: any) {
               console.error(`[API Chat Builder] Error submitting tool outputs for run ${run.id}:`, submitError);
               // Let the final status check handle potential failure
               // Fall through to check run status below
          }
      } // End if (toolOutputs.length > 0)
    } // End if (run.status === "requires_action")


    // 6. Handle Final Run Status
    if (run.status === "completed") {
        console.log(`[API Chat Builder] Run ${run.id} completed. Fetching messages...`);
        const messages = await openai.beta.threads.messages.list(currentThreadId, { order: 'desc', limit: 1 });
        const assistantMessage = messages.data.find(m => m.role === 'assistant');

        if (assistantMessage && assistantMessage.content.length > 0) {
            const firstContent = assistantMessage.content[0];
            if (firstContent?.type === 'text') {
                responseData.reply = firstContent.text.value;
                console.log('[API Chat Builder] Extracted final reply text.');
                 // Add accumulated updates ONLY if generation wasn't triggered in this step
                if (Object.keys(updatedDataAccumulator).length > 0 && !responseData.triggerItineraryGeneration) {
                   responseData.updatedTripData = updatedDataAccumulator;
                 }
            } else {
                 responseData.reply = "Received a non-text response.";
            }
        } else {
            // This can happen if the *only* action was triggering generation
            if (responseData.triggerItineraryGeneration) {
                responseData.reply = "Okay, generating your itinerary now..."; // Provide a default reply
      } else {
                console.warn('[API Chat Builder] Run completed but no assistant message content found.');
                responseData.reply = "Processing complete.";
            }
        }
    } else {
       // Handle ALL non-completed final states (failed, cancelled, expired, etc.)
       console.error(`[API Chat Builder] Run ${run.id} did not complete successfully. Final status: ${run.status}`);
       let userFriendlyError = "Sorry, I encountered an issue processing your request.";
       if (run.last_error) {
           console.error(`[API Chat Builder] Run ${run.id} failed detail: ${run.last_error.code} - ${run.last_error.message}`);
           userFriendlyError = `Processing failed (${run.last_error.code}). Please try again.`;
       } else {
            userFriendlyError = `Processing did not complete (Status: ${run.status}). Please try again.`;
       }
       responseData.reply = userFriendlyError;
       // Still return accumulated data if any, might be useful for debug/retry
    if (Object.keys(updatedDataAccumulator).length > 0) {
      responseData.updatedTripData = updatedDataAccumulator;
       }
       return NextResponse.json(responseData, { status: run.status === 'failed' ? 500 : 503 }); // Use appropriate error code
    }

    // 7. Construct Success Response
    console.log('[API Chat Builder] Final Response Data:', responseData);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[API Chat Builder] Unhandled Error in POST handler:', error);
    // Ensure responseData has threadId if available
    if (currentThreadId) responseData.threadId = currentThreadId;
    responseData.reply = `Sorry, a critical server error occurred: ${error.message || 'Unknown error'}`;
    return NextResponse.json(responseData, { status: 500 });
  }
}
