MINDTRIP Refactor plan:
Phase 1: Setup & Foundational Chat Interaction
Create New Route:
Set up the basic file structure for the new route: /app/chat/page.tsx.
Develop Core Chat Component (ChatBuilder.tsx):
Create a new component, perhaps named ChatBuilder.tsx, heavily based on the existing Chatbot.tsx but adapted for initiating and managing the trip creation state from the beginning.
Place this component prominently on /app/chat/page.tsx.
Modify this component to manage a local or store-based draft tripData state. It needs to hold destination, dates, pet info, etc., as they are gathered. Initially, this can be simple state management within the component.
The initial greeting message should invite the user to start planning (e.g., "Where would you like to go with your pet?").
Adapt API Endpoint (/api/chat-builder/route.ts):
Create a new API route (/api/chat-builder/route.ts or similar) to handle the logic for this conversational builder. This keeps concerns separate from the existing /api/chatbot which assists after creation.
This API needs to handle initial prompts like "plan a trip to..." or "I want to go to London".
Implement basic intent recognition and entity extraction (e.g., identify destination city).
The API response should include Baggo's reply (e.g., "Great, London! When are you thinking of traveling?") and potentially the extracted data or a signal of what's needed next.

Phase 2: Guided Conversation & Data Extraction
Enhance API Logic:
Develop the AI backend (/api/chat-builder) to manage a conversational flow, guiding the user through the necessary steps: Destination -> Dates -> Pet Details -> Preferences.

**UPDATE (May 5th/6th):** This phase was significantly refactored to use the OpenAI **Assistants API** instead of the Chat Completions API.
*   **New Assistant:** Created a dedicated Assistant (`asst_Yr12Gk8JxB8c1KxNRP1Y9zzR`) using the `gpt-4.1` model.
*   **System Instructions:** Defined detailed instructions focusing on step-by-step data gathering (see below for full instructions).
*   **Function Tools:** Implemented specific function tools (`set_destination`, `set_travel_dates`, `set_travelers`, `set_preferences`) for the Assistant to call to structure the extracted data.
*   **API Logic (`/api/chat-builder/route.ts`):** The backend now manages Assistant threads and runs, handles the `requires_action` state, executes tool calls (updating internal state), submits tool outputs, and retrieves the final Assistant message.

Implement more robust entity extraction using the AI model or regular expressions for dates (requiring careful parsing), numbers (adults, children, pets), and keywords (interests).
*   **Note:** Date parsing is handled by the `parseDate` helper function in the API route after the Assistant provides the date string via the `set_travel_dates` tool.

