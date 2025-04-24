
# Create-Trip Workflow Review & Refinement Tasks (Post-OAuth Fix)

## Summary

The core post-OAuth save mechanism is working, redirecting users back to `/create-trip` and saving the pending draft via `localStorage`. However, several areas need refinement for a top-tier user experience and consistent behavior.

## High-Impact Workflow & UX Improvements

1.  **Eliminate Homepage Flash (Post-OAuth Redirect):**
    *   **Issue:** Current flow (`Callback -> / -> AuthListener -> /create-trip`) shows a brief flash of the homepage.
    *   **Task (Option A - Recommended):** Create a minimal `/auth/processing` page. Modify `/auth/callback/route.ts` to redirect here instead of `/`. This processing page should render only the `AuthListener` (or similar) to handle the `localStorage` check and final redirect to `/create-trip` or `/`.

2.  **Unify Post-Login Save Behavior (OAuth vs. Email/Password):**
    *   **Issue:** OAuth auto-saves pending drafts, Email/Password does not.
    *   **Task:** Implement server-side auto-save for the Email/Password flow:
        *   Modify `app/login/page.tsx`: If `localStorage.getItem('pending_auth_action')` exists on load, add its value to a hidden input in the password login form.
        *   Modify `login` server action (`app/login/actions.ts`): Accept the hidden input. After successful `signInWithPassword`, check for pending action data. If `action === 'save_draft'`, perform the DB upsert *before* the final redirect. (Requires shared DB logic or API endpoint).

3.  **Remove Client-Side Post-Auth Check (Simplify `TripCreationForm`):**
    *   **Prerequisite:** Task #2 (Unified Post-Login Save) must be completed.
    *   **Task:** Remove the `useEffect` hook in `TripCreationForm` that checks `localStorage` for `pending_auth_action`. Remove the corresponding `localStorage.setItem` call from the save trigger.

4.  **Clarify "Save Draft" vs. "Generate Itinerary":**
    *   **Issue:** The "Generate My Trip" button currently handles both saving and AI generation.
    *   **Task:**
        *   Add an explicit "Save Draft" button to `TripCreationForm` that only calls `saveDraftToBackend(formData, false)`. Provide clear visual feedback on save.
        *   Ensure the main "Generate My Trip" button clearly indicates it will also save first (or rely on the explicit save).
        *   **(Optional):** Consider debounced auto-saving.

## State Management & Robustness Improvements

5.  **Solidify Initial Draft Loading (`TripBuilderClient`):**
    *   **Issue:** Logic for loading existing drafts (logged-in/guest) was commented out.
    *   **Task:** Uncomment, review, test, and potentially refactor the `useEffect` in `TripBuilderClient.tsx` that loads `initialDraft` (prop) or `sessionStorage` data into the Zustand store (`setTripData`) on mount. Ensure it correctly handles showing the form/modal/itinerary view based on the loaded draft's state.

6.  **Ensure Comprehensive Logout Cleanup:**
    *   **Issue:** Need to ensure complete state reset on logout.
    *   **Task:**
        *   Verify `clearTrip` action in `@/store/tripStore` fully resets all state fields.
        *   Add `sessionStorage.removeItem('tripData')` to the `SIGNED_OUT` handler in `AuthListener` to clear guest drafts.

## UI/UX & Feedback Improvements

7.  **Improve Loading States:**
    *   **Issue:** Basic loading states exist.
    *   **Task:** Enhance visual feedback for `isSavingDraft` (Save Draft button) and `isLoading` (Generate Trip button). Provide clear, distinct indicators and consider disabling relevant form parts during these operations.

8.  **Enhance Error Handling:**
    *   **Issue:** Generic error messages.
    *   **Task:** Make toast/error messages more specific, using details from `PostgrestError` or API responses where possible. Provide user guidance.

## Implementation Order Suggestion

