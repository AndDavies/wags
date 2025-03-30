import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Part { type: string; text: string; }
interface ChatMessage { role: string; content: string; parts?: Part[]; }
interface ConversationMemory { destination?: string; travelDates?: { start: string; end: string }; petTypes?: string[]; petNames?: string[]; airline?: string }
interface ChatResponse { content: string; updatedMemory?: ConversationMemory; }
interface PlaceResult { name: string; formatted_address: string; }

async function extractTripDetails(message: string): Promise<{ origin: string; destination: string; petType: string; dates: { start: string; end: string }; airline: string; petName: string }> {
  const originMatch = message.match(/from\s+([A-Za-z\s]+),?/i) || ["", "Toronto"];
  const datesMatch = message.match(/([A-Za-z]+\s+\d+-\d+)/i) || ["", "June 1-10"];
  const destinationMatch = message.match(/to\s+([A-Za-z\s]+),?/i) || ["", "Paris"];
  const petMatch = message.match(/(dog|cat|ferret)/i) || ["", "dog"];
  const airlineMatch = message.match(/(Air Canada|Southwest|[A-Za-z\s]+)\s+booked/i) || ["", "Air Canada"];
  const petNameMatch = message.match(/my\s+(dog|cat|ferret)\s+is\s+([A-Za-z]+)/i);

  const parsed = {
    origin: originMatch[1].trim(),
    dates: { start: datesMatch[1].split("-")[0].trim(), end: datesMatch[1].split("-")[1].trim() },
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

  const hotelResponse = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=pet+friendly+hotels+in+${encodeURIComponent(parsed.destination)}&key=${googleApiKey}`
  );
  const hotelData = await hotelResponse.json();
  const hotels = hotelData.results?.slice(0, 2).map((h: PlaceResult) => ({ name: h.name, address: h.formatted_address })) || [];
  console.log("Hotel Data:", hotels);

  const vetResponse = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?query=veterinarian+in+${encodeURIComponent(parsed.destination)}&key=${googleApiKey}`
  );
  const vetData = await vetResponse.json();
  const vets = vetData.results?.slice(0, 2).map((v: PlaceResult) => ({ name: v.name, address: v.formatted_address })) || [];
  console.log("Vet Data:", vets);

  const prompt = `Using this data: [${parsed.airline}: ${airlineData?.crate_carrier_size_max || "21.5x15.5x9 carrier"}, $${airlineData?.fees_usd || 50} fee], [${parsed.destination}: ${JSON.stringify(policyData?.entry_requirements || [])}], [configuration: ${activitiesData?.name || "Jardin des Tuileries"}], [Hotels: ${JSON.stringify(hotels)}], [Vets: ${JSON.stringify(vets)}], generate a full travel itinerary for a small, anxious ${parsed.petType} named ${parsed.petName} from ${parsed.origin} to ${parsed.destination}, ${parsed.dates.start}-${parsed.dates.end}. Include a detailed prep timeline with explicit vet appointment timing and paperwork approval locations based on medical/vaccination requirements, plus travel day logistics and pet-friendly activities in ${parsed.destination}. Present it in a clear, organized format with bullet points.`;

  console.log("Generated Prompt for Itinerary:", prompt);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
      }),
    }
  );

  const result = await response.json();
  console.log("Gemini Raw Response:", JSON.stringify(result, null, 2));

  if (!response.ok || result.error) throw new Error(result.error?.message || "Gemini API call failed");

  const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Sorry, I couldn’t generate a response right now.";
  console.log("Generated Itinerary Text:", generatedText);
  return generatedText;
}

async function askFollowUp(message: string, memory: ConversationMemory): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  const prompt = `Previous context: ${JSON.stringify(memory)}. The user said: "${message}". Ask a concise follow-up question to clarify their intent, using the context if relevant.`;
  console.log("Asking Follow-Up with Prompt:", prompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 100, temperature: 0.7 },
      }),
    }
  );

  const result = await response.json();
  console.log("Gemini Follow-Up Response:", JSON.stringify(result, null, 2));

  if (!response.ok || result.error) throw new Error(result.error?.message || "Gemini API call failed");

  const followUpText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Could you clarify what you’d like me to help with?";
  console.log("Generated Follow-Up Text:", followUpText);
  return followUpText;
}

async function getEntryRequirements(message: string, memory: ConversationMemory): Promise<string> {
  const supabase = await createClient();
  const destination = memory.destination || "Paris"; // Default if not in memory yet
  const petName = memory.petNames?.[0] || "your pet";

  const { data: policyData } = await supabase.from("pet_policies").select("entry_requirements").eq("country_name", destination).single();

  const prompt = `Using this data: [${destination}: ${JSON.stringify(policyData?.entry_requirements || [])}], explain the entry requirements for bringing a dog named ${petName} into ${destination} from Canada. Present it in a clear, organized format with bullet points.`;
  console.log("Entry Requirements Prompt:", prompt);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Missing GEMINI_API_KEY");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    }
  );

  const result = await response.json();
  console.log("Gemini Entry Requirements Response:", JSON.stringify(result, null, 2));

  if (!response.ok || result.error) throw new Error(result.error?.message || "Gemini API call failed");

  const entryText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Sorry, I couldn’t fetch entry requirements right now.";
  console.log("Generated Entry Requirements Text:", entryText);
  return entryText;
}

export async function POST(req: NextRequest) {
  try {
    const { content } = (await req.json()) as ChatMessage;
    console.log("User Input Received:", content);

    let generatedText: string;
    let updatedMemory: ConversationMemory = {};

    // Check if this is a trip-planning request
    if (content.toLowerCase().match(/to\s+[a-z\s]+,\s*[a-z]+\s+\d+-\d+/i)) {
      const parsed = await extractTripDetails(content);
      generatedText = await generateItinerary(parsed);
      updatedMemory = {
        destination: parsed.destination,
        travelDates: parsed.dates,
        petTypes: [parsed.petType],
        petNames: [parsed.petName],
        airline: parsed.airline,
      };
    } 
    // Check for entry requirement requests
    else if (content.toLowerCase().includes("entry requirements") || content.toLowerCase().includes("enter the country")) {
      generatedText = await getEntryRequirements(content, updatedMemory); // Pass current memory
    } 
    // Fallback to follow-up
    else {
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