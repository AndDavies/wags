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

// --- Constants ---
// Define ESSENTIAL fields required to ask about generation
const ESSENTIAL_FIELDS_FOR_ASKING_GENERATE: (keyof TripData)[] = [
  'destination',
  'destinationCountry',
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
    let { messageContent, threadId: existingThreadId, currentTripData } = body;
    let trip = currentTripData || {}; // Use empty object if null

    // --- Intercept System Update Messages --- 
    if (messageContent.startsWith('SYSTEM_UPDATE:')) {
      console.log('[API Chat Builder] Received System Update:', messageContent);
      const updateString = messageContent.replace('SYSTEM_UPDATE:', '').trim();
      const updates: Partial<TripData> = {};

      // Basic parsing (can be made more robust)
      updateString.split(',').forEach(part => {
        const match = part.trim().match(/^(\w+) changed to '(.+)'$/);
        if (match) {
          const key = match[1] as keyof TripData;
          let value: any = match[2];

          // Attempt type conversion for known numeric fields
          if (key === 'adults' || key === 'children' || key === 'pets') {
            value = parseInt(value, 10);
            if (isNaN(value)) value = undefined; // Handle parsing errors
          }
          // Add other type conversions if needed (e.g., booleans, dates)

          if (value !== undefined) {
            updates[key] = value;
          }
        }
      });

      console.log('[API Chat Builder] Parsed Updates:', updates);
      // Merge updates into the trip data for *this request* context
      // This ensures the AI's next turn considers the updated data
      trip = { ...trip, ...updates };
      console.log('[API Chat Builder] Trip data updated internally:', trip);
      
      // IMPORTANT: Do not proceed to call OpenAI for system updates.
      // Return an empty success response as the frontend handles UI feedback.
      return NextResponse.json({}); 
    }
    // --- End System Update Handling --- 

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
        description: "Sets the primary destination city/region and its country.",
        parameters: {
          type: "object",
          properties: {
             destination: { type: "string", description: "The primary destination city or region (e.g., 'Paris', 'Denver', 'Scottish Highlands')." },
             destinationCountry: { type: "string", description: "The country of the destination (e.g., 'France', 'USA', 'UK'). Include if specified or easily inferred." }
          },
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

    // --- Base System Prompt --- (Moved outside the state machine for clarity)
    let baseSystemPrompt = "You are Baggo, a friendly, concise, and conversational pet travel assistant. Your goal is to help the user plan their trip by gathering necessary details.";
    
    // --- State Machine Logic & Prompt Augmentation --- 
    if (!trip.destination || !trip.destinationCountry) {
      currentGoal = "Determine the **destination and country**.";
      systemPrompt = `${baseSystemPrompt}\nUser's trip state: ${JSON.stringify(trip)}. Goal: ${currentGoal} Ask where they want to go and the country. Use the 'set_destination' tool, providing both city/region and country.`;
      tools.push(destinationTool);
      nextQuestion = "Great! Where are you planning to travel? Please include the city/region **and the country**.";
    } else if (!trip.startDate || !trip.endDate) {
      currentGoal = "Determine the **travel dates**.";
      systemPrompt = `${baseSystemPrompt}\nUser's trip state: ${JSON.stringify(trip)}. Goal: ${currentGoal} Ask for dates. Use 'set_travel_dates' tool.`;
      // Suggestion Instruction (Example: Suggest checking pet policies)
      systemPrompt += `\nBased on the destination (${trip.destination}), you can also *briefly* mention checking general pet entry policies as a helpful tip while asking for dates.`;
      // Fuzzy Date Handling Instruction
      systemPrompt += `\n**Date Handling:** If the user provides a general timeframe (e.g., 'mid-November', 'next summer'), still use the 'set_travel_dates' function with the provided text. Do not repeatedly ask for specific YYYY-MM-DD dates if the user gives a range or general period.`;
      tools.push(datesTool);
      nextQuestion = `Got it, ${trip.destination}! When are you thinking of traveling?`;
    } else {
      // Essentials (Dest, Dates) are collected.
      essentialsCollected = true; 
      if (trip.adults === undefined || trip.pets === undefined) {
        currentGoal = "Determine the **number of travelers** (optional but helpful).";
        systemPrompt = `${baseSystemPrompt}\nUser's trip state: ${JSON.stringify(trip)}. Essentials collected. Goal: ${currentGoal} Ask for adults & pets count. Use 'set_travelers' tool.`;
        // Suggestion Instruction (Example: Suggest pet-friendly activity type)
        systemPrompt += `\nAlso, if relevant based on the destination (${trip.destination}) or user message, *briefly* suggest a *type* of pet-friendly activity (like 'parks' or 'cafes with patios') they might enjoy there. Do **not** suggest specific named locations unless the user mentions them. Then ask the main question about travelers.`;
        tools.push(travelersTool);
        tools.push(preferencesTool);
        tools.push(generateItineraryTool);
        tool_choice = "auto";
        nextQuestion = "Okay, we have the destination and dates! How many adults and pets will be traveling? (You can also mention budget/interests or ask me to generate the itinerary now).";
      } else {
        // Essentials AND Travelers collected.
        currentGoal = "Determine **preferences** or trigger **itinerary generation**.";
        systemPrompt = `${baseSystemPrompt}\nUser's trip state: ${JSON.stringify(trip)}. Essentials & travelers collected. Goal: ${currentGoal} Ask about preferences (budget, accommodation, interests) OR if ready to generate. Use 'set_preferences' or 'generate_itinerary' tools.`;
        // Suggestion Instruction (Example: Suggest based on interests if provided)
        if (trip.interests && trip.interests.length > 0) {
           systemPrompt += `\nSince the user is interested in ${trip.interests.join(', ')}, you can also *briefly* suggest a related *type* of pet-friendly activity in ${trip.destination} (e.g., if interest is 'hiking', suggest 'checking out local trails'). Do **not** suggest specific named locations unless the user mentions them.`;
        }
        tools.push(preferencesTool);
        tools.push(generateItineraryTool);
        tool_choice = "auto"; 
        nextQuestion = "Great, we have all the basic details! Would you like to specify preferences like budget or interests, or shall we generate an initial itinerary?";
      }
    }
    
    // ** Final Prompt Assembly **
    // Add general guidance for suggestions and state flow
    systemPrompt += `\n
**Proactive Suggestion Guidance:** In addition to your main goal, look for opportunities to offer *one* brief, relevant, pet-friendly suggestion based on the user's trip state. Suggest *types* of places (e.g., 'dog parks', 'outdoor cafes') or general tips (e.g., 'check local leash laws'). **Do NOT suggest specific named locations** (like 'Central Park' or 'Eiffel Tower') unless the user explicitly mentions them or asks for specific examples related to an interest. Keep suggestions concise and integrate them naturally.`;
    systemPrompt += `\n
**Conversation Flow Guidance:** Prioritize using the correct tool for the information the user *actually* provides, even if it's for a later step. For example, if asking for dates and the user provides traveler numbers, use 'set_travelers' and then ask the *next* question (e.g., about preferences or generation), rather than repeating the date question.`;
    systemPrompt += `\n
User message: "${messageContent}"`; // Append user message last

    console.log(`[API Chat Builder] Current Goal: ${currentGoal}`);
    console.log('[API Chat Builder] System Prompt (Final - Snippet):', systemPrompt.substring(0, 500) + '...'); // Log snippet
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
              if (args.destinationCountry) updatedDataAccumulator.destinationCountry = args.destinationCountry;
              if (!args.destinationCountry) {
                  console.warn(`[API Chat Builder] Destination country missing for ${args.destination}. Relying on frontend check or future enhancement.`);
              }
              break;
            case "set_travel_dates":
              if (args.startDate) updatedDataAccumulator.startDate = parseDate(args.startDate);
              if (args.endDate) updatedDataAccumulator.endDate = parseDate(args.endDate);
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
              const finalTripStateForGenCheck = { ...trip, ...updatedDataAccumulator };
              if (ESSENTIAL_FIELDS_FOR_ASKING_GENERATE.every(field => finalTripStateForGenCheck[field] !== null && finalTripStateForGenCheck[field] !== undefined && String(finalTripStateForGenCheck[field]).trim() !== '') && finalTripStateForGenCheck.destinationCountry) {
                  console.log("[API Chat Builder] Triggering itinerary generation.");
                  responseData.triggerItineraryGeneration = true;
                  responseData.reply = `Okay, generating your pet-friendly itinerary for ${finalTripStateForGenCheck.destination}... This might take a minute.`;
              } else {
                  console.warn("[API Chat Builder] Generation tool called, but essential fields (incl. country) missing.");
                  responseData.reply = "Looks like we still need the destination (including country) and dates before I can generate the itinerary. Could you provide those?"; 
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
    }

    // --- Formulate Final Reply if Needed ---
    if (!responseData.reply && !responseData.triggerItineraryGeneration) {
      let questionToAsk = ""; // Start fresh
      const potentiallyUpdatedTrip = { ...trip, ...updatedDataAccumulator }; 

      // Check essentials again based on potentially updated state
      if (!potentiallyUpdatedTrip.destination || !potentiallyUpdatedTrip.destinationCountry) {
          questionToAsk = "Okay, looks like we still need the destination. Where are you headed (city/region and country)?";
      } else if (!potentiallyUpdatedTrip.startDate || !potentiallyUpdatedTrip.endDate) {
          questionToAsk = `Got it, ${potentiallyUpdatedTrip.destination}! When are you thinking of traveling?`;
      } else if (potentiallyUpdatedTrip.adults === undefined || potentiallyUpdatedTrip.pets === undefined) {
          // Essentials are collected, ask for travelers
          questionToAsk = "Okay, we have the main details! How many adults and pets will be traveling? (You can also mention budget/interests or ask me to generate the itinerary now).";
      } else {
          // Essentials and travelers are present
          questionToAsk = "Great, we have the details! Ready to generate the itinerary, or want to set preferences (like budget or specific interests)?";
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
