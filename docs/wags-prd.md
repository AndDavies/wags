I’m building the Wags & Wanders Travel Chatbot per the PRD in docs/wags-prd.md (or pasted below if not in project yet). My project is at /Users/andrewdavies/Projects/my-pet-travel-hub/wags-and-wanders, currently at commit 2945c47eb43f36d91c33f703097327a44725770a. 

**Instructions**: 
- Review all existing files in the project, especially in `lib/` (e.g., `supabase-client.ts`, `supabase-server.ts` if present).
- Do NOT create new auth routes, Supabase clients, or duplicate functionality already in `lib/`. Use the existing Supabase setup in `lib/supabase-client.ts` for client-side operations (e.g., auth) and any server-side equivalents (e.g., `supabase-server.ts`) for backend tasks.
- Implement PRD features (e.g., chat widget, rich side-panel) by extending existing files or adding new ones only in specified folders (`app/`, `components/`, `lib/`).
- Suggest changes or new code within this constraint, aligning with PRD sections 3.1 (Features) and 9 (Architecture).

**Task**: 
Help me implement the chat widget (PRD 9.2 Step 3) and rich side-panel (PRD 3.1.2) using `lib/supabase-client.ts` for data fetching and `components/ui/` for the side-panel. Provide code snippets that integrate with my current setup.

**PRD** (if not in docs/wags-prd.md yet): 
Product Requirements Document (PRD): Wags & Wanders Travel Chatbot
1. Overview
1.1 Product Name
Wags & Wanders Travel Chatbot
1.2 Project Goals and Objectives
Primary Goal:
To revolutionize pet-friendly travel planning by delivering a seamless, supportive conversational experience packed with trustworthy, actionable data. The chatbot crafts joyful, bookable itineraries using AI-powered guidance and real-time integrations, tailored for digital nomads, solopreneurs, families, and luxury pet travelers.
Objectives:
Centralize fractured pet travel info (e.g., regulations, activities, lodging) into dynamic, chat-based planning.
Provide precise pet policy guidance (e.g., vet locations, timing, paperwork steps) to build trust implicitly, freeing users to focus on exciting itinerary details.
Suggest destinations, API-backed activities, parks, and cafes with contextual, clickable entries in a rich side-panel.
Enable monetization via hardcoded affiliate booking links (Expedia, Booking.com) designed for easy API integration.
Leverage an existing pet policy database to deliver accurate, reliable guidance, paired with visually rich itineraries.
1.3 Background
Wags & Wanders was born from the frustration of pet parents who want to travel but face regulatory confusion and logistical complexity. Our solution uses a warm, uplifting chatbot to steer users through precise policy steps and inspire them with tailored, pet-friendly itineraries—perfect for digital nomads juggling work and wanderlust, families seeking balance, or luxury travelers craving premium pet experiences.
1.4 Unique Approach: Precise, Personalized, and Visually Rich
Wags starts with upfront questions to personalize trips, then consolidates detailed pet policies from our database, visually rich activities, and hardcoded booking links into one uplifting chat—all within a slick side-panel experience. It’s not just a tool—it’s a reliable co-planner that steers pet parents through logistics with precision, so they can savor the joy of travel.
1.5 Assumptions
Users have internet access and chat familiarity.
APIs (Google Places, Yelp) are functional; affiliate links (Expedia, Booking.com) are hardcoded for MVP, swapped later.
Existing pet policy database is accessible via Supabase and includes vet locations, stamp locations, and timelines.
1.6 Constraints
Focus on cats and dogs at launch.
Rate limits of external APIs apply.
English only in MVP.

