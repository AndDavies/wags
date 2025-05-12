# Baggo AI Assistant & Conversational Itinerary Builder README

This document details the implementation, remaining tasks, and improvement strategies for Baggo, the AI-powered pet travel assistant, and the conversational itinerary generation features within the Wags & Wanders application. Our goal is to create a top 1% AI travel builder that provides immense value, interactivity, builds user confidence, and drives bookings for pet-friendly trips.

## 1. Current Implementation Status

Here's what has been implemented so far regarding Baggo and related features:

*   **Core AI Assistant (`Chatbot.tsx` & `/api/chatbot/route.ts`):**
    *   A functional chatbot component (`components/trip/Chatbot.tsx`) is integrated into the `ItineraryView.tsx`.
    *   This assistant, "Baggo," helps users *after* an initial itinerary is generated.
    *   It leverages the OpenAI Assistants API via the `/app/api/chatbot/route.ts` backend.
    *   The backend manages conversation threads and passes trip context (`tripData` including `itinerarySummary`) to the assistant.
    *   Baggo can use tools to:
        *   Suggest places of interest (`suggest_places_of_interest`).
        *   Find nearby services like vets (`find_nearby_service`).
        *   Check travel regulations (`check_travel_regulations`).
        *   Add activities to the itinerary (`add_activity_to_day`).
        *   Trigger saving trip progress (`save_trip_progress`).
    *   The frontend (`Chatbot.tsx`) handles displaying messages, managing loading states, and triggering client-side actions (like adding activities via `useTripStore` or saving via props).

*   **Flexible Itinerary Generation Endpoint (`/api/generate-trip/route.ts`):**
    *   A new, dedicated API endpoint has been created specifically for generating itineraries from potentially incomplete information gathered during a conversation.
    *   It's based on the original `/app/api/ai/enhanced-itinerary/route.ts` but with significant modifications.
    *   **Flexible Input Validation:** Requires only essential fields (`destination`, `startDate`, `endDate`) to proceed.
    *   **Smart Defaults:** Automatically populates missing optional fields (e.g., assumes 1 Medium Dog, Moderate budget, common interests like Parks/Sightseeing/Food) to ensure a useful itinerary can still be generated.
    *   **Enrichment:** Still utilizes OpenAI to generate the itinerary structure and Google Places API to enrich activity details (coordinates, photos, etc.), similar to the enhanced endpoint.
    *   **Output:** Returns the complete `TripData` object, including the newly generated `itinerary`, `policyRequirements`, `preDeparturePreparation`, etc., consistent with the frontend's expectations (`useTripStore`).

*   **State Management (`store/tripStore.ts`):**
    *   The Zustand store (`useTripStore`) centrally manages the `tripData` object, including the itinerary, user preferences, and preparation steps.
    *   Provides actions (`addActivity`, `deleteActivity`, `setTripData`, `clearTrip`) used by both the itinerary view and potentially the chatbot frontend actions.
    *   Includes persistence to `sessionStorage` to retain trip data during a session.

## 2. Remaining Tasks & Next Steps ("Mindtrip Refactor")

Based on the `TASKS.md` refactor plan and our goal of a conversational builder:

*   **Phase 1 & 2: Foundational Conversational Builder:**
    *   **Develop `ChatBuilder.tsx`:** Create the primary UI component for the `/app/chat` route. This component will manage the conversational interaction for *creating* a trip from scratch. It needs to handle user input, display messages, and manage the evolving `tripData` state (likely using `useTripStore`).
    *   **Implement `/api/chat-builder/route.ts`:** Build the backend API dedicated to managing the *guided conversation*. This API needs to:
        *   Handle initial user prompts ("plan a trip to Paris").
        *   Use AI for intent recognition and entity extraction (destination, dates, pet details, preferences).
        *   Maintain conversational state (what information is still needed).
        *   Guide the user through the required steps (Destination -> Dates -> Pets -> Preferences).
        *   Respond with Baggo's next question and the current state of gathered `tripData`.
    *   **Integrate `ChatBuilder.tsx` and `/api/chat-builder/route.ts`:** Connect the frontend chat component to its dedicated backend API.