1.  Unify Post-Login Save (#2 & #3)
2.  Implement "Save Draft" Button (#4)
3.  Fix Initial Draft Loading (#5)
4.  Refine Redirect (#1 - `/auth/processing` page)
5.  Improve Logout & Feedback (#6, #7, #8)

# Implementation Plan: Stage 1 - Backend Enhancement (`app/api/ai/enhanced-itinerary/route.ts`)

This stage focuses entirely on modifying the API endpoint to generate richer itinerary data using OpenAI and Google Places Details.

**Database Note:** Adding nested fields within the `trip_data` JSONB column in the `draft_itineraries` table does *not* require database schema changes (`ALTER TABLE`).

**1. Update `Activity` & `ItineraryDay` Interfaces (DONE)**
   - **File:** `app/api/ai/enhanced-itinerary/route.ts`
   - **Action:** Modify interface definitions to include new fields (e.g., `place_id`, `website`, `photo_references`, `pet_friendliness_details`, `narrative_intro`, etc.).

**2. Integrate Google Place Details**
   - **File:** `app/api/ai/enhanced-itinerary/route.ts`
   - **Action a):** Create `fetchPlaceDetails(placeId: string): Promise<any | null>` helper function.
     - Use `fetch` to call Google Places Details API (`https://maps.googleapis.com/maps/api/place/details/json`).
     - Request fields: `place_id`, `name`, `formatted_address`, `website`, `formatted_phone_number`, `opening_hours`, `reviews`, `photos`, `geometry`, `vicinity`.
     - Handle errors gracefully.
   - **Action b):** Modify main logic where `Activity` objects are created.
     - Store `place_id` from Google Place results.
     - For key places (accommodation, top activities), call `fetchPlaceDetails`.
     - Populate new `Activity` fields (`website`, `phone_number`, `opening_hours.weekday_text` -> formatted string, `photo_references`).
   - **Action c) Pet Friendliness Check:**
     - Fetch recent reviews (2-3) via Place Details.
     - *Option 1 (Simple):* Perform keyword check ("dog", "pet", "allowed", "patio") on reviews. Store result/disclaimer in `pet_friendliness_details`.
     - *Option 2 (LLM):* Pass review text to LLM (Step 3c) for assessment. Store LLM assessment/disclaimer in `pet_friendliness_details`.
     - **Always add a disclaimer:** "Pet policies based on available data, please verify directly."

**3. OpenAI Integration (`gpt-4o-mini`)**
   - **File:** `app/api/ai/enhanced-itinerary/route.ts`
   - **Action a) Setup:** Ensure `openai` client is initialized.
   - **Action b) Interpret `additionalInfo`:**
     - Call `openai.chat.completions.create` (model: `gpt-4o-mini`).
     - **Prompt:** "Analyze the following user request for a pet-friendly trip. Extract key constraints, preferences, or needs mentioned. Output as a JSON list of strings. User request: [tripData.additionalInfo]"
     - Store result (e.g., `['needs quiet walks']`) for context in later prompts.
   - **Action c) Enhance Descriptions:**
     - Iterate through selected activities.
     - **Prompt:** "You are writing a pet travel itinerary. Generate a short, engaging, pet-friendly description (1-2 sentences) for this activity: Name: [activity.name], Type: [activity.types.join(', ')], Location: [activity.location]. User interests: [tripData.interests.join(', ')]. Consider these user preferences: [extracted preferences from additionalInfo]. Reviews mention: [review snippets for pet-friendliness check]. Focus on the pet-friendly aspect if relevant."
     - Replace basic `activity.description` with LLM response.
     - **Note:** Handle markdown links `[text](url)` present in existing data - pass them through; frontend will render them.
   - **Action d) Suggest Diverse Activities (Optional but Recommended):**
     - **Prompt:** "Suggest 2-3 unique, pet-friendly activity ideas for a [tripData.budget] budget traveler interested in [tripData.interests.join(', ')] in [currentCity] during [month/season from dates]. Avoid suggesting typical [already planned activity types for the day]. Consider these preferences: [extracted preferences]."
     - Process LLM suggestions (potentially requires another Places Search).
   - **Action e) Refine Scheduling & Estimate Duration:**
     - *Estimate Duration:* Set default `estimated_duration` based on type or ask LLM in suggestion prompt.
     - *LLM Scheduling:*
       - **Prompt:** "Arrange these activities for a day in [currentCity] in a logical order, minimizing travel. Start around 9-10 AM. Include simple travel time estimates between locations (activity A at [coordsA], activity B at [coordsB]). Add lunch around 12-2 PM and dinner around 6-8 PM. Account for estimated durations: [list of activities with names, locations, coords, estimated_duration]. User pace preference: [Moderate - default for now]. Output a JSON list of activities with suggested 'startTime' and 'endTime' (HH:MM format)."
       - Update `startTime` and `endTime` based on LLM response.
   - **Action f) Generate Narrative:**
     - For each `ItineraryDay`:
     - **Prompt (Intro):** "Write a brief (1 sentence) thematic introduction for this day's itinerary in [day.city]: [List of activity names for the day]."
     - **Prompt (Outro):** "Write a brief (1 sentence) thematic outro for this day's itinerary in [day.city]."
     - Populate `narrative_intro` and `narrative_outro`.

**4. Refine Multi-City Logic**
   - **File:** `app/api/ai/enhanced-itinerary/route.ts`
   - **Action:** Implement the `// TODO` section for city switching.
     - Determine switch days.
     - Add 'transfer' activity between cities.
     - Update `currentCity`.
     - Geocode new city using Google Geocoding API to get `currentCoords`.
     - Clear activity/restaurant pools.
     - Re-run `searchGooglePlaces` and restaurant searches for the new city/coords.

**5. Enhance Budget Integration**
   - **File:** `app/api/ai/enhanced-itinerary/route.ts`
   - **Action:**
     - Modify `searchGooglePlaces` to add `maxprice=2` (Budget) or `minprice=3` (Luxury) parameters to Places API calls where applicable.
     - Filter/prioritize results based on `place.price_level` matching `tripData.budget`.
     - Include `tripData.budget` in relevant LLM prompts.

**6. Final Output Structure**
   - **File:** `app/api/ai/enhanced-itinerary/route.ts`
   - **Action:** Ensure the final `NextResponse.json(...)` returns the `itinerary` object conforming to the updated `ItineraryDay` and `Activity` interfaces, with all new fields populated.

---
*Stage 2 (Frontend) and Stage 3 (Form Iteration) will be detailed later.*