2. Target Audience and Needs
2.1 Target Segments
Digital Nomads & Solopreneurs
Profile: Freelancers, remote workers, entrepreneurs with flexible schedules.
Needs: Pet-friendly coworking, cafes with Wi-Fi, long-stay lodging, and policy details that ensure work continuity (e.g., “Get your vet cert stamped here”).
Families with Pets
Profile: Parents traveling with kids and pets, seeking balance and convenience.
Needs: Family-friendly activities (e.g., parks, pet playdates), lodging with space, and clear pet policy steps for stress-free prep.
Luxury Pet Travelers
Profile: Affluent pet owners wanting premium experiences.
Needs: High-end pet-friendly hotels, spas, gourmet pet dining, and detailed logistics for seamless luxury travel.
Overwhelmed Aspiring Travelers
Profile: Users who want to travel with their pet but are unsure where to start.
Needs: Step-by-step policy guidance and uplifting suggestions to make pet travel approachable.
2.2 Common User Needs
Real-time, personalized, pet-inclusive itineraries.
Accurate, actionable pet policy details (e.g., vet timing, stamp locations) for confident planning.
Suggestions with clickable destinations and rich visuals in a side-panel.
Consolidated booking options via affiliate links (Expedia, Booking.com) within the chat.
Inspiration that reduces decision fatigue and planning anxiety.

3. Features and Functionalities
3.1 Feature List (Prioritized)
All features are High (H) priority for a functional, production-ready MVP.
3.1.1 Conversational Embedding (H)
Chat delivers uplifting, precise responses with embedded logistics and suggestions.
Example: “Lisbon’s a gem for nomads—strong Wi-Fi at Fauna & Flora Café, and Portugal’s pet rules are simple: microchip, rabies shot, vet cert stamped at [location] a week before.”
3.1.2 API-Backed Suggestive Dialogue (H)
Proactively recommends cities with pet-friendly coworking, parks, luxury hotels, or family spots via APIs (Google Places, Yelp).
Includes:
Contextual pitch (e.g., “Great for slow travel with your pup”).
Clickable entries (rich side-panel with API-sourced visuals like park photos, hotel previews, maps, reviews).
Hardcoded affiliate links (e.g., “[Book via Booking.com]”).
3.1.3 Policy Precision Engine (H)
Pulls from our full pet policy DB to provide steps like: “For Japan, get a health cert from [DB Vet], stamped at [DB Location] 10 days out—ready for ANA check-in!”
Builds trust implicitly through detailed, reliable data.
3.1.4 Work-Life Balance Scheduling (H)
Users input work hours upfront; chatbot suggests activities outside those times (e.g., “Post-3 PM: visit High Park”) and coworking/cafes with petA access.
3.1.5 Dynamic Inspiration Module (H)
After upfront questions (e.g., “City or nature? Work or play?”), suggests tailored trips: “Barcelona for families—parks and spacious stays—or Tulum for luxury with pet spas.”
3.1.6 Booking Consolidation (H)
Embeds hardcoded Expedia/Booking.com links (e.g., “[Book this stay]”) in suggestions and side-panel, designed for easy API swap later. Tracks itinerary selections for a unified plan.

4. UX and Conversation Design
4.1 Core Design Principles
Proactive: Suggests cities and pet-friendly stops based on upfront questions.
Uplifting: Tone is positive, empowering, and joyful.
Trustworthy: Precise data builds confidence naturally.
Personalized: Upfront questions shape every suggestion.
Interactive: Clickable entries open a rich side-panel—no new tabs.
Clear: Answers use bullet points, short paragraphs, icons.
4.2 Conversation Flow Enhancements
Start: “Hey there! Let’s plan a pawsome trip. Quick Qs: Work hours to avoid? City or nature? Family, solo, or luxury vibe?”
User: “9-3 work, city, family.”
Chatbot: “Perfect! Try Barcelona:
Policy: Microchip, rabies shot—visit [Vet Name] 1 week out, stamp at [location].
After 3 PM: Parc de la Ciutadella (family-friendly, pet play) [side-panel with pics].
Stay: Book this spacious hotel [Booking.com link].
Want to add it?”

