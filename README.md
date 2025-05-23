# Wags & Wanders - Pet Travel Planner

Wags & Wanders is a comprehensive pet travel planning platform that helps pet owners plan trips with their furry companions. This README documents the application features, implementation details, and development roadmap.

## Project Overview

### Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, TailwindCSS
- **Styling**: Tailwind CSS with custom UI components
- **State Management**: Custom React state hooks and localStorage persistence
- **Maps & Location**: Mapbox GL JS for maps, Google Places API for location search
- **Database**: Supabase (PostgreSQL) for data storage
- **Authentication**: Supabase Auth with email/password and OAuth
- **AI Integration**: OpenAI for itinerary generation and travel assistant
- **Deployment**: Vercel

### Key Features

- **Trip Planning**: Step-by-step wizard for creating pet-friendly trips
- **Interactive Itinerary**: Timeline-based view with day/time organization
- **Location Maps**: Interactive maps showing trip locations and activities
- **AI Travel Assistant**: Contextual chat for planning assistance
- **Pet-Specific Features**: Special considerations for traveling with pets
- **Data Persistence**: Auto-saving to prevent data loss

## Trip Creation Module

The trip creation module allows users to create detailed trip plans with their pets, including:

- Location and date selection with city autocomplete
- Pet details with travel preferences
- Travel preferences including accommodation types and activities
- Real-time preview of the trip details

### Create Trip Workflow

The trip creation process follows a specific user journey:

1. **Entry Point:** Users start at the `/create-trip` route displaying a welcome page with a "Create New Trip" button.

2. **Trip Modal Stepper:** Clicking the button opens a 4-step wizard modal:
   - **Step 1: Location & Dates** - Destination, origin, travel dates, and additional cities
   - **Step 2: Pet Details** - "Who's Going" section (adults, children, pets counters with service animal link), pet type (dog, cat, bird, etc.) and size (small, medium, large)
   - **Step 3: Preferences** - Budget, accommodation types, and pet-friendly interests/activities
   - **Step 4: Review** - Final verification of all entered information

3. **Data Persistence:** All entered information is automatically saved to `localStorage` as users progress, ensuring that:
   - If users accidentally close the modal or browser, their data is preserved
   - When they return to the page, they can continue where they left off
   - A "Trip Resumed" notification appears when returning to an in-progress trip
   - Data persists until explicitly cleared via "Start New Trip" or saved to the database

4. **Itinerary Creation:** After completing the wizard:
   - A trip object is created and displayed in the itinerary view
   - The left panel shows a Travel Assistant (AI chatbot)
   - The right panel displays a day-by-day timeline for the trip
   - Users can add activities, hotels, restaurants, and transport to each day

5. **Trip Management:**
   - **Save Trip** - Permanently saves the trip to the database (requires login)
   - **Start New Trip** - Clears current trip data and returns to the welcome screen
   - **Export PDF** - (Future feature) Exports the itinerary as a PDF
   - **Share** - (Future feature) Allows sharing the trip with others

#### User Interface States

The create-trip interface has two main states:

1. **Welcome State** - Appears when:
   - A user visits `/create-trip` for the first time
   - After clicking "Start New Trip" to clear existing data
   - When no trip data exists in localStorage

2. **Itinerary State** - Appears when:
   - A user completes the trip creation modal
   - A user returns to a page with saved trip data in localStorage
   - The page automatically loads the existing trip

#### Data Flow

```
User Input → TripModalStepper → localStorage → Trip Object → Itinerary View
                    ↑                 ↓
                    └─────────────────┘
                     (Data persistence)
```

The system is designed to maximize data preservation, providing a seamless user experience even if the user needs to complete the planning process across multiple sessions.

### Trip Preferences

The preferences step collects important information about the travelers and their preferences:

#### Who's Going

This section captures information about all travelers in the group:

- **Adults** - Number of adult travelers (minimum 1)
- **Children** - Number of children (can be 0)
- **Pets** - Number of pets (minimum 1 since it's a pet travel app)

This information helps in generating appropriate recommendations for accommodations and activities that can accommodate the entire travel party.

#### Budget Selection

Users can select from three budget tiers:

- **Budget** - Economical options
- **Moderate** - Mid-range comfort
- **Luxury** - Premium experience

The budget selection influences the types of accommodations and activities recommended in the itinerary.

#### Accommodation Types

Users can select multiple accommodation types:

- Hotels
- Homes
- Apartments
- Hostels

This helps in filtering and suggesting appropriate places to stay during the trip.

#### Interests & Activities

This section offers a comprehensive set of options including:

- **General trip types:** Relaxation, Adventure, Cultural, Family
- **Standard activities:** Parks, Hiking, Beaches, Restaurants, Sightseeing, etc.
- **Pet-friendly options:** Dog Parks, Pet Trails, Pet Beaches, Pet Cafes, Pet Dining, Pet Swimming, Pet Spas, etc.

Selected interests help tailor the AI-generated itinerary to match the user's preferences and include appropriate pet-friendly activities.

### City Autocomplete with Mapbox

The trip creation form uses Mapbox's Geocoding API for city autocomplete functionality. This provides a better user experience when entering destinations and origins.

![City Autocomplete Example](https://docs.mapbox.com/assets/search-js-playground-5-05f9a02e9a62bf44e9a70d6d31ca9e3c.png)

#### Setup Instructions

1. Sign up for a free account at [Mapbox](https://account.mapbox.com/auth/signup/)
2. Create a new access token with geocoding permissions
3. Add your token to the `.env.local` file:

```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your_mapbox_token_here"
```

> **DEVELOPMENT NOTE:** The default Mapbox token works for development purposes, but you should replace it with your own token before deploying to production. The default token has usage limitations and may be subject to URL restrictions.

#### URL Restrictions Configuration (Important!)

If you're experiencing 403 Forbidden errors with the Mapbox API, your token likely has URL restrictions. This is a security feature of Mapbox that limits which domains can use your token.

To fix this:

1. Log into your [Mapbox access tokens page](https://account.mapbox.com/access-tokens/)
2. Find your token in the list
3. Click "Edit" under URL restrictions
4. Add your application URL(s):
   - For production: `https://yourdomain.com`
   - For development: `http://localhost:3000`

```javascript
// Example of proper API request with origin headers
fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/London.json?access_token=${accessToken}`, {
  headers: {
    'Referer': 'https://yourdomain.com',
    'Origin': 'https://yourdomain.com'
  }
})
```

#### Debugging Mapbox Integration

A dedicated debug page is available at `/debug/map-api` which provides:

- Current token status and validation
- Connection testing
- Detailed error reporting
- Troubleshooting steps for common issues

![Debugging Page Example](https://mapbox.github.io/mapbox-gl-js/assets/debugging.png)

##### Common Issues and Solutions

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| 403 Forbidden | URL restrictions | Add your domain to token's allowed URLs |
| Invalid token | Missing/incorrect token | Check your .env.local file |
| Network error | CORS or connection issue | Check console for detailed errors |

#### ⚠️ Token Replacement Reminder

**TODO Before Production:**
- [ ] Replace the default Mapbox token with your own production token
- [ ] Ensure your token has appropriate URL restrictions for your production domain
- [ ] Test the API connection on your production environment
- [ ] Monitor usage to stay within free tier limits or upgrade as needed

### Debugging Features

The trip creation module includes built-in debugging features for development:

#### Console Debugging

When running in the development environment, the `TripModalStepper` component automatically logs trip data to the console whenever it changes:

- Full trip data object (with dates properly serialized)
- Organized sections for Location & Dates, Pet Details, and Preferences
- Traveler counts (adults, children, pets)
- Selected accommodations and interests

This helps developers ensure data integrity and proper formatting before the data is used by the AI model and APIs for itinerary creation.

To access the debug logs:
1. Open your browser's developer tools console
2. Interact with the trip creation form
3. View the organized logs under the "Trip Data Debug" group

### Live Trip Preview

As users enter trip details, a real-time preview panel shows what the trip will look like, displaying:

- Destination and additional cities
- Travel dates with duration calculation
- Pet details including type and size
- Travel preferences

The preview panel helps users visualize their trip as they build it and confirms their entries are being captured correctly.

### Enhanced Itinerary View

The trip planning experience includes a robust, interactive itinerary component:

#### Timeline-Based Organization

The itinerary is organized as a vertical timeline with the following features:

- **Day-by-Day View**: Each day of the trip is shown as a timeline item
- **Expandable Days**: Click on a day to focus on it and reveal editing options
- **Time-Based Grouping**: Activities within each day are organized into:
  - Morning activities (before 12 PM)
  - Afternoon activities (12 PM - 6 PM)
  - Evening activities (after 6 PM)

#### Activity Management

Users can fully manage their itinerary activities:

- **Add Activities**: Create new activities, restaurants, hotels, or transportation
- **Edit Existing**: Modify any aspect of an activity including time, location, and details
- **Delete Items**: Remove activities that are no longer needed
- **Time Scheduling**: Set specific start and end times for each activity

#### Map Integration with MiniMap

The itinerary view includes an interactive map component for visualizing locations:

- **Interactive Map**: Shows pins for all activities in the selected day
- **Dynamic Updates**: Map updates as user selects different days or activities
- **Location Geocoding**: Automatically converts location names to coordinates for mapping
- **Custom Markers**: Visual indicators for different activity types
- **Responsive Design**: Adapts to different screen sizes

The MiniMap component is implemented using Mapbox GL JS, providing:
- Location visualization for trip destinations and activities
- Interactive panning and zooming
- Custom styling to match the application theme
- Error handling for API connection issues
- Automatic bounds adjustment to show all relevant locations

## Authentication & Database Management

### Supabase Integration

Wags & Wanders uses [Supabase](https://supabase.com) as its backend service for authentication and database management. Supabase provides a PostgreSQL database with a RESTful API, along with user authentication, storage, and realtime subscriptions.

#### Authentication Flow

The application implements a comprehensive authentication system with the following features:

1. **User Authentication Methods**:
   - Email/Password authentication
   - Google OAuth (single sign-on)
   - Email verification through OTP (One-Time Password)

2. **Authentication Architecture**:
   - Client-side authentication handled through `supabase-client.ts`
   - Server-side authentication handled through `supabase-server.ts`
   - Middleware protection for restricted routes

3. **Authentication Flow**:
   - **Sign Up**: Users enter credentials via the form in `/app/signup/page.tsx`
   - **Login**: Users sign in via `/app/login/page.tsx`
   - **OAuth Flow**: Google authentication redirects users through `/app/auth/callback/page.tsx`
   - **Session Management**: Auth tokens stored in cookies with 7-day expiration
   - **Protected Routes**: Middleware checks user authentication status for paths like `/profile`

4. **Cookie-Based Session Management**:
   - Auth tokens stored in `auth-token` cookie
   - Custom cookie management in server contexts via `createServerClient`
   - Token refreshing handled automatically by Supabase

#### Database Client Implementation

The application manages two types of Supabase clients to handle different contexts:

1. **Server-Side Client (`supabase-server.ts`)**:
   ```typescript
   // For server components and API routes
   import { createServerClient } from '@supabase/ssr';
   import { cookies } from 'next/headers';

   export async function createClient() {
     const cookieStore = await cookies();
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       { cookies: { /* cookie management */ } }
     );
   }
   ```

2. **Client-Side Client (`supabase-client.ts`)**:
   ```typescript
   // For client components
   import { createBrowserClient } from '@supabase/ssr';

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );
   }
   ```

#### Database Schema

The application utilizes several key tables:

1. **User Authentication Tables** (managed by Supabase Auth):
   - `auth.users`: Core user accounts
   - `auth.sessions`: User sessions

2. **Application Tables**:
   - `itineraries`: Stores user trip plans
   - `checklists`: Trip preparation checklists
   - `documents`: Stored files related to trips
   - `conversations`: Chat conversation history
   - `pet_policies`, `airlines`, `hotels`: Reference data for travel planning

3. **Database Security**:
   - Row-Level Security (RLS) policies ensure users can only access their own data
   - Policies defined for each table controlling select, insert, update, and delete operations

#### Environment Variables

The following environment variables are required for Supabase integration:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Data Access Patterns

1. **Server-Side Data Access**:
   - Server components fetch data directly using the server client
   - Example: `const { data } = await supabase.from('itineraries').select('*')`

2. **Client-Side Data Access**:
   - Client components use the browser client
   - Real-time subscriptions for live updates
   - Optimistic UI updates for improved UX

3. **Authentication Checks**:
   - Middleware intercepts requests to protected routes
   - Session validation via `supabase.auth.getUser()`
   - Redirection to login for unauthenticated users

4. **Deployment Considerations**:
   - Domain-specific cookie configurations
   - CORS settings for production environments
   - Token refresh mechanisms

## API Integrations

### Mapbox Integration

The application uses Mapbox GL JS for interactive maps and the Mapbox Geocoding API for location search:

1. **MiniMap Component**:
   - Shows location pins for activities and destinations
   - Interactive zoom and pan controls
   - Custom styling and markers

2. **Location Geocoding**:
   - Converts place names to coordinates for mapping
   - Reverse geocoding for displaying location names

3. **Environment Setup**:
   - Required environment variable: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
   - URL restrictions should be configured for security

### Google Places API

The application uses Google Places API for location search and autocomplete:

1. **LocationDatesStep Component**:
   - Autocomplete for cities when entering trip origin and destination
   - Place details including coordinates and country information
   - Required environment variable: `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

