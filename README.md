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