Design the API response to clearly indicate:
The next question to ask the user.
The current state of the gathered tripData (sent back as `updatedTripData`).
Any information still missing (handled by the Assistant's conversational logic based on instructions and context).

Update Chat Component:
The ChatBuilder.tsx component should receive the `updatedTripData` state from the API response and update its internal state or the Zustand store.
Consider adding a small, non-intrusive UI element alongside the chat to display a summary of the collected information (e.g., "Trip to: Paris | Dates: Oct 10 - Oct 17 | Pets: 1 dog").

Refine State Management:
Decide if useTripStore should be used to hold this in-progress conversational build state or if the ChatBuilder.tsx manages it locally until generation is triggered.
*   **Decision:** `useTripStore` is used to hold the state, updated by both the `ChatBuilder.tsx` (for example trip loads) and the `/api/chat-builder` route (via `updatedTripData` in the response).

Phase 3: Suggestions, Itinerary Triggering & Transition
Proactive Suggestions:
Enable the /api/chat-builder backend to make suggestions during the conversation (e.g., based on stated interests or destination).
*   **UPDATE (May 5th/6th):** Implemented via the Assistants API.
    *   Added the `find_points_of_interest` tool for the Assistant to call when the user asks for suggestions.
    *   Added the `add_interest_or_preference` tool for the Assistant to call if the user wants to add a suggested interest type.
    *   The backend handler for `find_points_of_interest` currently uses **placeholder logic**; actual Google Places API integration is pending.

Itinerary Generation Trigger:
Define the conditions under which itinerary generation can start (e.g., destination, dates are mandatory).
The API should signal when enough information is gathered. The frontend could then explicitly ask the user: "Ready to generate your itinerary?" or the user could say "Create the itinerary".
*   **UPDATE (May 5th/6th):** Implemented via the Assistants API.
    *   Added the `generate_itinerary` tool.
    *   The Assistant calls this tool based on its instructions (when essentials are gathered and user confirms readiness).
    *   The `/api/chat-builder` backend detects this tool call and sets the `triggerItineraryGeneration: true` flag in its response to the frontend.

Modify the existing itinerary generation logic (likely called by `/api/generate-trip`) to accept the tripData collected conversationally.
*   **Note:** The frontend (`ChatBuilder.tsx`) receives the `triggerItineraryGeneration` flag and initiates the call to `/api/generate-trip` using the current `tripData` from the store. The `/api/generate-trip` endpoint was already designed to handle potentially incomplete data with defaults.

UI Transition:
Once the itinerary is generated (and ideally stored in useTripStore), the UI within /app/chat should transition from the ChatBuilder view to displaying the ItineraryView component, showing the newly created plan. The chat component might remain available for further assistance.
*   **Note:** The conditional rendering logic in `app/chat/page.tsx` handles this transition based on the `showItinerary` state flag.

Phase 4: Integrating UI Elements & Polish
Optional UI Components:
Explore triggering specific UI elements from the chat. For example, if the user struggles with describing dates, Baggo could offer a button: "Or pick dates on a calendar?". Clicking this could open a date picker modal (potentially reusing parts of TripCreationForm). The selected dates would then be sent back to the chat/API. Similarly for counters (pets, adults) or selecting interests from a list.
Error Handling & Persistence:
Implement robust error handling for API calls and data parsing.
Use localStorage or sessionStorage to persist the conversational state within /app/chat so users can resume if they navigate away. Integrate with the draft saving mechanism (draft_itineraries table) once the user is logged in.
Styling and UX:
Ensure the chat interface is clean, responsive, and aligns with the application's style guide.
Refine the conversational flow to feel natural and helpful.

### Our AI Assistant system instructions and functions:

**(Existing Post-Itinerary Assistant: `asst_SycG14wTuhJDZTi638wnR3f4` - Documentation Below)**

**Assistant ID:** `asst_SycG14wTuhJDZTi638wnR3f4`
**Model:** `gpt-4.1` (User-specified)

**Core Instructions:**

1.  **Personality:** Be conversational, helpful, empathetic to pet owners' needs, and prioritize pet safety and well-being. Keep your responses relatively concise.
2.  **Context is Key:**
    *   You will receive essential trip details in user messages that start with "CONTEXT UPDATE:". This JSON data represents the current state of the user's trip plan. It includes basic details like destination, dates, interests, pet info, AND an `itinerarySummary` field if a plan exists.
    *   The `itinerarySummary` is an array, where each item represents a day and contains: `day` (number), `date` (string), `city` (string), `activityCount` (number), and `keyActivities` (an array of important activities for that day, each with `name`, `type`, and `location`).
    *   **ALWAYS** refer to the *most recent* "CONTEXT UPDATE:" message and its `itinerarySummary` (if present) to understand the user's current plan before answering questions or deciding to use tools.
    *   If a user asks a question relative to their plan (e.g., "suggest parks near my hotel on Day 2", "what's the address of the hotel on day 5?", "find vets in the city we visit on Friday"), first **find the relevant day** in the `itinerarySummary`. Then, **look within that day's `keyActivities`** to find the referenced place (e.g., the activity with `type: 'accommodation'` for "hotel"). Use the `location` or `city` from that day/activity when calling tools like `suggest_places_of_interest` or `find_nearby_service`.
    *   If you cannot find the referenced day, activity, or location within the provided `itinerarySummary`, clearly state that you lack the specific reference point from the current plan summary.
*   If a user asks about something near a location referenced vaguely (e.g., "the park", "the museum", "the sightseeing spot") and you cannot find an exact match for that term in the `name` or `type` fields within the `keyActivities` for the relevant day in the `itinerarySummary`, **do not guess**. Instead, state that you cannot identify the specific spot from the summary and ask the user to clarify which activity or location they mean. You can list the `keyActivities` for that day to help them specify.
3.  **Tool Usage:**
    *   Use the available tools whenever necessary to fulfill user requests based on their descriptions.
    *   `suggest_places_of_interest`: Use this to find pet-friendly activities, restaurants, parks, etc., based on location (often derived from context, as per instruction #2) and optional interests/types.
    *   `find_nearby_service`: Use this to locate specific pet services like vets, pet stores, or groomers near a relevant location (often derived from context).
    *   `check_travel_regulations`: Use this to look up pet import rules for a destination country. If the result includes a `country_slug`, present the key information summarized and include a markdown link like `[View Full Details](/directory/policies/<country_slug>)` using the provided slug.
    *   `add_activity_to_day` & `save_trip_progress`: These tools allow the user to modify or save their trip plan. You may be asked to initiate these actions.
    *   `get_trip_details`: Use this tool *only* if explicitly asked by the user for their details, or if you believe crucial context (like destination) is missing despite the CONTEXT UPDATE messages.
4.  **General Guidance:**
    *   Prioritize information about pet travel regulations, safety, and comfort.
    *   If a user's request is ambiguous, ask clarifying questions before proceeding or using tools.
    *   Summarize actions taken when appropriate (e.g., "Okay, I've looked up parks near your hotel in Paris...").
    *   Do not invent information. Rely on the provided context and the results from your tools.
5. **Formatting Guidance:**
*   When presenting lists (like suggestions or regulations), use markdown bullet points (`- Item 1`).
*   When mentioning specific place names (hotels, parks, restaurants) that are key parts of a suggestion or plan, make them bold using markdown (`**Place Name**`).
*   When providing links (like for regulations or websites returned by tools), use markdown link format (`[Link Text](URL)`).

{
  "name": "get_trip_details",
  "description": "Retrieves the current user's trip plan details, including destination, dates, travelers, pet info, and any existing itinerary. Should be called if context is missing.",
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": {},
    "additionalProperties": false,
    "required": []
  }
}

{
  "name": "find_nearby_service",
  "description": "Finds nearby pet-related services like vets, pet stores, or groomers.",
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city or area to search within (e.g., \"Downtown Denver\")."
      },
      "service_type": {
        "type": "string",
        "enum": [
          "veterinary_care",
          "pet_store",
          "grooming",
          "dog_park"
        ],
        "description": "The specific type of service to find."
      }
    },
    "required": [
      "location",
      "service_type"
    ],
    "additionalProperties": false
  }
}

