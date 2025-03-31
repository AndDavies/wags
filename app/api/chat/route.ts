import { createClient } from '@/lib/supabase-server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Define a type for Google Places API results
interface PlaceResult {
  name: string;
  [key: string]: unknown; // Allow other properties without enforcing them
}

async function fetchPlaces(destination: string, tags: string[]): Promise<string[]> {
  try {
    const query = `pet-friendly ${tags.join(' ')} in ${destination}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${PLACES_API_KEY}`;
    console.log('Fetching Places API:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Places API failed with status: ${response.status}`);
    const data = await response.json();
    const results = data.results.slice(0, 3).map((place: PlaceResult) => place.name);
    console.log('Places API results:', results);
    return results;
  } catch (error) {
    console.error('Error fetching Places API:', error);
    return ['Explore local parks'];
  }
}

async function fetchVets(destination: string): Promise<string[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=vet+clinic+near+${encodeURIComponent(destination)}&key=${PLACES_API_KEY}`;
    console.log('Fetching Vets API:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Vets API failed with status: ${response.status}`);
    const data = await response.json();
    const results = data.results.slice(0, 2).map((place: PlaceResult) => place.name);
    console.log('Vets API results:', results);
    return results;
  } catch (error) {
    console.error('Error fetching Vets API:', error);
    return ['Local Vet Clinic'];
  }
}

async function fetchHotels(destination: string): Promise<string[]> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=pet-friendly+hotels+near+${encodeURIComponent(destination)}&key=${PLACES_API_KEY}`;
    console.log('Fetching Hotels API:', url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Hotels API failed with status: ${response.status}`);
    const data = await response.json();
    const results = data.results.slice(0, 2).map((place: PlaceResult) => place.name);
    console.log('Hotels API results:', results);
    return results;
  } catch (error) {
    console.error('Error fetching Hotels API:', error);
    return ['Pet-Friendly Hotel'];
  }
}

