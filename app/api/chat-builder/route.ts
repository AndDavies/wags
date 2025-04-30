import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TripData } from '@/store/tripStore'; // Import TripData type

// Ensure your OpenAI API key is set in environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define expected request structure
interface ChatBuilderRequestBody {
  messageContent: string;
  threadId?: string;     // Keep for potential future use with Assistants API
  currentTripData: TripData | null; // Receive current state from frontend store
}

// Define the response structure expected by ChatBuilder.tsx
interface BuilderApiResponse {
    reply: string | null;
    updatedTripData?: Partial<TripData>; // Send back updates to merge into store
    triggerItineraryGeneration?: boolean; // Flag to tell frontend to start loading state
    actions?: any[];
    threadId?: string;
}

// --- Helper Functions ---
/**
 * Tries to parse potentially fuzzy date descriptions into YYYY-MM-DD format.
 * This is a simplified example; a robust solution might use a dedicated NLP library.
 * @param dateString The user's date description (e.g., "next friday", "October 10th", "tomorrow").
 * @returns A string in YYYY-MM-DD format or null if parsing fails.
 */
function parseDate(dateString: string): string | null {
   // Very basic placeholder - replace with actual date parsing logic (e.g., using libraries like date-fns or an NLP service)
   console.log(`[API Chat Builder] TODO: Implement robust date parsing for: ${dateString}`);
   try {
      // Attempt simple Date constructor parsing (VERY limited)
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
          // Format: YYYY-MM-DD
          return date.toISOString().split('T')[0];
      }
      // Add more complex parsing logic here (regex, relative dates, etc.)
   } catch (e) {
       console.error('[API Chat Builder] Error during basic date parse:', e);
   }
   return null; // Indicate parsing failure
}

// --- Constants ---
// Define ESSENTIAL fields required to ask about generation
const ESSENTIAL_FIELDS_FOR_ASKING_GENERATE: (keyof TripData)[] = [
  'destination',
  'startDate',
  'endDate',
];

/**
 * API Route Handler for Conversational Trip Building (POST)
 * Handles user messages, extracts trip details, and guides the planning process.
 * @param {NextRequest} req - The incoming request object.
 * @returns {Promise<NextResponse>} The response object containing the assistant's reply and updated trip data.
 */