### OpenAI Integration

The AI features utilize OpenAI's API for natural language processing:

1. **Travel Assistant**:
   - Contextual chat interface for trip planning assistance
   - Pet-specific travel knowledge and recommendations

2. **Itinerary Generation**:
   - AI-powered creation of personalized itineraries
   - Required environment variable: `OPENAI_API_KEY`

## Recent Updates

The following features have been recently implemented:

1. **MiniMap Component**: Added an interactive map to the ItineraryView
   - Created a new `MiniMap.tsx` component using Mapbox GL
   - Implemented location geocoding for converting place names to coordinates
   - Added dynamic pin placement for activities
   - Integrated with the day selector to update map locations

2. **ItineraryView Component**: Created a comprehensive itinerary display
   - Timeline-based organization of activities
   - Time-based grouping (morning, afternoon, evening)
   - Activity management UI (add, edit, delete)
   - Integration with the MiniMap component

3. **UI Components**: Developed custom UI components
   - Button component with various style variants
   - Dialog component for modal interactions
   - Toast notifications for user feedback
   - Timeline component for visualizing sequential data

## Known Issues & Bugs

The following issues are currently known and scheduled to be fixed:

1. **Google Places API**: Currently waiting for API enablement
   - Temporary workaround needed for LocationDatesStep component
   - Consider alternative geocoding services if API access is delayed