*   **Phase 3: Itinerary Generation & Transition:**
    *   **Trigger Generation:** Implement logic (likely in `/api/chat-builder`) to detect when enough information (`destination`, `startDate`, `endDate`) has been gathered.
    *   **Call New Endpoint:** The `/api/chat-builder` should orchestrate calling the `/app/api/generate-trip/route.ts` endpoint with the gathered (and potentially defaulted) `tripData`.
    *   **Update State:** Ensure the generated `tripData` (including the full itinerary) is saved back to the `useTripStore`.
    *   **UI Transition:** Modify the `/app/chat` page to transition smoothly from displaying `ChatBuilder.tsx` to displaying `ItineraryView.tsx` once the itinerary is generated and saved in the store. The chat component might remain accessible for further assistance.
    *   **Proactive Suggestions:** Enhance `/api/chat-builder` to enable Baggo to make proactive suggestions *during* the planning conversation (e.g., "Since you mentioned hiking, I found some popular pet-friendly trails near Paris. Shall I add one?").

*   **Phase 4: Polish & Integration:**
    *   **Optional UI Triggers:** Explore triggering modals or UI elements from the chat (e.g., a date picker if the user struggles with text-based dates, a list selector for interests).
    *   **Persistence:** Implement robust state persistence for the *conversational* flow in `/app/chat` (using `sessionStorage` or potentially `draft_itineraries` table for logged-in users).
    *   **Error Handling:** Improve error handling and user feedback throughout the conversational flow (API errors, parsing issues, generation failures).
    *   **UX Refinement:** Ensure the chat interface is clean, responsive, and the conversation feels natural and helpful.

## 3. Key Files Overview

*   **`/app/api/chatbot/route.ts`**: Backend for the *existing* AI assistant (Baggo) within `ItineraryView.tsx`. Uses OpenAI Assistants API, requires full `tripData` context.
*   **`/app/api/generate-trip/route.ts`**: **New** backend endpoint specifically designed to generate a full itinerary from minimal conversational inputs (destination, dates), using defaults for missing fields.
*   **`/app/api/ai/enhanced-itinerary/route.ts`**: Original backend endpoint generating itineraries from the structured form data (`TripCreationForm.tsx`). Requires more fields.
*   **`/components/trip/Chatbot.tsx`**: Frontend component displaying the assistant *after* an itinerary exists. Interacts with `/api/chatbot`.
*   **`/components/trip/ChatBuilder.tsx`**: **(Planned)** Frontend component for the *conversational trip building* experience on `/app/chat`. Will interact with `/api/chat-builder`.
*   **`/store/tripStore.ts`**: Zustand store holding the complete `tripData` state, accessible by various components.
*   **`/TASKS.md`**: Outlines the "Mindtrip Refactor" plan for building the conversational flow.
*   **`BAGGO.md`**: This file.

## 4. Refinement & Improvement Strategy

To achieve the goal of being a top 1% AI pet travel builder, focusing on value, interactivity, confidence, and bookings:

*   **Enhance Conversational Understanding (`/api/chat-builder`):**
    *   **Natural Language Processing:** Improve entity extraction for dates (complex formats, relative terms like "next weekend"), locations (disambiguation), and nuanced preferences.
    *   **Contextual Memory:** Implement better tracking of the conversation state and user preferences expressed over multiple turns.
    *   **Proactive Engagement:** Train the AI to ask clarifying questions intelligently and offer relevant suggestions unprompted based on gathered context. (e.g., "Okay, a trip to the mountains! Do you prefer challenging hikes or easier scenic walks for your pet?").

*   **Elevate Baggo's Expertise (`/api/chatbot` & Tools):**
    *   **Deeper Knowledge:** Expand the knowledge base for `check_travel_regulations` (more countries, airline specifics, accommodation chain policies). Consider Retrieval-Augmented Generation (RAG) for accessing vast, up-to-date external documents.
    *   **Smarter Tool Use:** Improve Baggo's ability to interpret the `itinerarySummary` context accurately to provide relevant suggestions and answers about the user's *specific* plan.
    *   **Comparative Analysis:** Enable Baggo to compare options, such as different activities or hotels, based on pet-friendliness, location, and user preferences.
    *   **Safety Focus:** Proactively offer safety tips relevant to the destination and planned activities (e.g., heat warnings, wildlife precautions, local leash laws).

*   **Boost Interactivity & Value:**
    *   **Visual Aids:** Integrate mini-maps directly into the chat to show suggested locations. Display small image previews for activities or hotels.
    *   **Direct Manipulation:** Allow users to confirm adding a suggestion directly via a button in the chat, seamlessly updating the `tripStore` and itinerary view.
    *   **UI Element Integration:** Implement the planned triggers for date pickers, lists, etc., to make data input easier and more visual when needed.
    *   **Personalized Summaries:** Offer concise summaries of the plan-in-progress within the chat interface.