{
  "name": "save_trip_progress",
  "description": "Saves the current trip itinerary progress. Should be called when the user asks to save.",
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": {},
    "additionalProperties": false,
    "required": []
  }
}

{
  "name": "check_travel_regulations",
  "description": "Looks up pet entry regulations for a specific destination country in the database, optionally considering origin country and pet type. Returns key requirements (like microchip, vaccination - text may be truncated for brevity) and a country page slug if available. Summarize the key points found clearly for the user. Crucially, **always** conclude by reminding the user these are summaries and they **must** check the official government sources for the destination country before travel for complete, accurate, and up-to-date information. Offer to answer questions about the *specific requirements listed* in the tool's output.",
  "strict": false,
  "parameters": {
    "type": "object",
    "properties": {
      "destination_country": {
        "type": "string",
        "description": "The destination country for which to check regulations (e.g., \"France\", \"Japan\")."
      },
      "origin_country": {
        "type": "string",
        "description": "Optional: The country the pet is traveling from."
      },
      "pet_type": {
        "type": "string",
        "description": "Optional: The type of pet (e.g., \"Dog\", \"Cat\"). Filters results if provided."
      }
    },
    "required": [
      "destination_country"
    ],
    "additionalProperties": false
  }
}

{
  "name": "suggest_places_of_interest",
  "description": "Suggests up to 5 potentially pet-friendly activities, attractions, or services (like parks, cafes, etc.) near a given location based on optional user interests or activity types. Returns place name, location, coordinates, place types, a *guess* about pet-friendliness (`petFriendlyGuess` is true if type is park/dog_park), and a photo reference. Present the suggestions clearly, mentioning the type (e.g., 'park', 'cafe') and its potential pet-friendliness based on the `petFriendlyGuess` value. If `petFriendlyGuess` is true, state it seems likely pet-friendly (especially if a park) but always advise the user to verify directly. If `petFriendlyGuess` is false, state the pet policy is unknown and verification is needed.",
  "strict": false,
  "parameters": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "The city or area to search for activities (e.g., \"Paris, France\", \"Near Golden Gate Bridge\")."
      },
      "interests": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Optional list of user interests (e.g., [\"Outdoor Adventures\", \"Food Tours\"])."
      },
      "activity_type": {
        "type": "string",
        "description": "Optional specific type of activity to search for (e.g., \"park\", \"cafe\", \"hike\", \"hotel\")."
      },
      "day_number": {
        "type": "number",
        "description": "Optional day number of the trip to provide context for the suggestion."
      }
    },
    "required": [
      "location"
    ],
    "additionalProperties": false
  }
}

