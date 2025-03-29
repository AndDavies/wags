// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface Part {
  type: string;
  text: string;
}

interface ChatMessage {
  role: string;
  content: string;
  parts?: Part[];
}

interface ConversationMemory {
  destination?: string;
  travelDates?: { start: string; end: string };
  petTypes?: string[];
  petNames?: string[];
}

interface ChatResponse {
  content: string;
  updatedMemory?: ConversationMemory;
}

export async function POST(req: NextRequest) {
  try {
    const { content } = (await req.json()) as ChatMessage;
    console.log("User Input:", content);

    const originMatch = content.match(/from\s+([A-Za-z\s]+),?/i) || ["", "Toronto"];
    const datesMatch = content.match(/([A-Za-z]+\s+\d+-\d+)/i) || ["", "June 1-10"];
    const destinationMatch = content.match(/to\s+([A-Za-z\s]+),?/i) || ["", "Paris"];
    const petMatch = content.match(/(dog|cat|ferret)/i) || ["", "dog"];
    const airlineMatch = content.match(/(Air Canada|Southwest|[A-Za-z\s]+)\s+booked/i) || ["", "Air Canada"];
    const petNameMatch = content.match(/my\s+(dog|cat|ferret)\s+is\s+([A-Za-z]+)/i);

    const origin = originMatch[1].trim();
    const travelDates = datesMatch[1].trim();
    const destination = destinationMatch[1].trim();
    const petType = petMatch[1].toLowerCase();
    const airline = airlineMatch[1].trim();
    const petName = petNameMatch ? petNameMatch[2].trim() : "Max";

    console.log("Parsed:", { origin, travelDates, destination, petType, airline, petName });

    const supabase = await createClient();

    const { data: airlineData } = await supabase
      .from("airlines")
      .select("*")
      .eq("airline", airline)
      .single();

    const { data: policyData } = await supabase
      .from("pet_policies")
      .select("entry_requirements")
      .eq("country_name", destination)
      .single();

    const { data: activitiesData } = await supabase
      .from("activities")
      .select("name")
      .eq("location", `${destination}, France`)
      .limit(1)
      .single();

    const prompt = `<|user|>Using this data: [Air Canada: ${airlineData?.crate_carrier_size_max || "21.5x15.5x9 carrier"}, $${airlineData?.fees_usd || 50} fee], [${destination}: ${JSON.stringify(policyData?.entry_requirements || [])}], [${activitiesData?.name || "Jardin des Tuileries"}], generate a full travel itinerary for a small, anxious ${petType} named ${petName} from ${origin} to ${destination}, ${travelDates}. Include a detailed prep timeline with explicit vet appointment timing and paperwork approval locations based on medical/vaccination requirements, plus travel day logistics and pet-friendly activities in ${destination}. Present it in a clear, organized format.<|assistant|>`;

    console.log("Prompt:", prompt);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 500 },
        }),
      }
    );

    const result = await response.json();
    console.log("HF Raw Response:", result);

    // Strip everything before <|assistant|> and trim
    const generatedText = result[0]?.generated_text?.split("<|assistant|>")[1]?.trim() || "Sorry, I couldn’t generate a response right now. Please try again or provide more details.";

    const chatResponse: ChatResponse = {
      content: generatedText,
      updatedMemory: {
        destination,
        travelDates: { start: travelDates.split("-")[0], end: travelDates.split("-")[1] },
        petTypes: [petType],
        petNames: [petName],
      },
    };

    return NextResponse.json(chatResponse, { status: 200 });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { content: "Oops, something went wrong! Try again?" },
      { status: 500 }
    );
  }
}