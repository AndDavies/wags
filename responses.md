# Baggo Conversational Chat Route: Developer Guide

---

## Table of Contents
1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Key Files & Components](#key-files--components)
4. [Pre-Itinerary Flow: Conversational Trip Builder](#pre-itinerary-flow-conversational-trip-builder)
    - [Frontend: ChatBuilder.tsx](#frontend-chatbuildertsx)
    - [Backend: /api/chat-builder/route.ts](#backend-apichat-builderroutets)
    - [State Management](#state-management)
    - [API/Assistant Interactions](#apiassistant-interactions)
    - [UI Transitions](#ui-transitions)
5. [Itinerary Generation](#itinerary-generation)
6. [Post-Itinerary Flow: Itinerary Refinement Chatbot](#post-itinerary-flow-itinerary-refinement-chatbot)
    - [Frontend: Chatbot.tsx](#frontend-chatbottsx)
    - [Backend: /api/chatbot/route.ts](#backend-apichatbotroutets)
    - [Tooling & Assistant Functions](#tooling--assistant-functions)
7. [State Management: useTripStore](#state-management-usetripstore)
8. [File Reference & Responsibilities](#file-reference--responsibilities)
9. [Sequence Diagrams](#sequence-diagrams)
10. [Best Practices & Accessibility](#best-practices--accessibility)

---

## Overview

Baggo, the AI-powered pet travel assistant for Wags & Wanders, provides a conversational interface for users to plan and refine pet-friendly trips. The system is split into two main conversational flows:

- **Pre-Itinerary (Trip Building):** Collects trip details via chat, guides the user, and triggers itinerary generation.
- **Post-Itinerary (Refinement):** Assists with questions, modifications, and suggestions for an existing itinerary.

Both flows leverage the OpenAI Assistants API, with dedicated Assistants and tool schemas for each phase.

---

## High-Level Architecture

```mermaid
graph TD
    A[User] -->|/app/chat| B(ChatBuilder.tsx)
    B -->|POST /api/chat-builder| C[chat-builder/route.ts]
    C -->|Assistants API| D[OpenAI Assistant (Pre-Gen)]
    B -->|Trigger| E[Itinerary Generation]
    E -->|POST /api/generate-trip| F[generate-trip/route.ts]
    F -->|OpenAI + Google Places| G[TripData]
    B -->|Show| H[ItineraryView.tsx]
    H -->|Chatbot| I[Chatbot.tsx]
    I -->|POST /api/chatbot| J[chatbot/route.ts]
    J -->|Assistants API| K[OpenAI Assistant (Post-Gen)]
    B & I & H -->|State| L[useTripStore (Zustand)]
```

---

## Key Files & Components

| File/Component                        | Purpose                                                                                 |
|---------------------------------------|-----------------------------------------------------------------------------------------|
| `app/chat/page.tsx`                   | Main chat route. Orchestrates layout, transitions, and loads ChatBuilder/ItineraryView.  |
| `components/trip/ChatBuilder.tsx`     | Conversational UI for building a trip (pre-itinerary).                                  |
| `app/api/chat-builder/route.ts`       | Backend API for chat-builder, manages Assistant thread, tool calls, and state.           |
| `app/api/generate-trip/route.ts`      | Backend API to generate a full itinerary from minimal trip data.                        |
| `components/trip/ItineraryView.tsx`   | Displays the generated itinerary and enables post-gen chat.                             |
| `components/trip/Chatbot.tsx`         | Conversational UI for refining an existing itinerary (post-itinerary).                  |
| `app/api/chatbot/route.ts`            | Backend API for post-itinerary chat, manages Assistant thread and tool calls.           |
| `store/tripStore.ts`                  | Zustand store for all trip data and state management.                                   |
| `components/trip/MarketingSidebar.tsx`| Sidebar with example trips, triggers system updates in chat-builder.                    |

---

## Pre-Itinerary Flow: Conversational Trip Builder

### Frontend: `ChatBuilder.tsx`

- **Purpose:**
  - Provides a chat interface for users to build a trip from scratch.
  - Guides users through destination, dates, travelers, and preferences.
  - Displays assistant and user messages, loading states, and errors.
  - Triggers itinerary generation when ready.

- **Key Behaviors:**
  - On mount, initializes `tripData` in the store if missing.
  - Sends user input to `/api/chat-builder` and displays assistant replies.
  - Handles system messages (e.g., example trip loaded from sidebar).
  - Updates `tripData` in the store based on backend responses.
  - When `triggerItineraryGeneration` is received, calls `/api/generate-trip` and transitions to itinerary view.

- **Props:**
  - `onInitiateItineraryGeneration`: Callback to trigger itinerary generation.

- **Accessibility:**
  - Keyboard navigation, ARIA labels, color contrast, and alt text for images.

### Backend: `/api/chat-builder/route.ts`

- **Purpose:**
  - Handles all chat-builder API requests.
  - Manages OpenAI Assistant thread and run lifecycle.
  - Executes tool calls (set_destination, set_travel_dates, set_travelers, set_preferences, find_points_of_interest, add_interest_or_preference, generate_itinerary).
  - Updates and returns partial `TripData` as needed.
  - Signals when itinerary generation should be triggered.

- **Key Steps:**
  1. Receives user/system message and current `TripData`.
  2. Manages thread (creates or reuses based on `threadId`).
  3. Adds user message and context update to thread.
  4. Creates a run with the pre-itinerary Assistant (`asst_Yr12Gk8JxB8c1KxNRP1Y9zzR`).
  5. Polls for run completion or tool call requirements.
  6. Executes tool calls, updates state, and submits outputs.
  7. Returns assistant reply, updated trip data, and trigger flags.

- **Assistant Model:**
  - Uses `gpt-4.1-2025-04-14` via the OpenAI Assistants API.
  - System instructions and function schemas are configured on the OpenAI platform.

### State Management

- **Zustand Store (`useTripStore`):**
  - Holds the evolving `tripData` object throughout the chat flow.
  - Updated by both frontend (e.g., example trip selection) and backend (via API responses).
  - Persists state in `sessionStorage` for session continuity.

### API/Assistant Interactions

- **Assistant Tool Calls:**
  - `set_destination`: Sets destination and country.
  - `set_travel_dates`: Sets start and end dates (supports flexible formats).
  - `set_travelers`: Sets adults, children, pets.
  - `set_preferences`: Sets budget, accommodation, interests.
  - `find_points_of_interest`: Suggests places based on user queries.
  - `add_interest_or_preference`: Adds a suggested interest to user profile.
  - `generate_itinerary`: Signals readiness to generate the itinerary.

- **System Messages:**
  - Used for non-user-triggered updates (e.g., example trip loaded).
  - Prefixed with `SYSTEM_UPDATE:` and handled specially in the backend.

### UI Transitions

- **From Chat to Itinerary:**
  - When the assistant signals readiness (via `triggerItineraryGeneration`), the frontend calls `/api/generate-trip`.
  - On success, the UI transitions from `ChatBuilder` to `ItineraryView`.
  - The chat may remain available for further assistance.

---

## Itinerary Generation

- **Endpoint:** `/api/generate-trip/route.ts`
- **Purpose:**
  - Generates a full itinerary from the collected (possibly partial) `tripData`.
  - Applies smart defaults for missing fields.
  - Enriches activities with Google Places data.
  - Returns a complete `TripData` object, including itinerary, policy requirements, and preparation steps.
- **Integration:**
  - Called by the frontend when the chat-builder signals readiness.
  - Updates the Zustand store with the generated trip.

---

## Post-Itinerary Flow: Itinerary Refinement Chatbot

### Frontend: `Chatbot.tsx`

- **Purpose:**
  - Provides a chat interface for refining and assisting with an existing itinerary.
  - Loaded within `ItineraryView.tsx` after itinerary generation.
  - Handles user questions, modifications, and suggestions.

- **Key Behaviors:**
  - Sends user input and current `tripData` to `/api/chatbot`.
  - Displays assistant replies and handles tool-triggered actions (e.g., add activity, save progress).
  - Updates state as needed based on backend responses.

### Backend: `/api/chatbot/route.ts`

- **Purpose:**
  - Handles all post-itinerary chat API requests.
  - Manages OpenAI Assistant thread and run lifecycle.
  - Executes tool calls (suggest_places_of_interest, find_nearby_service, check_travel_regulations, add_activity_to_day, save_trip_progress, get_trip_details).
  - Returns assistant replies and action instructions for the frontend.

- **Assistant Model:**
  - Uses `gpt-4.1-2025-04-14` via the OpenAI Assistants API.
  - System instructions focus on interpreting `itinerarySummary` and using tools for refinement.

### Tooling & Assistant Functions

- **Available Tools:**
  - `suggest_places_of_interest`: Suggests activities, attractions, or services.
  - `find_nearby_service`: Finds pet-related services (vets, stores, parks).
  - `check_travel_regulations`: Looks up pet entry rules for a country.
  - `add_activity_to_day`: Adds an activity to a specific day (delegated to frontend).
  - `save_trip_progress`: Saves the current itinerary (delegated to frontend).
  - `get_trip_details`: Retrieves current trip plan details.

- **Context Handling:**
  - Receives `CONTEXT UPDATE:` messages with the latest trip and itinerary summary.
  - Uses this context to answer questions and decide tool usage.

---

## State Management: useTripStore

- **File:** `store/tripStore.ts`
- **Purpose:**
  - Centralized state for all trip data, including itinerary, preferences, and progress.
  - Provides actions for adding/deleting activities, setting trip data, and clearing trips.
  - Persists state in `sessionStorage` for session continuity.
- **Usage:**
  - Accessed by all major components (`ChatBuilder`, `Chatbot`, `ItineraryView`, etc.).
  - Updated by both frontend actions and backend API responses.

---

## File Reference & Responsibilities

| File/Component                        | Responsibility                                                                 |
|---------------------------------------|-------------------------------------------------------------------------------|
| `app/chat/page.tsx`                   | Orchestrates chat route, layout, and transitions between chat and itinerary.   |
| `components/trip/ChatBuilder.tsx`     | Handles pre-itinerary conversational flow and state updates.                  |
| `app/api/chat-builder/route.ts`       | Backend for chat-builder, manages Assistant, tool calls, and state.           |
| `app/api/generate-trip/route.ts`      | Generates full itinerary from trip data, applies defaults, enriches details.  |
| `components/trip/ItineraryView.tsx`   | Displays generated itinerary, loads Chatbot for refinement.                   |
| `components/trip/Chatbot.tsx`         | Handles post-itinerary conversational flow and refinement.                    |
| `app/api/chatbot/route.ts`            | Backend for post-itinerary chat, manages Assistant, tool calls, and context.  |
| `store/tripStore.ts`                  | Zustand store for all trip data and state management.                         |
| `components/trip/MarketingSidebar.tsx`| Sidebar with example trips, triggers system updates in chat-builder.          |

---

## Sequence Diagrams

### Pre-Itinerary (Trip Building)

```mermaid
sequenceDiagram
    participant U as User
    participant CB as ChatBuilder.tsx
    participant API as /api/chat-builder
    participant OA as OpenAI Assistant (Pre-Gen)
    participant S as useTripStore
    U->>CB: Enter message ("I want to go to Paris")
    CB->>API: POST /api/chat-builder (message, threadId, tripData)
    API->>OA: Add message/context, create run
    OA->>API: Tool call (set_destination)
    API->>OA: Submit tool output
    OA->>API: Reply ("Got it, Paris! When are you traveling?")
    API->>CB: Reply, updatedTripData
    CB->>S: Update tripData
    CB->>U: Display assistant reply
    ...
    OA->>API: Tool call (generate_itinerary)
    API->>CB: triggerItineraryGeneration: true
    CB->>S: Set loading
    CB->>API: POST /api/generate-trip (tripData)
    API->>CB: Full TripData (with itinerary)
    CB->>S: Update tripData
    CB->>U: Transition to ItineraryView
```

### Post-Itinerary (Refinement)

```mermaid
sequenceDiagram
    participant U as User
    participant IV as ItineraryView.tsx
    participant CB as Chatbot.tsx
    participant API as /api/chatbot
    participant OA as OpenAI Assistant (Post-Gen)
    participant S as useTripStore
    U->>CB: Enter message ("Find parks near my hotel on Day 2")
    CB->>API: POST /api/chatbot (message, threadId, tripData)
    API->>OA: Add message/context, create run
    OA->>API: Tool call (suggest_places_of_interest)
    API->>OA: Submit tool output
    OA->>API: Reply ("Here are some parks near your hotel...")
    API->>CB: Reply, actions
    CB->>U: Display assistant reply
    ...
    OA->>API: Tool call (add_activity_to_day)
    API->>CB: Action: add_activity_to_day
    CB->>S: Update tripData
    CB->>U: Confirm addition
```

---

## Best Practices & Accessibility

- **Documentation:**
  - All files and functions should include JSDoc-style comments explaining purpose, inputs, outputs, and dependencies.
- **Accessibility:**
  - All UI components must meet WCAG 2.1 AA standards (ARIA labels, keyboard navigation, color contrast, alt text).
- **Styling:**
  - Use Tailwind CSS and OriginUI-inspired design for `/create-trip` and chat routes.
- **TypeScript:**
  - Use strict typing and modular code structure.
- **Performance:**
  - Minimize re-renders, debounce API calls, and optimize for fast user feedback.

---

## Getting Started for New Developers

1. **Familiarize yourself with the chat flow:**
   - Read this document and the referenced files.
   - Understand the two main conversational phases and their transitions.
2. **Explore the Zustand store (`store/tripStore.ts`):**
   - Learn how trip data is structured and updated.
3. **Review the API routes:**
   - `/api/chat-builder/route.ts` for pre-itinerary chat.
   - `/api/generate-trip/route.ts` for itinerary generation.
   - `/api/chatbot/route.ts` for post-itinerary refinement.
4. **Understand Assistant configuration:**
   - System instructions and function schemas are managed on the OpenAI platform.
   - Review `TASKS.md` and `BAGGO.md` for context and future plans.
5. **Follow best practices:**
   - Write accessible, well-documented, and modular code.
   - Test conversational flows and error handling thoroughly.

---

# End of responses.md 