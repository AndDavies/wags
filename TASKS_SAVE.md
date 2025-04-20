Implementation Plan:
Phase 1: Database Schema Preparation
Analyze TripData Structure: Review the TripData interface definition in store/tripStore.ts to confirm all fields that need to be stored for a finalized itinerary (origin, destination, dates, travelers, preferences, itinerary details, policy requirements, preparation steps, etc.).
Inspect itineraries Table Schema: Use the Supabase tool to get the current columns and types of the public.itineraries table.
Action: I will call the tool to fetch the table details.
Compare and Define Schema Changes: Compare the TripData structure with the current itineraries schema. Identify missing columns or columns needing type changes.
Proposal: We will likely need:
id (uuid, primary key)
user_id (uuid, foreign key to auth.users.id, mandatory for saved trips)
trip_data (jsonb): To store the entire TripData object. This offers flexibility if the TripData structure evolves. (Alternatively, we could map individual fields, but jsonb aligns with the draft_itineraries approach).
Potentially top-level queryable fields like title (text), destination (text), start_date (date/timestamptz), end_date (date/timestamptz) if desired for easier display/filtering outside the full trip_data.
created_at, updated_at (timestamptz).
Create Supabase Migration: Based on the comparison, define the necessary SQL DDL statements (e.g., ALTER TABLE public.itineraries ADD COLUMN ...;) to update the schema.
Action: I will propose the SQL migration script.

Phase 2: Backend API Route
Create API Route: Create a new server-side route file: app/api/trips/save/route.ts.
Implement Route Logic:
Use createRouteHandlerClient to get the Supabase client and user session.
Reject request if no authenticated user session exists.
Parse and validate the incoming tripData from the request body. Ensure it contains essential final data like the itinerary.
Insert a new record into the public.itineraries table using the validated tripData and the user_id from the session.
Return a success response (e.g., { success: true, id: newItineraryId }) or an appropriate error response.

Phase 3: Frontend Implementation (ItineraryView.tsx)
Add "Save Trip" Button:
Add a new Button component in the sticky header, distinct from "Save Progress".
Style it as a primary action button (e.g., solid teal background).
Label it clearly (e.g., "Save Trip", "Save Final Itinerary").
Consider disabling the button initially if tripData.itinerary is not present.
Implement handleSaveFinalTrip Function:
Create a new state variable isSavingFinalTrip (boolean) for loading indication.
Check if tripData and tripData.itinerary exist.
Check if session exists (user is logged in).
If Logged In:
Set isSavingFinalTrip(true).
Call fetch('/api/trips/save', { method: 'POST', ... }) with tripData.
Handle success: Show success toast ("Trip Saved!"), potentially disable the "Save Trip" button or change its state/text to "Saved".
Handle error: Show error toast.
Set isSavingFinalTrip(false).
If Guest User:
Store the current tripData in sessionStorage using a specific key (e.g., pendingSaveTripData).
Use Next.js router.push to redirect the user to the login page (e.g., /login?redirect=/itinerary&action=save). Include query parameters (redirect, action) to indicate the desired post-login destination and action.
Add Post-Authentication Save Logic:
In a useEffect hook within ItineraryView.tsx (or a parent component if appropriate):
Check if a user session now exists.
Check if sessionStorage contains the pendingSaveTripData key.
Check if the URL contains the action=save query parameter (to prevent accidental re-saves on every page load after login).
If all conditions met:
Retrieve tripData from sessionStorage.
Call the logged-in part of the handleSaveFinalTrip logic (make API call).
Crucially, remove the pendingSaveTripData key from sessionStorage after attempting the save (whether successful or not) to prevent repeated attempts.
Optionally, clean the action=save query param from the URL using router.replace.
Summary:
This plan addresses the core requirements by:
Preparing the database first.
Creating a secure backend endpoint for saving.
Adding the UI element and logic to the frontend.
Implementing a flow using sessionStorage and redirects to handle guest users saving after authentication.
Let me know when you're ready to proceed with Phase 1, starting with inspecting the current itineraries table schema.