*   **Build Confidence & Drive Bookings:**
    *   **Transparency:** Clearly explain *why* certain suggestions are made (e.g., "This cafe is suggested because it has a dog-friendly patio and good reviews"). Explicitly state when pet policies are confirmed vs. assumed.
    *   **Actionability:** Make suggestions directly bookable where possible. Provide clear links to partner booking sites (hotels, tours) or official sources (regulations, park permits). Potentially pre-fill booking parameters.
    *   **Safety Net:** Automatically include or suggest adding local vet information to the itinerary based on the destination.
    *   **Regulation Clarity:** Summarize complex regulations concisely and *always* link to official government sources, emphasizing the need for user verification.

*   **Technical Excellence:**
    *   **Performance:** Optimize API response times for a fluid conversational experience.
    *   **Robustness:** Implement comprehensive error handling and provide clear feedback to the user if something goes wrong (e.g., generation failure, API timeout).
    *   **Consistency:** Ensure seamless state synchronization between the conversational state, `useTripStore`, and the backend.
    *   **Testing:** Implement thorough testing for conversational flows, entity extraction, and itinerary generation accuracy.

## Development Log - May 3rd/4th, 2024 (Chat Builder Focus)

Following the initial setup and conversational flow implementation, the focus shifted to refining the generation process and user input handling:

1.  **Flexible Itinerary Generation Endpoint (`/app/api/generate-trip/route.ts`):**
    *   **Logic:** Modified the POST handler to validate only the essential fields required by the chat flow (`destination`, `destinationCountry`, `startDate`, `endDate`).
    *   **Logic:** Implemented logic to apply smart defaults for missing optional fields before proceeding with generation. Defaults cover `origin`, `originCountry`, `adults`, `children`, `pets`, `petDetails` (if pets > 0), `budget`, `accommodation`, and `interests`.
    *   **Code:** Added validation checks and default value assignments at the beginning of the `POST` function.
    *   **Status:** Completed & Tested (Generation successful with minimal input).

2.  **`CityAutocomplete` Integration & Refinement (`app/chat/page.tsx` & `components/trip/CityAutocomplete.tsx`):**
    *   **Logic:** Integrated the `CityAutocomplete` component into the "Where" modal, replacing the standard `Input`.
    *   **Code:** Modified `CityAutocompleteProps` in `CityAutocomplete.tsx` to allow `onCountryChange` to pass both the country and the full place name.
    *   **Code:** Updated the `onCountryChange` handler in `app/chat/page.tsx` to receive both parameters. The handler now sets the `tempDestinationCountry` correctly and parses the primary city name from the full place name to update `tempDestination`, providing a cleaner display in the input field after selection.
    *   **Code:** Added validation to the "Where" modal's save button, requiring both destination and country, and disabling the button if incomplete.
    *   **Status:** Completed & Tested (Correct city/country extraction and display).

3.  **Date Modal Highlighting/Re-editing Fix (`app/chat/page.tsx`):**
    *   **Logic:** Addressed an issue where selected dates in the "When" modal were not consistently highlighted, especially when re-opening the modal after saving.
    *   **Code:** Refined the date parsing logic within the `handleOpenWhenModal` callback. Added a `parseFlexibleDate` helper function that attempts to parse `yyyy-MM-dd`, `yyyy-MM`, and uses the `Date` constructor as a fallback. Also added checks to see if the store value is already a `Date` object to avoid unnecessary parsing.
    *   **Status:** Completed & Tested (Highlighting and re-editing functionality confirmed by user).

**Files Updated:**

*   `app/api/generate-trip/route.ts`
*   `components/trip/CityAutocomplete.tsx`
*   `app/chat/page.tsx`

**Remaining Tasks (Updated based on progress):**

*   **Marketing Sidebar Interactivity:** Implement clickable example trips to pre-populate `tripData` and initiate customization via chat (Next planned step).
*   **Modal Styling Refinement:** Further align modal component styles (especially `Calendar`) with OriginUI specifications (Deferred - lower priority).
*   **Chat-Triggered UI:** Explore triggering modals/UI elements directly from Baggo's responses.
*   **Persistence:** Implement robust state persistence for the `/app/chat` flow (`localStorage` or Supabase drafts).
*   **General Refinement:** Continuous improvements to error handling, UX flow, and code quality.