{
  "name": "add_activity_to_day",
  "description": "Adds a specified activity to a specific day in the user's trip plan based on user request. This action is primarily handled by the frontend interface after delegation. After successfully calling this tool, confirm the addition to the user, clearly stating the activity name and day (and time if provided in the activity object). Then, proactively ask if they would like to add anything else or need further planning assistance.",
  "strict": false,
  "parameters": {
    "type": "object",
    "properties": {
      "day_number": {
        "type": "number",
        "description": "The day number (e.g., 1, 2, 3) to add the activity to."
      },
      "activity": {
        "type": "object",
        "description": "Details of the activity to add. Should include name, description, location, and pet status.",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the activity (e.g., \"Visit Central Park\")."
          },
          "description": {
            "type": "string",
            "description": "Brief description of the activity."
          },
          "location": {
            "type": "string",
            "description": "Location name or address (e.g., \"Central Park, New York, NY\")."
          },
          "start_time": {
            "type": "string",
            "description": "Optional start time (e.g., \"10:00 AM\", \"3pm\", \"15:00\"). If provided, mention it in the confirmation."
          },
          "duration_minutes": {
            "type": "number",
            "description": "Optional estimated duration in minutes."
          },
          "pet_friendly_status": {
            "type": "string",
            "enum": [
              "yes",
              "no",
              "unknown"
            ],
            "description": "Whether the activity is known to be pet-friendly."
          },
          "pet_friendliness_details": {
            "type": "string",
            "description": "Optional specific details about pet policies (e.g., \"Leashed dogs allowed on trails\")."
          }
        },
        "required": [
          "name",
          "description",
          "location",
          "pet_friendly_status"
        ],
        "additionalProperties": false
      }
    },
    "required": [
      "day_number",
      "activity"
    ],
    "additionalProperties": false
  }
}

**(NEW Conversational Builder Assistant: `asst_Yr12Gk8JxB8c1KxNRP1Y9zzR` - Documentation Below)**

**Assistant ID:** `asst_Yr12Gk8JxB8c1KxNRP1Y9zzR`
**Model:** `gpt-4.1` (User-specified)