export async function POST(req: Request) {
  console.log('Received POST request');
  const { messages }: { messages: { role: string; content: string }[] } = await req.json();
  console.log('Messages:', messages);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;
  console.log('User ID:', userId || 'No authenticated user');

  // Retrieve or initialize conversation
  let conversationId = uuidv4();
  let tripData = {
    departure: '',
    destination: '',
    petType: '',
    travelDate: '',
    activityTags: [] as string[],
    activities: [] as string[],
  };

  const existingConv = await supabase
    .from('conversations')
    .select('id, trip_data')
    .eq('user_id', userId || 'anonymous')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingConv.data) {
    conversationId = existingConv.data.id;
    tripData = existingConv.data.trip_data || tripData;
  }

  // Update tripData based on user messages
  for (const m of messages.filter(msg => msg.role === 'user')) {
    const text = m.content.toLowerCase();
    if (text.includes('to') && !tripData.departure) {
      [tripData.departure, tripData.destination] = text.split(' to ').map((s: string) => s.trim());
      tripData.destination = tripData.destination.split(' with ')[0].trim();
    }
    if (text.includes('with') && !tripData.petType) tripData.petType = text.split('with')[1].split('on')[0].trim();
    if (text.includes('on') && !tripData.travelDate) tripData.travelDate = text.split('on')[1].trim();
    else if (['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].some(month => text.includes(month)) && !tripData.travelDate) {
      tripData.travelDate = m.content;
    }
    const activityKeywords = ['relaxing', 'adventure', 'cultural', 'romantic', 'family', 'luxury', 'budget', 'solo', 'historical', 'culinary', 'wellness', 'eco'];
    if (text.includes('yes') || activityKeywords.some(tag => text.includes(tag))) {
      tripData.activityTags = text.split(/[, ]+/).filter(tag => activityKeywords.includes(tag.toLowerCase()));
    }
  }

  const lastMessage = messages[messages.length - 1].content.toLowerCase();
  let tripId: string | null = null;
  let additionalContent = '';

  // Save or update conversation with tripData
  const { error: convError } = await supabase
    .from('conversations')
    .upsert({
      id: conversationId,
      user_id: userId || 'anonymous',
      history_json: JSON.stringify(messages),
      trip_data: tripData,
    });
  if (convError) console.error('Supabase conversation error:', convError);
  else console.log('Conversation saved/updated with ID:', conversationId);

  // Function definitions for OpenAI
  const functions = [
    {
      name: 'fetchPlaces',
      description: 'Fetch pet-friendly activities for a destination based on tags',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['destination', 'tags'],
      },
    },
    {
      name: 'fetchVets',
      description: 'Fetch vet clinics near a destination',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
        },
        required: ['destination'],
      },
    },
    {
      name: 'fetchHotels',
      description: 'Fetch pet-friendly hotels near a destination',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
        },
        required: ['destination'],
      },
    },
  ];

  console.log('Calling OpenAI API with function calling...');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a friendly, expert pet travel assistant for Wags & Wanders. Your goal is to craft a DREAM pet-friendly trip step-by-step. Follow this flow:
        1. Ask for origin and destination if not provided.
        2. Ask for pet type if missing (assume 'dog' if unclear).
        3. Ask for travel date if missing (assume 'Next Month' if not given).
        4. Ask for activities (e.g., Relaxing Beach, Adventure, Cultural Immersion) if not specified, confirm them, and assume 'Family-Friendly, Adventure' if none given.
        5. Once origin and destination are gathered, ask: "Are you ready to build your dream itinerary?" even with partial data.
        6. If they say "yes," call fetchPlaces with tags: ${tripData.activityTags.join(', ') || 'family, adventure'}, then create a 5-day itinerary with activities spread across days, flights, a hotel placeholder, and vets from fetchVets.
        7. If concerned (e.g., "nervous"), call fetchVets and reassure them.
        8. If hotels mentioned, call fetchHotels.
        - Detect sentiment and intent from their last message: "${lastMessage}".
        - Summarize trip details (e.g., "So far: Origin: Paris, Pet: Dog") before each question.
        - Format itinerary richly with bold headings and icons (e.g., **Day 1: Arrival**, **✈️ Activity:**).
        - Embed API data with bold labels and icons (e.g., **✈️ Activities:**, **🐾 Vets:**).
        - End with "Looks good? Want to tweak anything?" after itinerary.
        - Keep it engaging with emojis (🐾✨)!`,
      },
      ...messages.map((msg) => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })),
    ],
    functions,
    function_call: 'auto',
    temperature: 0.7,
    stream: false,
  });

  const responseMessage = completion.choices[0].message;
  console.log('OpenAI response:', responseMessage.content);

  if (responseMessage.function_call) {
    const { name, arguments: args } = responseMessage.function_call;
    const parsedArgs = JSON.parse(args);
    if (name === 'fetchPlaces' && parsedArgs.destination && parsedArgs.tags) {
      tripData.activities = await fetchPlaces(parsedArgs.destination, parsedArgs.tags);
      additionalContent = `\n\n**✈️ Activities:** ${tripData.activities.map(a => `📍 ${a}`).join(', ')}.`;
    } else if (name === 'fetchVets' && parsedArgs.destination) {
      const vets = await fetchVets(parsedArgs.destination);
      additionalContent = `\n\n**🐾 Vets:** ${vets.map(v => `📍 ${v}`).join(', ')}.`;
    } else if (name === 'fetchHotels' && parsedArgs.destination) {
      const hotels = await fetchHotels(parsedArgs.destination);
      additionalContent = `\n\n**🏨 Hotels:** ${hotels.map(h => `📍 ${h}`).join(', ')}.`;
    }
  }

  if (lastMessage.includes('yes') && (lastMessage.includes('itinerary') || tripData.departure && tripData.destination)) {
    tripId = uuidv4();
    // Assume defaults if missing
    if (!tripData.petType) tripData.petType = 'dog';
    if (!tripData.travelDate) tripData.travelDate = 'Next Month';
    if (!tripData.activityTags.length) tripData.activityTags = ['family', 'adventure'];
    tripData.activities = await fetchPlaces(tripData.destination, tripData.activityTags);
    const vets = await fetchVets(tripData.destination);
    const activityList = tripData.activities.length ? tripData.activities : ['Explore local parks'];
    const fullTripData = {
      id: tripId,
      user_id: userId || 'anonymous',
      departure: tripData.departure,
      destination: tripData.destination,
      dates: tripData.travelDate ? { start: tripData.travelDate } : { start: 'TBD' },
      travelers: tripData.petType ? { pet: { type: tripData.petType } } : { pet: { type: 'dog' } },
      method: 'flight',
      status: 'upcoming',
      itinerary: { steps: [{ from: tripData.departure, to: tripData.destination, method: 'flight', activities: tripData.activities }] },
      tips: { general: 'Check pet import rules and pack comfort items.' },
    };
    const { error: tripError } = await supabase.from('trips').insert(fullTripData);
    if (tripError) console.error('Supabase trip error:', tripError);
    else console.log('Trip saved with ID:', tripId);
    additionalContent = `Here’s your DREAM itinerary from ${tripData.departure} to ${tripData.destination} for your ${tripData.petType}! ✨\n\n**Day 1: Arrival in ${tripData.destination}**  \n- **✈️ Travel:** Depart ${tripData.departure} to ${tripData.destination} Airport (book via Expedia).  \n- **🏨 Stay:** Check into a pet-friendly hotel (e.g., Conrad ${tripData.destination}).  \n- **💡 Tip:** Rest up after your journey—your ${tripData.petType} deserves it!\n\n**Day 2: ${tripData.activityTags[0] || 'Explore'}**  \n- **✈️ Activity:** ${activityList[0] ? `📍 ${activityList[0]}` : 'Explore local parks'}.\n\n**Day 3: ${tripData.activityTags[1] || 'Discover'}**  \n- **✈️ Activity:** ${activityList[1] ? `📍 ${activityList[1]}` : 'Visit a local market'}.\n\n**Day 4: ${tripData.activityTags[2] || 'Relax'}**  \n- **✈️ Activity:** ${activityList[2] ? `📍 ${activityList[2]}` : 'Enjoy a quiet day'}.\n\n**Day 5: Departure**  \n- **✈️ Travel:** Return flight from ${tripData.destination} Airport.  \n- **🐾 Vets:** ${vets.map(v => `📍 ${v}`).join(', ')}.\n\nLooks good? Want to tweak anything? 🐾✨`;
  }

  const response = {
    id: uuidv4(),
    role: 'assistant',
    content: (responseMessage.content || '') + additionalContent,
    tripId: tripId || undefined,
    tripData,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}