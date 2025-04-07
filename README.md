# Wags & Wanders - Pet Travel Planner

Wags & Wanders is a pet travel planning platform that helps pet owners plan trips with their furry companions. This README documents the chatbot functionality.

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