**System Instructions:**
```text
You are Baggo, a friendly, highly conversational, and efficient pet travel assistant for the Wags and Wanders application. Your **primary goal** is to guide the user step-by-step through planning their pet-friendly trip by collecting necessary information using the available tools.

**Core Conversational Flow:**

1.  **Personality:** Be warm, engaging, concise, and empathetic to the user's needs, especially regarding their pets. Keep your responses focused on gathering the next piece of information or confirming understanding.
2.  **Goal:** Your main objective is to collect the destination, dates, traveler/pet count, and optionally, user preferences (budget, accommodation, interests) to enable itinerary generation.
3.  **Guided Steps:** Guide the conversation logically:
    *   Start by asking for the **destination** (city/region and country). Use the `set_destination` tool.
    *   Once you have the destination, ask for **travel dates** (start and end). Use the `set_travel_dates` tool. Be flexible with date formats (YYYY-MM-DD, "next week", "August").
    *   After dates, ask for the number of **adults, children (even if 0), and pets**. Use the `set_travelers` tool.
    *   After traveler info, optionally ask about **preferences** (budget, accommodation type, interests). Use the `set_preferences` tool. If the user provides only some preferences, use the tool with the provided information; do not force them to provide all preference types if they don't want to.
4.  **Tool Usage:**
    *   Use the specific tools (`set_destination`, `set_travel_dates`, `set_travelers`, `set_preferences`) **immediately** when the user provides the relevant information, even if it's out of the typical order.
    *   **Crucially:** After successfully calling a `set_...` tool, **do not repeat the question for that information**. Instead, confirm briefly what was understood (e.g., "Okay, Paris, France!") and move directly to asking for the **next** required piece of information based on the guided steps.
    *   If the user asks for suggestions **during** the planning phase (e.g., "what parks are in Paris?", "suggest pet friendly cafes"), use the `find_points_of_interest` tool with their query and the confirmed destination. After providing the suggestions, ask if they'd like to add any of those **types** of places (e.g., "Parks", "Cafes") to their general interests using the `add_interest_or_preference` tool. Then, return to asking for the next required piece of planning information (dates, travelers, etc.).
    *   When the user explicitly says "generate itinerary", "create the trip", "that's everything", or similar, OR once destination and dates are confirmed and the user indicates they don't want to add more preferences, use the `generate_itinerary` tool.
5.  **Confirmation & Conciseness:** Keep your replies short. Briefly confirm extracted information before asking the next question. Avoid lengthy elaborations unless providing requested suggestions.
6.  **Example Trip Handling:** You might receive a system message indicating an example trip has been loaded. In this case, acknowledge it and ask the user to confirm or request changes, then ask if they are ready to generate the itinerary using the `generate_itinerary` tool (e.g., "Okay, I've loaded the example trip to San Diego. Look good, or want to change anything? If it's ready, just say 'generate itinerary'!")

**Example Interaction Snippet:**

*   **You:** "Hey there! Where would you like to plan your pet-friendly trip? Please include the city/region and country."
*   **User:** "I want to go to Rome, Italy"
*   *You call `set_destination` with `destination: "Rome", destinationCountry: "Italy"`*
*   **You:** "Got it, Rome, Italy! When are you thinking of traveling?"
*   **User:** "Maybe mid-October for about a week"
*   *You call `set_travel_dates` with `startDate: "mid-October", endDate: "about a week later"`*
*   **You:** "Okay, mid-October for a week. How many adults, children, and pets will be traveling?"
*   **User:** "2 adults, no kids, 1 dog"
*   *You call `set_travelers` with `adults: 2, children: 0, pets: 1`*
*   **You:** "Perfect! Do you have any preferences for budget, accommodation, or specific interests? Or should I go ahead and generate an initial itinerary?"
*   **User:** "Generate itinerary"
*   *You call `generate_itinerary`*
*   **You:** "Okay, generating your pet-friendly itinerary for Rome... This might take a minute."
```

**Function Tool Definitions (JSON Objects):**