## Development Log - May 4th, 2024 (Layout & Planning)

1.  **Chat Page Layout Fix (`app/chat/page.tsx`):**
    *   **Logic:** Addressed a UX issue where the `ItineraryView` appeared squished in the left column after generation, alongside the persistent `MarketingSidebar`.
    *   **Code:** Moved the conditional rendering logic (`showItinerary ? ... : ...`) to wrap the entire content area below the `TopBar`. If `showItinerary` is true, only `ItineraryView` is rendered (full-width). Otherwise, the two-column layout (`ChatBuilder` + `MarketingSidebar`) is rendered.
    *   **Status:** Completed & Tested (Layout now correctly transitions to full-width itinerary view).

2.  **Itinerary Generation API 405 Error Resolution:**
    *   **Issue:** Encountered a 405 Method Not Allowed error when calling the itinerary generation endpoint (`/app/api/ai/chat-generate-itinerary`) on Vercel, despite working locally. The error occurred before function execution, indicating a routing layer problem.
    *   **Resolution:** Renamed the API route directory from `/app/api/ai/chat-generate-itinerary` to the simpler `/app/api/generate-trip`. Updated the corresponding `fetch` call in `/app/chat/page.tsx`.
    *   **Status:** Completed & Tested (405 error resolved on Vercel, itinerary generation successful with the new path `/app/api/generate-trip`).

3.  **Planning: `MarketingSidebar` Interactivity:**
    *   **Goal:** Allow users to click pre-defined trip examples in the sidebar to pre-populate `tripData` and start a customization conversation with Baggo.
    *   **Plan:**
        *   Define sample `Partial<TripData>` objects.
        *   Modify `MarketingSidebar.tsx` to accept an `onSelectExampleTrip` prop and render clickable examples.
        *   Implement `handleSelectExampleTrip` in `app/chat/page.tsx` to update `useTripStore` and call `sendSystemUpdateToChat` to inform the backend AI.
        *   Pass the handler function to `MarketingSidebar`.
    *   **Status:** Planned for next development session.

**Files Updated:**

*   `app/chat/page.tsx`
*   `app/api/generate-trip/route.ts`

**Remaining Tasks (Updated):**

*   **Marketing Sidebar Interactivity:** Implement the plan above (Next planned step).
*   **Modal Styling Refinement:** Further align modal component styles (especially `Calendar`) with OriginUI specifications (Deferred - lower priority).
*   **Chat-Triggered UI:** Explore triggering modals/UI elements directly from Baggo's responses.
*   **Persistence:** Implement robust state persistence for the `/app/chat` flow (`localStorage` or Supabase drafts).
*   **General Refinement:** Continuous improvements to error handling, UX flow, and code quality.

## Development Log - May 12th, 2024 (Preference Learning & Stability)

1.  **Assistant Strategy:** Reaffirmed commitment to the single "Super Baggo" assistant (`asst_Yr12Gk8JxB8c1KxNRP1Y9zzR`), avoiding the UI/UX issues caused by switching assistants.

2.  **Chat Interface Stability (`ChatBuilder.tsx` & `/api/chat-builder`):**
    *   **Logic:** Resolved multiple 500 errors in the `/api/chat-builder` route related to handling initial loads and system update messages where `messageContent` could be undefined or empty. Added checks and defaults to prevent `TypeError: Cannot read properties of undefined (reading 'startsWith')` and `Error: 400 Message content must be non-empty`.
    *   **Logic:** Reverted `ChatBuilder.tsx` to use a static frontend welcome message, removing the need for an initial API call and simplifying the startup flow. Adjusted session storage loading logic accordingly.
    *   **Code:** Refactored `handleSend` in `ChatBuilder.tsx` for cleaner code reuse. Fixed display issue where the initial greeting wasn't shown.
    *   **Status:** Completed & Tested (Initial chat load is now stable).

