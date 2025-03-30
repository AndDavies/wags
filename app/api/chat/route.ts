import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Part { type: string; text: string; }
interface ChatMessage { role: string; content: string; parts?: Part[]; memory?: ConversationMemory; }
interface ConversationMemory { destination?: string; travelDates?: { start: string; end: string }; petTypes?: string[]; petNames?: string[]; airline?: string }
interface ChatResponse { content: string; updatedMemory: ConversationMemory; }

async function extractTripDetails(message: string): Promise<{ origin: string; destination: string; petType: string; dates: { start: string; end: string }; airline: string; petName: string }> {
  const originMatch = message.match(/from\s+([A-Za-z\s]+),?/i) || ["", "Unknown"];
  const datesMatch = message.match(/([A-Za-z]+\s+\d+(-\d+)?)/i) || ["", "June 1-10"];
  const destinationMatch = message.match(/(?:to|in)\s+([A-Za-z\s]+),?/i) || ["", "France"];
  const petMatch = message.match(/(dog|cat|ferret)/i) || ["", "dog"];
  const airlineMatch = message.match(/(Air Canada|Southwest|[A-Za-z\s]+)\s+booked/i) || ["", "Air Canada"];
  const petNameMatch = message.match(/my\s+(dog|cat|ferret)\s+(?:is\s+)?([A-Za-z]+)/i);

  const parsed = {
    origin: originMatch[1].trim(),
    dates: { start: datesMatch[1].split("-")[0].trim(), end: datesMatch[1].split("-")[1]?.trim() || datesMatch[1].split("-")[0].trim() },
    destination: destinationMatch[1].trim(),
    petType: petMatch[1].toLowerCase(),
    airline: airlineMatch[1].trim(),
    petName: petNameMatch ? petNameMatch[2].trim() : "Max",
  };
  console.log("Extracted Trip Details:", parsed);
  return parsed;
}

async function generateItinerary(parsed: { origin: string; destination: string; petType: string; dates: { start: string; end: string }; airline: string; petName: string }): Promise<string> {
  const supabase = await createClient();
  const { data: airlineData } = await supabase.from("airlines").select("*").eq("airline", parsed.airline).single();
  const { data: policyData } = await supabase.from("pet_policies").select("entry_requirements").eq("country_name", parsed.destination).single();
  const { data: activitiesData } = await supabase.from("activities").select("name").eq("location", `${parsed.destination}, France`).limit(1).single();

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googleApiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY");

  const hotelResponse = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=pet+friendly+hotels+in+${encodeURIComponent(parsed.destination)}&key=${googleApiKey}`);
  const hotelData = await hotelResponse.json();
  const hotels = hotelData.results?.slice(0, 2).map((h: any) => ({ name: h.name, address: h.formatted_address })) || [];

  const vetResponse = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=veterinarian+in+${encodeURIComponent(parsed.destination)}&key=${googleApiKey}`);
  const vetData = await vetResponse.json();
  const vets = vetData.results?.slice(0, 2).map((v: any) => ({ name: v.name, address: v.formatted_address })) || [];

  const prompt = `Using this data: [${parsed.airline}: ${airlineData?.crate_carrier_size_max || "21.5x15.5x9 carrier"}, $${airlineData?.fees_usd || 50} fee], [${parsed.destination}: ${JSON.stringify(policyData?.entry_requirements || [])}], [Activity: ${activitiesData?.name || "Jardin des Tuileries"}], [Hotels: ${JSON.stringify(hotels)}], [Vets: ${JSON.stringify(vets)}], generate a full travel itinerary for a small, anxious ${parsed.petType} named ${parsed.petName} from ${parsed.origin} to ${parsed.destination}, ${parsed.dates.start}-${parsed.dates.end}. Include a detailed prep timeline with explicit vet appointment timing and paperwork approval locations based on medical/vaccination requirements, plus travel day logistics and pet-friendly activities in ${parsed.destination}. Present it in a clear, organized format with bullet points.`;

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error?.message || "Gemini API call failed");

  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Sorry, I couldn’t generate a response right now.";
}

async function getEntryRequirements(message: string, memory: ConversationMemory): Promise<string> {
  const supabase = await createClient();
  const destination = memory.destination || "France";
  const petName = memory.petNames?.[0] || "your pet";

  const { data: policyData } = await supabase.from("pet_policies").select("entry_requirements").eq("country_name", destination).single();

  const prompt = `Using this data: [${destination}: ${JSON.stringify(policyData?.entry_requirements || [])}], explain the entry requirements for bringing a dog named ${petName} into ${destination} from Canada. Present it in a clear, organized format with bullet points.`;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error?.message || "Gemini API call failed");

  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Sorry, I couldn’t fetch entry requirements right now.";
}

async function askFollowUp(message: string, memory: ConversationMemory): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  const prompt = `Previous context: ${JSON.stringify(memory)}. The user said: "${message}". Ask a concise follow-up question to clarify their intent, using the context if relevant, or provide a helpful response if the intent is clear.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 100, temperature: 0.7 },
    }),
  });

  const result = await response.json();
  if (!response.ok || result.error) throw new Error(result.error?.message || "Gemini API call failed");

  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Could you clarify what you’d like me to help with?";
}

export async function POST(req: NextRequest) {
  try {
    const { content, memory: previousMemory } = (await req.json()) as ChatMessage;
    console.log("User Input Received:", content, "Previous Memory:", previousMemory);

    let generatedText: string;
    let updatedMemory: ConversationMemory = previousMemory || {};

    const lowerContent = content.toLowerCase();
    if (lowerContent.match(/(to|in)\s+[a-z\s]+.*(june|july|\d+-\d+)/i) || lowerContent.includes("trip")) {
      const parsed = await extractTripDetails(content);
      generatedText = await generateItinerary(parsed);
      updatedMemory = {
        destination: parsed.destination,
        travelDates: parsed.dates,
        petTypes: [parsed.petType],
        petNames: [parsed.petName],
        airline: parsed.airline,
      };
    } else if (lowerContent.includes("entry requirements") || lowerContent.includes("enter") || lowerContent.includes("medical documents")) {
      generatedText = await getEntryRequirements(content, updatedMemory);
    } else {
      generatedText = await askFollowUp(content, updatedMemory);
    }

    const chatResponse: ChatResponse = {
      content: generatedText,
      updatedMemory,
    };
    console.log("Chat Response Prepared:", chatResponse);

    return NextResponse.json(chatResponse, { status: 200 });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ content: "Oops, something went wrong! Try again?" }, { status: 500 });
  }
}