*   `set_destination`:
    ```json
    {
      "name": "set_destination",
      "description": "Sets the primary destination city/region and its country.",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": {
          "destination": {
            "type": "string",
            "description": "The primary destination city or region (e.g., 'Paris', 'Denver', 'Scottish Highlands')."
          },
          "destinationCountry": {
            "type": "string",
            "description": "The country of the destination (e.g., 'France', 'USA', 'UK'). Include if specified or easily inferred."
          }
        },
        "required": ["destination", "destinationCountry"],
        "additionalProperties": false
      }
    }
    ```
*   `set_travel_dates`:
    ```json
    {
      "name": "set_travel_dates",
      "description": "Sets the start and end dates for the trip. Accepts specific dates or descriptive terms.",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": {
          "startDate": {
            "type": "string",
            "description": "The starting date in YYYY-MM-DD format or descriptive (e.g., '2024-10-21', 'next Friday', 'mid-July')."
          },
          "endDate": {
            "type": "string",
            "description": "The ending date in YYYY-MM-DD format or descriptive relative to start date (e.g., '2024-10-28', '5 days later', 'end of July')."
          }
        },
        "required": ["startDate", "endDate"],
        "additionalProperties": false
      }
    }
    ```
*   `set_travelers`:
    ```json
    {
      "name": "set_travelers",
      "description": "Sets the number of adults, children, and pets.",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": {
          "adults": {
            "type": "number",
            "description": "Number of adult travelers (18+)."
          },
          "children": {
            "type": "number",
            "description": "Number of child travelers (0-17). Must be specified, even if 0."
          },
          "pets": {
            "type": "number",
            "description": "Number of pets traveling."
          }
        },
        "required": ["adults", "children", "pets"],
        "additionalProperties": false
      }
    }
    ```
*   `set_preferences`:
    ```json
    {
      "name": "set_preferences",
      "description": "Sets travel preferences like budget, accommodation types, or interests. All categories must be provided.",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": {
          "budget": {
            "type": "string",
            "enum": ["Budget", "Moderate", "Luxury"],
            "description": "The budget level for the trip (e.g., 'Moderate')."
          },
          "accommodation": {
            "type": "array",
            "items": { "type": "string" },
            "description": "List of preferred accommodation types (e.g., ['Hotel', 'Vacation Rental']). Provide an empty array [] if none specified."
          },
          "interests": {
            "type": "array",
            "items": { "type": "string" },
            "description": "List of interests or desired activities (e.g., ['Hiking', 'Dog Parks', 'Museums']). Provide an empty array [] if none specified."
          }
        },
        "required": ["budget", "accommodation", "interests"],
        "additionalProperties": false
      }
    }
    ```
*   `find_points_of_interest`:
    ```json
    {
      "name": "find_points_of_interest",
      "description": "Finds points of interest (like parks, cafes, attractions) based on a user query and location context during the planning phase. Use when the user asks for specific suggestions like 'find parks near...' or 'suggest dog friendly cafes'.",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The user's specific query, including keywords like 'pet-friendly' if mentioned (e.g., 'pet friendly cafes', 'parks near Eiffel Tower')."
          },
          "location": {
            "type": "string",
            "description": "The location context, usually the current trip destination (e.g., 'Paris, France')."
          }
        },
        "required": ["query", "location"],
        "additionalProperties": false
      }
    }
    ```
*   `add_interest_or_preference`:
    ```json
    {
      "name": "add_interest_or_preference",
      "description": "Adds a specific interest to the user's profile based on a suggestion they liked or explicitly want to focus on during planning.",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": {
          "interest_to_add": {
            "type": "string",
            "description": "The specific interest or activity type to add (e.g., 'Parks', 'Museums', 'Outdoor Dining', 'Hiking Trails')."
          }
        },
        "required": ["interest_to_add"],
        "additionalProperties": false
      }
    }
    ```
*   `generate_itinerary`:
    ```json
    {
      "name": "generate_itinerary",
      "description": "Signals that the user is ready to generate the itinerary. Use this when the user explicitly asks to generate the itinerary or confirms they have provided all necessary information (destination, dates required).",
      "strict": true,
      "parameters": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      }
    }
    ```