export async function POST(req: NextRequest) {
  let responseData: BuilderApiResponse = { reply: null }; // Initialize response
  let updatedDataAccumulator: Partial<TripData> = {}; // Accumulate updates

  try {
    const body: ChatBuilderRequestBody = await req.json();
    const { messageContent, threadId: existingThreadId, currentTripData } = body;
    const trip = currentTripData || {}; // Use empty object if null

    // --- Determine Current Planning Step & Set Goal --- 
    let currentGoal = "";
    let systemPrompt = "You are Baggo, a friendly and conversational pet travel assistant.";
    let nextQuestion = ""; // Default next question if no specific one is set
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [];
    let tool_choice: OpenAI.Chat.Completions.ChatCompletionToolChoiceOption = "auto";
    let essentialsCollected = ESSENTIAL_FIELDS_FOR_ASKING_GENERATE.every(field => trip[field] !== null && trip[field] !== undefined && String(trip[field]).trim() !== '');

    // Define all possible tools
    const destinationTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "set_destination",
        description: "Sets the primary destination for the trip.",
        parameters: {
          type: "object",
          properties: { destination: { type: "string", description: "The primary destination (e.g., 'Paris, France', 'Tokyo')." }}, 
          required: ["destination"]
        }
      }
    };
    const datesTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "set_travel_dates",
        description: "Sets the start and end dates for the trip.",
        parameters: {
          type: "object",
          properties: {
            startDate: { type: "string", description: "The starting date in YYYY-MM-DD format or descriptive (e.g., 2024-10-21, next Friday)." },
            endDate: { type: "string", description: "The ending date in YYYY-MM-DD format or descriptive (e.g., 2024-10-28, 5 days later)." }
          },
          required: ["startDate", "endDate"]
        }
      }
    };
    const travelersTool: OpenAI.Chat.Completions.ChatCompletionTool = {
      type: "function",
      function: {
        name: "set_travelers",
        description: "Sets the number of adults, children, and pets.",
        parameters: {
          type: "object",
          properties: {
            adults: { type: "number", description: "Number of adult travelers (18+)." },
            children: { type: "number", description: "Number of child travelers (0-17). Default 0 if not mentioned." },
            pets: { type: "number", description: "Number of pets traveling." }
          },
          required: ["adults", "pets"]
        }
      }
    };
    const preferencesTool: OpenAI.Chat.Completions.ChatCompletionTool = {
       type: "function",
       function: {
         name: "set_preferences",
         description: "Sets travel preferences like budget, accommodation types, or interests.",
         parameters: {
           type: "object",
           properties: {
             budget: { type: "string", enum: ["Budget", "Moderate", "Luxury"], description: "The budget level for the trip." },
             accommodation: { type: "array", items: { type: "string" }, description: "List of preferred accommodation types (e.g., ['Hotel', 'Home'])." },
             interests: { type: "array", items: { type: "string" }, description: "List of interests or desired activities (e.g., ['Hiking', 'Dog Parks', 'Museums'])." }
           },
         }
       }
    };
    const generateItineraryTool: OpenAI.Chat.Completions.ChatCompletionTool = {
        type: "function",
        function: {
            name: "generate_itinerary",
            description: "Signals readiness to generate itinerary.",
            parameters: { type: "object", properties: {} }
        }
    };

    // --- State Machine Logic --- 
    if (!trip.destination) {
      currentGoal = "Determine the **destination**.";
      systemPrompt += `\nUser's trip state: ${JSON.stringify(trip)}. Goal: ${currentGoal} Ask where they want to go. Use the 'set_destination' tool.`;
      tools.push(destinationTool);
      nextQuestion = "Great! Where are you planning to travel to with your pet?";
    } else if (!trip.startDate || !trip.endDate) {
      currentGoal = "Determine the **travel dates**.";
      systemPrompt += `\nUser's trip state: ${JSON.stringify(trip)}. Goal: ${currentGoal} Ask for dates. Use 'set_travel_dates' tool.`;
      tools.push(datesTool);
      nextQuestion = `Got it, ${trip.destination}! When are you thinking of traveling?`;
    } else {
      // Essentials (Dest, Dates) are collected. Now check optional info.
      essentialsCollected = true; 
      if (trip.adults === undefined || trip.pets === undefined) {
        currentGoal = "Determine the **number of travelers** (optional but helpful).";
        systemPrompt += `\nUser's trip state: ${JSON.stringify(trip)}. Essentials collected. Goal: ${currentGoal} Ask for adults & pets count. Use 'set_travelers' tool. Also mention they can skip this or set preferences.`;
        tools.push(travelersTool);
        tools.push(preferencesTool); // Allow setting prefs now too
        tools.push(generateItineraryTool); // Allow generating now too
        tool_choice = "auto";
        nextQuestion = "Okay, we have the destination and dates! How many adults and pets will be traveling? (You can also mention budget/interests or ask me to generate the itinerary now).";
      } else {
        // Essentials AND Travelers collected. Focus on preferences or generation.
        currentGoal = "Determine **preferences** or trigger **itinerary generation**.";
        systemPrompt += `\nUser's trip state: ${JSON.stringify(trip)}. Essentials & travelers collected. Goal: ${currentGoal} Ask about preferences (budget, accommodation, interests) OR if ready to generate. Use 'set_preferences' or 'generate_itinerary' tools.`;
        tools.push(preferencesTool);
        tools.push(generateItineraryTool);
        tool_choice = "auto"; 
        nextQuestion = "Great, we have all the basic details! Would you like to specify preferences like budget or interests, or shall we generate an initial itinerary?";
      }
    }

    systemPrompt += `\nUser message: "${messageContent}"`;
    console.log(`[API Chat Builder] Current Goal: ${currentGoal}`);
    // console.log('[API Chat Builder] System Prompt:', systemPrompt); // Log less verbosely
    console.log('[API Chat Builder] Tools available:', tools.map(t => t.function.name));

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        // { role: "user", content: messageContent } // Included in prompt
      ],
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? tool_choice : undefined,
      max_tokens: 150,
      temperature: 0.6,
    });

    const assistantMessage = chatCompletion.choices[0].message;
    console.log('[API Chat Builder] OpenAI Response Message:', assistantMessage);

    // --- Process OpenAI Response ---
    responseData.reply = assistantMessage.content; 

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        try {
          const args = JSON.parse(toolCall.function.arguments);
          console.log(`[API Chat Builder] Tool Call: ${functionName}`, args);

          switch (functionName) {
            case "set_destination":
              if (args.destination) updatedDataAccumulator.destination = args.destination;
              break;
            case "set_travel_dates":
              if (args.startDate) updatedDataAccumulator.startDate = parseDate(args.startDate) || args.startDate;
              if (args.endDate) updatedDataAccumulator.endDate = parseDate(args.endDate) || args.endDate;
              break;
            case "set_travelers":
              if (args.adults !== undefined) updatedDataAccumulator.adults = args.adults;
              updatedDataAccumulator.children = args.children !== undefined ? args.children : 0;
              if (args.pets !== undefined) updatedDataAccumulator.pets = args.pets;
              break;
            case "set_preferences":
              if (args.budget) updatedDataAccumulator.budget = args.budget;
              if (args.accommodation) updatedDataAccumulator.accommodation = args.accommodation.join(', ');
              if (args.interests) updatedDataAccumulator.interests = args.interests;
              if (!responseData.reply || responseData.reply.trim() === '') {
                   responseData.reply = "Preferences updated! Ready to generate the itinerary now?";
              }
              break;
            case "generate_itinerary":
              // Check for ESSENTIAL fields before triggering generation via API response
              const finalTripStateForGenCheck = { ...trip, ...updatedDataAccumulator };
              if (ESSENTIAL_FIELDS_FOR_ASKING_GENERATE.every(field => finalTripStateForGenCheck[field] !== null && finalTripStateForGenCheck[field] !== undefined && String(finalTripStateForGenCheck[field]).trim() !== '')) {
                  console.log("[API Chat Builder] Triggering itinerary generation.");
                  responseData.triggerItineraryGeneration = true;
                  responseData.reply = `Okay, generating your pet-friendly itinerary for ${finalTripStateForGenCheck.destination}... This might take a minute.`;
              } else {
                  console.warn("[API Chat Builder] Generation tool called, but essential fields missing.");
                  // Don't trigger generation, provide helpful feedback
                  responseData.reply = "Looks like we still need the destination and dates before I can generate the itinerary. Could you provide those?"; 
                  // Clear any partial updates that might confuse the user if we don't proceed
                  updatedDataAccumulator = {}; 
              }
              break;
            default:
              console.warn(`[API Chat Builder] Unhandled tool call: ${functionName}`);
          }
        } catch (parseError) {
          console.error(`[API Chat Builder] Error parsing arguments for ${functionName}:`, parseError);
        }
      }
       // Recalculate if essentials are collected AFTER updates
      const potentiallyUpdatedTrip = { ...trip, ...updatedDataAccumulator };
      essentialsCollected = ESSENTIAL_FIELDS_FOR_ASKING_GENERATE.every(field =>
          potentiallyUpdatedTrip[field] !== null && potentiallyUpdatedTrip[field] !== undefined && String(potentiallyUpdatedTrip[field]).trim() !== ''
      );
    }

    // --- Formulate Final Reply if Needed ---
    if (!responseData.reply && !responseData.triggerItineraryGeneration) {
      let questionToAsk = nextQuestion; 
      const finalTripState = { ...trip, ...updatedDataAccumulator };
      
      if (!finalTripState.destination) {
          questionToAsk = "Where would you like to go?";
      } else if (!finalTripState.startDate || !finalTripState.endDate) {
          questionToAsk = `Okay, ${finalTripState.destination}! When are you planning to travel?`;
      } else if (finalTripState.adults === undefined || finalTripState.pets === undefined) {
          // Essentials are present, but travelers are not
          questionToAsk = "Okay, we have the destination and dates! How many adults and pets will be traveling? (You can also set preferences or generate now)." ;
      } else {
          // Essentials and travelers are present
          questionToAsk = "Great, we have the details! Ready to generate the itinerary, or want to set preferences (budget, interests)?";
      }
      responseData.reply = questionToAsk;
    }

    // Add accumulated updates to the response
    if (Object.keys(updatedDataAccumulator).length > 0) {
      responseData.updatedTripData = updatedDataAccumulator;
    }

    // Pass back threadId if using Assistants API later
    // responseData.threadId = ...; 

    console.log('[API Chat Builder] Final Response Data:', responseData);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('[API Chat Builder] Error:', error);
    return NextResponse.json(
        { 
            reply: `Sorry, I encountered an internal error: ${error.message || 'Unknown error'}`,
            updatedTripData: null,
            triggerItineraryGeneration: false
        }, 
        { status: 500 }
    );
  }
}
