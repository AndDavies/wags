# Wags & Wanders - Pet Travel Planner

Wags & Wanders is a pet travel planning platform that helps pet owners plan trips with their furry companions. This README documents the chatbot functionality.

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
   - **Step 2: Pet Details** - Pet type (dog, cat, bird, etc.) and size (small, medium, large)
   - **Step 3: Preferences** - Number of travelers, trip type, budget, and interests
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

#### Implementation Details

The city autocomplete component (`components/trip/CityAutocomplete.tsx`) handles:

1. Real-time suggestions as you type
2. Graceful fallback for API failures
3. Error handling with helpful messages
4. Proper handling of URL restriction issues

```tsx
// Example of the city autocomplete component usage
<CityAutocomplete 
  id="primaryDestination"
  label="Where are you going?"
  placeholder="e.g., Paris, France"
  value={tripData.primaryDestination}
  onChange={(value) => updateTripData('primaryDestination', value)}
  required
/>
```

### Live Trip Preview

As users enter trip details, a real-time preview panel shows what the trip will look like, displaying:

- Destination and additional cities
- Travel dates with duration calculation
- Pet details including type and size
- Travel preferences

The preview panel helps users visualize their trip as they build it and confirms their entries are being captured correctly.

### Error Handling and Fallbacks

The trip creation module implements robust error handling:

- Components gracefully degrade when APIs are unavailable
- Detailed error messages guide users to solutions
- Troubleshooting links provide self-service options
- Session storage prevents losing data on page refreshes

### Data Persistence

Trip creation data is automatically saved to the browser's localStorage, ensuring that:
- Users don't lose their progress if they accidentally close the modal
- Data persists between sessions until explicitly cleared
- A "Start New Trip" button allows users to reset the form when needed

## Chatbot Implementation

The Wags & Wanders chatbot is built with the following technologies:

- **Frontend**: Next.js, React, TypeScript, and TailwindCSS
- **AI Model**: Grok (grok-2-1212)
- **Backend**: Next.js API routes, Supabase for data

### Key Features

- **Real-time Streaming**: Responses appear as they're generated for a smooth user experience
- **Two-panel Layout**: Chat panel on the left, rich content panel on the right
- **Contextual Suggestions**: Personalized recommendations based on the user's preferences
- **Mobile-responsive Design**: Works well on all screen sizes

### Implementation Details

The chatbot consists of the following key components:

1. **Chat Page (`app/chat/page.tsx`)**:
   - Manages chat state including messages, input, and loading states
   - Implements streaming UX for smooth response generation
   - Connects to the chat API endpoint to process messages
   - Handles cancellation of requests with AbortController

2. **API Route (`app/api/chat/route.ts`)**:
   - Receives and validates chat requests
   - Connects to the Grok API
   - Supports both streaming and non-streaming responses
   - Handles errors gracefully

3. **Chat Utilities (`lib/chat-utils.ts`)**:
   - Contains helper functions for interacting with the Grok API
   - Implements both streaming and non-streaming response handling
   - Formats system prompts and handles error cases

4. **Side Panel Component (`components/ui/side-panel.tsx`)**:
   - Displays rich content related to chat suggestions
   - Provides UI for destination details, images, and booking links

### Environment Variables

The following environment variables need to be set in `.env.local`:

```
GROK_API_KEY=your_grok_api_key
```

### Future Enhancements

Planned enhancements for the chatbot include:

1. **Structured Data Parsing**: Automatically detect and extract recommended destinations
2. **Location Maps**: Integrate maps for suggested destinations
3. **User Preferences**: Store and recall user preferences
4. **Multi-modal Support**: Add image upload capability for pet photos

## Development

### Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env.local` file with necessary API keys

3. Run the development server:
   ```
   npm run dev
   ```

4. Access the chatbot at:
   ```
   http://localhost:3000/chat
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