5. Data & Integration Requirements
5.1 APIs & Data Sources
Google Places API: Parks, vets, cafes, coworking (filtered for pet-friendliness).
Yelp API: Local reviews for nomad spaces, luxury dining.
Existing Pet Policy DB: Supplies vet names, stamp locations, and timelines for all supported countries (via Supabase).
Booking.com/Expedia Affiliate Links: Hardcoded placeholders (e.g., “[Book here]”) mimicking live links, swapped post-MVP.
5.2 Data Presentation
Example: “Toronto:
Policy: Rabies cert from [Vet Name], stamped at [location] 1 week prior.
Spot: High Park—off-leash area [side-panel with map, pics].
Book: Pet-friendly stay [Booking.com link].”
Clickable entries open rich side-panel with visuals, ratings, navigation.

6. Marketing and Monetization
6.1 Embedded Affiliate Links
Hotels, flights via Expedia/Booking.com (hardcoded placeholders until APIs are live).
Prioritized by pet-friendliness and segment (e.g., luxury hotels, family stays).
6.2 Emotional Hooks for Retargeting
Stores preferences (e.g., “likes cities + family trips”) in Supabase.
Follow-up email: “Loved Barcelona? Here’s a new pet-friendly park we found!”

7. Interaction Flow Overview
Entry Point
Widget opens: “Ready for a trip with your pet? Let’s start with: Work hours? City or nature? Family, solo, or luxury?”
Flow Option A: No Destination Yet
User: “9-5 work, nature, solo.”
Chatbot: “Based on your vibe, try Asheville:
Policy: Rabies shot, vet cert from [Vet Name], stamp at [location].
Activity: Blue Ridge trails [side-panel pics].
Stay: Book here [link].”
Flow Option B: Specific Place
User: “Tokyo with my cat.”
Chatbot: “Tokyo’s set!
Policy: Health cert from [Vet Name], stamped at [location] 10 days out.
Spot: Ueno Park—cat stroll [side-panel].
Stay: Luxury pet hotel [link].”

8. Accessibility & UI Notes
Clickable items are keyboard-accessible (tabindex).
Side-panel images have alt text from API metadata.
Rich side-panel supports visual exploration without interrupting chat.
Screen reader-friendly markup for maps and embedded info.

9. Architecture and Implementation Plan
9.1 Architecture Overview
Frontend: React chat widget with a rich side-panel component in components/ui, pulling visuals from APIs and policy data from Supabase.
Backend: Node.js (Express) server in lib orchestrates API requests, formats responses, and manages state.
LLM: Grok API (via lib/chat-utils.ts) powers conversational logic.
External APIs: Google Places, Yelp, hardcoded Booking.com/Expedia links.
Storage: Supabase integrates existing pet policy DB (vet locations, steps) and user prefs (work hours, travel style).
9.2 Step-by-Step Implementation
Step 1: Set Up the Chatbot Core
LLM Integration: Use Grok API in lib/chat-utils.ts for suggestions and tone.
Prompt: “You are Wags & Wanders, a proactive pet travel planner. Suggest destinations, embed precise policy steps from the DB, and offer clickable activities. Tone is uplifting, responses use bullets. E.g., ‘Try Lisbon: • Sunny walks & pet cafes • Microchip, rabies shot, stamp at [location].’”
Link Supabase to existing pet policy DB in lib/supabase-client.ts.
Step 2: Backend Logic and Formatting
Server: Node.js + Express in lib as API gateway.
Orchestrate: Query Google Places, pull DB policies, inject hardcoded links.
Format: Parse LLM output, wrap suggestions in <button> tags for side-panel.
Step 3: Frontend Integration
Chat Widget: React component in app/chat with message history, input.
Rich Side-Panel: Build in components/ui/side-panel.tsx with API visuals (park pics, maps) and hardcoded links.
Accessibility: Aria-labels, tabindex for all interactive elements.
Step 4: External API Integration
Google Places: Filter by “pet-friendly” keywords.
Hardcode: Mock Booking.com/Expedia links (e.g., “[Book here]”).
Step 5: Monetization & Personalization
Store prefs in Supabase (e.g., { "workHours": "9-5", "style": "luxury" }).
Retargeting: Cron job for follow-up emails.
9.3 Deployment Strategy
Frontend: Vercel for deploys, using app and components.
Backend: Heroku or AWS Lambda via lib.
MVP Scope: 5 cities, full DB policies, rich side-panel, hardcoded links.
Timeline: 6–8 weeks (Backend: 1-2, LLM: 3-4, Frontend: 5-6, Testing: 7-8).