3.  **Preference Learning & Persistence (Foundation):**
    *   **Goal:** Implement "True Multi-Turn Context & Preference Learning" as outlined previously.
    *   **Tool:** Defined and corrected the JSON schema for the new `update_learned_preferences` Assistant tool. **(Action: User to add tool to Assistant in OpenAI dashboard)**.
    *   **Instructions:** Outlined necessary additions to the Assistant's system instructions to utilize the new tool and the `learnedPreferences` context. **(Action: User to update Assistant instructions in OpenAI dashboard)**.
    *   **Types (`store/tripStore.ts`):** Added `learnedPreferences: Array<{ type: string; detail: string; item_reference?: string }>` field to the `TripData` interface.
    *   **Backend (`/api/chat-builder/route.ts`):**
        *   Implemented a new tool handler `case` for `update_learned_preferences`.
        *   Added logic to include `learnedPreferences` in the `CONTEXT UPDATE:` message sent to the Assistant.
        *   Integrated Supabase persistence using `@supabase/ssr`:
            *   Added logic to load `learnedPreferences` from the `user_profiles` table (JSONB column assumed) for logged-in users at the start of API requests.
            *   Added logic to save the updated `learnedPreferences` array back to the `user_profiles` table when the `update_learned_preferences` tool is successfully used. **(Action: User to add `learned_preferences` JSONB column to `user_profiles` table in Supabase)**.
    *   **Status:** Foundational code implemented. Requires Assistant/DB updates by user and thorough testing.

**Remaining Tasks (Updated May 12th):**

*   **UI Refactoring:** Major effort required to refactor various UI elements across the application for consistency and improved UX (High Priority for Launch).
*   **`ItineraryView` Refactor:** Specific refactoring needed for the `ItineraryView.tsx` component (High Priority for Launch).
*   **Partner Link Implementation:** Integrate affiliate/partner links for booking accommodations, activities, etc., within the itinerary view or related UI components to establish revenue stream (Critical for Launch).
*   **Preference Learning - Finalize & Test:**
    *   Update Assistant tool definition and instructions in OpenAI.
    *   Add `learned_preferences` column to Supabase `user_profiles` table.
    *   Test the end-to-end flow of learning, storing, recalling, and applying nuanced preferences.
*   **General Refinement:** Ongoing improvements to error handling, assistant prompting, UX flow, and code quality.

### Development Log - May 12th, 2024 (Planning: Authentication & Itinerary Saving)

Based on discussion and review of the user flow and Supabase schema (`public.itineraries`, `public.profiles`), the following implementation plan for saving itineraries and handling authentication was established:

1.  **Confirm Primary User Table:** Verify if `public.profiles` is the primary table for user details (like `full_name`, `learned_preferences`) linked to `auth.users`. Assume `profiles` for now.
2.  **Define State Management for Guests:** Utilize `sessionStorage` (managed via `useTripStore`) to hold the active itinerary data for guest users.
3.  **Implement "Save Trip" UI:** Add a "Save Trip" button/trigger within the `ItineraryView.tsx` component.
    *   Handler will check auth status (Supabase client).
    *   If logged in, call a function to persist the itinerary to the `itineraries` table.
    *   If guest, display the login/signup modal.
4.  **Implement Auth Modal:** Create the necessary modal component for email/password and Google OAuth login/signup.
5.  **Implement Automatic Saving Post-Authentication:**
    *   In the auth callback route (`/app/auth/callback/route.ts`) or client-side after successful authentication:
        *   Retrieve `tripData` from `useTripStore` / `sessionStorage`.
        *   If guest `tripData` exists, get the authenticated `user_id`.
        *   Insert a new record into `public.itineraries` table, populating `user_id`, `trip_data`, and other relevant fields (title, dates, location).
        *   Clear the guest `tripData` from `useTripStore` / `sessionStorage`.
        *   Redirect the user back to the itinerary view (`/chat` or similar).
6.  **Implement Basic Profile Page (`/app/profile/page.tsx`):**
    *   Create the profile page component.
    *   Fetch and display a list of saved itineraries for the logged-in user from the `public.itineraries` table (requires RLS).
    *   Provide basic user information display (e.g., name, email from `profiles` table).

**Next Steps:** Begin implementation of the "Save Trip" UI trigger and the automatic saving logic post-authentication.

### Development Log - May 13th, 2024 (Planning: UI/UX Refinements)

Following successful implementation and testing of the authentication and itinerary saving flow, the following areas for UI/UX refinement have been identified as future enhancements:

1.  **Post-Save Flow & CTA:** Improve the user experience immediately after an itinerary is successfully saved (especially after a user logs in/signs up to save). This involves:
    *   Providing clearer confirmation feedback.
    *   Potentially redirecting the user to their new saved trip on the profile page or offering a clear link/button to navigate there.
    *   Reviewing and optimizing the Call-to-Actions (CTAs) presented at this stage.