2. **TypeScript Errors**: Some type definitions need refinement
   - Improve typing in LocationDatesStep and TripModalStepper
   - Fix any TypeScript errors in the ItineraryView component

3. **Build Issues on Vercel**:
   - Resolve "use client" directive requirements for components using React hooks
   - Address favicon.ico conflict error in build logs

## Next Steps

### Immediate Tasks

1. **Complete API Integration**:
   - Finalize Google Places API integration for location search
   - Implement proper error handling for API failures
   - Add fallback mechanisms when APIs are unavailable

2. **Enhance Itinerary View**:
   - Complete the activity form for adding/editing activities
   - Implement activity filtering by pet-friendliness
   - Add time format standardization across browsers

3. **Build Issues**:
   - Resolve all TypeScript errors for clean builds
   - Fix the "conflicting public file and page file" error for favicon.ico

### Future Enhancements

1. **Advanced Map Features**:
   - Route visualization between activities
   - Distance and travel time calculations
   - Nearby pet-friendly locations discovery

2. **User Experience Improvements**:
   - Drag-and-drop scheduling for activities
   - Offline support for viewing itineraries without internet
   - Enhanced mobile responsiveness

3. **AI Enhancements**:
   - Improved itinerary generation with more personalization
   - Proactive travel suggestions based on destination and pets
   - Integration with external pet-friendly databases

## Development

### Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_api_key
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```
   npm run dev
   ```

4. Access the application at:
   ```
   http://localhost:3000
   ```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing AI Itinerary Generation

Follow these steps to test the AI-powered itinerary generation feature:

1. **Setup Environment**
   - Ensure you have an OpenAI API key in your `.env.local` file:
   ```
   OPENAI_API_KEY="your-api-key-here"
   ```

2. **Start the Application**
   ```bash
   npm run dev
   ```

3. **Create a New Trip**
   - Navigate to `http://localhost:3000/create-trip`
   - Click "Create New Trip"
   - Complete all required steps in the trip creation form:
     - Enter destination and dates
     - Select pet type and size
     - Set preferences (budget, interests, etc.)
   - Click "Create Trip" on the final confirmation screen

4. **Observe Itinerary Generation**
   - Watch for the loading state with the amber alert box stating "Creating Your Perfect Pet-Friendly Itinerary"
   - The spinner indicates the AI is generating custom activities
   - This process typically takes 30-60 seconds depending on server load

5. **Verify Results**
   - Once complete, the itinerary view will populate with AI-generated activities
   - Each day should include morning, afternoon, and evening activities
   - Activities should be pet-friendly and match your preferences
   - Verify that restaurant recommendations are properly categorized

6. **Test the Related Chatbot**
   - Once the itinerary is generated, use the Travel Assistant chatbot
   - Ask questions like "Can you suggest pet-friendly parks in [destination]?"
   - The chatbot should provide contextual responses based on your trip details

7. **Error State Testing**
   - Test error handling by temporarily modifying your environment variable to an invalid API key
   - Restart the server and create a trip
   - Verify appropriate error messaging appears