10. Documentation
10.1 User Manual
Content: “How to Plan Your Pet’s Trip” (PDF, web).
Sections: Chat usage, side-panel navigation, troubleshooting.
10.2 Developer Guide
Content: Setup, architecture, API docs, folder usage (lib, components).
Format: Markdown in docs/ (GitHub Wiki).

Folder Structure
New files use existing folders:
app/chat/ – Chat route and widget logic.
components/ui/side-panel.tsx – Rich side-panel component.
lib/supabase-client.ts – DB connection.
lib/chat-utils.ts – LLM and backend logic.

Database Scehma:
[
  {
    "json_agg": [
      {
        "table_name": "email_subscribers",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "subscribed_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "is_confirmed",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": "false"
          },
          {
            "column_name": "email",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "hotels",
        "columns": [
          {
            "column_name": "last_updated",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": "nextval('hotels_id_seq'::regclass)"
          },
          {
            "column_name": "country_scope",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "pet_fees",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "weight_limits",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "breed_restrictions",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "max_pets_per_room",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "types_of_pets_permitted",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "required_documentation",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "pet_friendly_amenities",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "restrictions",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "additional_notes",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "slug",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": "''::text"
          },
          {
            "column_name": "logo",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": "''::text"
          },
          {
            "column_name": "hotel_chain",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "contact_messages",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "email",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "message",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "status",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": "'pending'::text"
          }
        ]
      },
      {
        "table_name": "users",
        "columns": [
          {
            "column_name": "is_anonymous",
            "data_type": "boolean",
            "is_nullable": "NO",
            "column_default": "false"
          },
          {
            "column_name": "last_sign_in_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "raw_app_meta_data",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "raw_user_meta_data",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "is_super_admin",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "phone_confirmed_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "phone_change_sent_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "confirmed_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "email_change_confirm_status",
            "data_type": "smallint",
            "is_nullable": "YES",
            "column_default": "0"
          },
          {
            "column_name": "banned_until",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "reauthentication_sent_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "is_sso_user",
            "data_type": "boolean",
            "is_nullable": "NO",
            "column_default": "false"
          },
          {
            "column_name": "deleted_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "instance_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "email_confirmed_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "invited_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "confirmation_sent_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "recovery_sent_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "email_change_sent_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "full_name",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "phone_change",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": "''::character varying"
          },
          {
            "column_name": "email_change_token_new",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "avatar_url",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "email_change",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "phone_change_token",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": "''::character varying"
          },
          {
            "column_name": "aud",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "role",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "email",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "encrypted_password",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "email_change_token_current",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": "''::character varying"
          },
          {
            "column_name": "phone",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": "NULL::character varying"
          },
          {
            "column_name": "confirmation_token",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "reauthentication_token",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": "''::character varying"
          },
          {
            "column_name": "recovery_token",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "authors",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "bio",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "avatar_url",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "categories",
        "columns": [
          {
            "column_name": "id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": "nextval('categories_id_seq'::regclass)"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "blog_posts",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "published_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "author_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "is_published",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": "false"
          },
          {
            "column_name": "is_featured",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "tags",
            "data_type": "ARRAY",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "featured_image",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "slug",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "excerpt",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "content",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "meta_description",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "top_lists",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "top_list_items",
        "columns": [
          {
            "column_name": "top_list_id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "rank",
            "data_type": "integer",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "image_url",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "conversations",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "history_json",
            "data_type": "jsonb",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          }
        ]
      },
      {
        "table_name": "services",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "title",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "image_url",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "profiles",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "NO",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "username",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "full_name",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "avatar_url",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "pet_policies",
        "columns": [
          {
            "column_name": "updated_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "entry_requirements",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "additional_info",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "external_links",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp with time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "policy_id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": "nextval('pet_policies_policy_id_seq'::regclass)"
          },
          {
            "column_name": "country_name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "slug",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "external_link",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "quarantine_info",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "flag_path",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "activities",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "location",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "interest",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "description",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "locations",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "results",
            "data_type": "jsonb",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "query",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "source",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "vets",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "trip_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "address",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "phone",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "location_type",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "countries",
        "columns": [
          {
            "column_name": "official_links",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "country_id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": "nextval('countries_country_id_seq'::regclass)"
          },
          {
            "column_name": "iso_code",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "slug",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "additional_info",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "flag_path",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "country_name",
            "data_type": "character varying",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "notifications",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "read",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": "false"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "message",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "policy_fees",
        "columns": [
          {
            "column_name": "fee_id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": "nextval('policy_fees_fee_id_seq'::regclass)"
          },
          {
            "column_name": "policy_id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "fee_amount",
            "data_type": "numeric",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "fee_type",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "fee_currency",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "details",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "policy_comments",
        "columns": [
          {
            "column_name": "comment_id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": "nextval('policy_comments_comment_id_seq'::regclass)"
          },
          {
            "column_name": "policy_id",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "user_id",
            "data_type": "integer",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "is_published",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": "false"
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "CURRENT_TIMESTAMP"
          },
          {
            "column_name": "comment_text",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "trips",
        "columns": [
          {
            "column_name": "tips",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": "'{}'::jsonb"
          },
          {
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "travelers",
            "data_type": "jsonb",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "destination_vet",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": "'{}'::jsonb"
          },
          {
            "column_name": "itinerary",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": "'{}'::jsonb"
          },
          {
            "column_name": "checklist",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": "'{}'::jsonb"
          },
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "dates",
            "data_type": "jsonb",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "archived",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": "false"
          },
          {
            "column_name": "origin_vet",
            "data_type": "jsonb",
            "is_nullable": "YES",
            "column_default": "'{}'::jsonb"
          },
          {
            "column_name": "departure",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "destination",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "status",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": "'upcoming'::text"
          },
          {
            "column_name": "method",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "pets",
        "columns": [
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "user_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "age",
            "data_type": "integer",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "weight",
            "data_type": "numeric",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "breed",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "medical_history",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "airline_pet_policies",
        "columns": [
          {
            "column_name": "user_rating",
            "data_type": "numeric",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "pets_in_cabin",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "pets_in_cargo",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "pets_in_checked_baggage",
            "data_type": "boolean",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "weight_limit",
            "data_type": "integer",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "fees_usd",
            "data_type": "integer",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "last_updated",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "breed_restrictions",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "health_cert",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "logo",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "phone_number",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "additional_details",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "country",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "airline",
            "data_type": "character varying",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "source",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "url",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "crate_carrier_size_max",
            "data_type": "text",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "slug",
            "data_type": "character varying",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "documents",
        "columns": [
          {
            "column_name": "id",
            "data_type": "uuid",
            "is_nullable": "NO",
            "column_default": "uuid_generate_v4()"
          },
          {
            "column_name": "trip_id",
            "data_type": "uuid",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "created_at",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": "now()"
          },
          {
            "column_name": "file_name",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          },
          {
            "column_name": "file_path",
            "data_type": "text",
            "is_nullable": "NO",
            "column_default": null
          }
        ]
      },
      {
        "table_name": "airline_pet_policies_sorted",
        "columns": [
          {
            "column_name": "fees_usd",
            "data_type": "integer",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "last_updated",
            "data_type": "timestamp without time zone",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "user_rating",
            "data_type": "numeric",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "airline",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "country",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "slug",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          },
          {
            "column_name": "logo",
            "data_type": "character varying",
            "is_nullable": "YES",
            "column_default": null
          }
        ]
      }
    ]
  }
]