2.  **`/chat` Route Header Consistency:** Address the issue where the header/navigation (`TopBar.tsx` or equivalent) may disappear or not be consistently displayed within the `/app/chat` route, particularly after the `ItineraryView.tsx` component is rendered upon generation or loading. Ensure consistent layout and navigation access throughout the user journey on this page.

**Next Steps:** Prioritize and implement these refinements after completing the core profile page functionality.

## 5. Suggestions for Achieving Top 0.1% Status

To elevate Wags & Wanders and Baggo to be a truly elite, Mindtrip-level AI travel planner, consider these enhancements across the conversational flow, AI capabilities, and backend logic:

1.  **True Multi-Turn Context & Preference Learning (`/api/chat-builder`):** Move beyond simple slot-filling. Implement sophisticated state tracking that understands nuanced preferences revealed over multiple conversational turns (e.g., "I liked that quiet park suggestion, find more like that" or "My dog gets anxious in crowds"). The AI should build a persistent user preference profile (potentially stored in Supabase for logged-in users) that influences *all* future suggestions and itinerary generation.

2.  **Proactive & Contextual Suggestions During Planning (`/api/chat-builder`):** Don't just ask for the next piece of information. Based on the *current* partial `tripData` (destination, dates, interests), proactively suggest relevant activities, accommodation types, or even travel tips *during* the initial conversation. Example: "Okay, Paris in June! It can get warm. Would you like me to prioritize hotels with AC or suggest some shaded parks for your dog?"

3.  **Dynamic UI Elements Triggered by Chat (`ChatBuilder.tsx` & `/api/chat-builder`):** Enhance interactivity by allowing the AI in `/api/chat-builder` to trigger specific UI elements in `ChatBuilder.tsx` when appropriate. Instead of just asking for dates, the AI could respond with "When would you like to travel?" and simultaneously trigger the `Calendar` modal to open. Similarly for selecting from multiple suggested activities or confirming pet details.

4.  **Deep Pet-Friendliness Verification & Nuance (`/api/generate-trip` & RAG):** Move beyond simple "pet-friendly" flags from Google Places. Implement a RAG (Retrieval-Augmented Generation) system. Fine-tune an LLM or use a vector database populated with scraped data from official park websites, hotel chain pet policies, restaurant review sites (specifically mentioning pets), and user-submitted data. The goal is to provide *verified* details like specific weight limits, pet fees, restricted areas (e.g., "patio only"), and access to relief areas for generated activities and accommodations.

5.  **LLM-Powered Itinerary Refinement & Personalization (`/api/generate-trip`):** Use a more powerful LLM (like GPT-4) *after* the structured itinerary is generated based on Places data. Pass the structured itinerary, learned user preferences, pet details, and the deep pet-friendliness context (from RAG) to the LLM. Task it with: a) Re-ordering activities for optimal routing and flow, b) Replacing generic activities with more personalized suggestions based on *all* available context, c) Writing richer, more engaging narratives that incorporate user preferences and pet needs.

6.  **Constraint-Aware Planning & Conflict Resolution:** Teach the AI to handle complex constraints and resolve conflicts. Examples: "I need ground-floor accommodation," "My dog can't walk more than 2 miles at a time," "Find activities that are free on Tuesdays." The system should flag impossible combinations or suggest alternatives.

7.  **Integration with Real-time Data (Weather, Events):** Allow Baggo (both during planning and post-generation) to access real-time APIs for weather forecasts and local events (concerts, festivals, farmers' markets) happening during the trip dates. Suggest indoor alternatives for rainy days or highlight pet-friendly local events.

8.  **Visual Itinerary Planning & Map Integration:** Enhance `ItineraryView.tsx` and potentially `ChatBuilder.tsx` with interactive maps. Show suggested places, visualize the daily route, and allow users to drag-and-drop pins or click on the map to get more information or add locations to their plan.

9.  **Seamless Booking Integration & Handoff:** For hotels, tours, etc., provide clear deep links to booking partners *with parameters pre-filled* based on the itinerary (dates, location, number of guests/pets). Make the transition to booking as frictionless as possible.

10. **User Feedback Loop & Continuous Improvement:** Implement a simple thumbs-up/down mechanism for Baggo's suggestions and generated itinerary items. Collect this feedback (anonymously or linked to user accounts) to fine-tune the AI prompts, RAG data, and suggestion algorithms over time.