If all steps complete successfully, the itinerary generation feature is working properly.

### Guest User Save Flow

To prevent guests from losing their work when prompted to log in or sign up, the following flow is implemented:

1.  **Temporary Storage (Phase 1 - Implemented)**:
    -   When a guest clicks "Save Trip" in `ItineraryView.tsx`:
        -   The current `tripData` is serialized and stored in `sessionStorage` under the key `pendingItinerarySave`.
        -   A toast message informs the user they need to authenticate.
        -   The user is redirected to `/login` with query parameters:
            -   `redirect`: The path they were on (e.g., `/path/to/itinerary`).
            -   `reason=pendingSave`: Indicates why they were redirected.
2.  **Authentication Redirect (Phase 2 - Implemented)**:
    -   The `/login` and `/signup` pages read the `redirect` query parameter.
    -   A hidden input (`redirectPath`) is added to the login/signup forms.
    -   The corresponding server actions (`login`, `signup`) read `redirectPath` from the form data.
    -   Upon successful authentication, the server action redirects the user back to the `redirectPath` (or `/` as a fallback).
3.  **Restore Itinerary (Phase 3 - **TODO**)**:
    -   An `useEffect` hook needs to be added to `ItineraryView.tsx`.
    -   This effect runs on component mount.
    -   It checks if the user is now logged in (`session` exists) AND if `pendingItinerarySave` data exists in `sessionStorage`.
    -   If both conditions are true:
        -   Parse the data from `sessionStorage`.
        -   Restore the data to the Zustand store (`useTripStore`).
        -   Remove the data from `sessionStorage`.
        -   Display a toast message confirming the restore ("Your progress has been restored...").

### Future Considerations & TODOs

-   **Phase 3 Implementation**: Code the `useEffect` hook in `ItineraryView.tsx` for restoring data from `sessionStorage`.
-   **OAuth Redirect**: Handle the `redirectPath` parameter correctly within the `/auth/callback` route for OAuth flows (e.g., Google Login), potentially using the `state` parameter.
-   **Email Confirmation Flow**: Refine the redirect in the `signup` server action to go to a "Check Email" page if email confirmation is enabled. Ensure the confirmation link redirect includes the original `redirectPath`.
    -   **NOTE:** Currently, email confirmation is **disabled** for development. The signup redirect logic assumes immediate login capability or manual login after redirect. This needs revisiting when email confirmation is re-enabled for production.
-   **Draft Saving for Unconfirmed Users**: _(Commented in `signup/actions.ts`)_ Consider if a more robust temporary save (e.g., to `draft_itineraries` based on email) is needed if the `sessionStorage` flow proves insufficient after testing.

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
Implement more robust entity extraction using the AI model or regular expressions for dates (requiring careful parsing), numbers (adults, children, pets), and keywords (interests).
Design the API response to clearly indicate:
The next question to ask the user.
The current state of the gathered tripData.
Any information still missing.
Update Chat Component:
The ChatBuilder.tsx component should receive the updated tripData state from the API response and update its internal state or the Zustand store.
Consider adding a small, non-intrusive UI element alongside the chat to display a summary of the collected information (e.g., "Trip to: Paris | Dates: Oct 10 - Oct 17 | Pets: 1 dog").
Refine State Management:
Decide if useTripStore should be used to hold this in-progress conversational build state or if the ChatBuilder.tsx manages it locally until generation is triggered. Using the store allows easier integration with other potential UI elements later.
Phase 3: Suggestions, Itinerary Triggering & Transition
Proactive Suggestions:
Enable the /api/chat-builder backend to make suggestions during the conversation (e.g., based on stated interests or destination). This might involve adding new functions/tools for the AI model.
Itinerary Generation Trigger:
Define the conditions under which itinerary generation can start (e.g., destination, dates, and pet info are mandatory).
The API should signal when enough information is gathered. The frontend could then explicitly ask the user: "Ready to generate your itinerary?" or the user could say "Create the itinerary".
Modify the existing itinerary generation logic (likely called by /api/trip/generate) to accept the tripData collected conversationally. The /api/chat-builder might orchestrate calling this or instruct the frontend to do so.
UI Transition:
Once the itinerary is generated (and ideally stored in useTripStore), the UI within /app/chat should transition from the ChatBuilder view to displaying the ItineraryView component, showing the newly created plan. The chat component might remain available for further assistance.
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
You are Baggo, a friendly, concise, and highly knowledgeable pet travel assistant for the Wags and Wanders application. Your primary goal is to help users plan safe, enjoyable, and compliant pet-friendly trips.

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
