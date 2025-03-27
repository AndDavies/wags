// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Define the expected message structure from the custom fetch
interface ChatMessage {
  role: string;
  content: string;
  parts?: any[];
}

// Define the expected request body type from the custom fetch
interface ChatRequestBody {
  id: string;
  messages: ChatMessage[];
  petType?: string;
  tags?: string[];
}

// Define the response type
interface ChatResponse {
  content: string;
  queryString?: string;
}

export async function POST(req: NextRequest) {
  const requestId = uuidv4(); // Unique ID for tracking requests in logs
  console.log(`[Chat API] [Request ID: ${requestId}] Received request`);

  try {
    // Parse the request body
    const body: ChatRequestBody = await req.json();
    console.log(`[Chat API] [Request ID: ${requestId}] Body:`, body);

    // Extract the latest user message from the messages array
    const messages = body.messages || [];
    const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const message = latestMessage?.content;

    // Validate the message field
    if (!message || typeof message !== 'string') {
      console.error(`[Chat API] [Request ID: ${requestId}] Error: Message is required and must be a string`);
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Extract petType and tags with defaults
    const petType = body.petType || 'Dog';
    const tags = body.tags || [];

    // Sanitize inputs to prevent injection attacks
    const sanitizedMessage = message.trim();
    const sanitizedPetType = petType.trim();
    const sanitizedTags = tags.map((tag) => tag.trim());

    // Build Gemini prompt with added context
    const prompt = `
      You are Baggo, a pet travel assistant. Always view questions as being from people interested in travelling with their pet and who may not know exactly what to do or where to go. Answer this question: "${sanitizedMessage}"
      - Tailor advice for a ${sanitizedPetType}.
      - If specific details are provided (e.g., country, activities), end with a suggestion to plan a trip, including a query string like "/create-trip?destination=[country]&pet=${sanitizedPetType}&activities=[activity]".
      - If no specific details are provided, give a general pet travel tip.
      Provide a concise, helpful response.
    `;
    console.log(`[Chat API] [Request ID: ${requestId}] Gemini prompt:`, prompt);

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Chat API] [Request ID: ${requestId}] Gemini API failed:`, response.status, errorText);
      throw new Error(`Gemini API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text.trim();
    console.log(`[Chat API] [Request ID: ${requestId}] Gemini response:`, aiResponse);

    // Extract query string from response (if present)
    const queryMatch = aiResponse.match(/\/create-trip\?[^"]+/);
    const queryString = queryMatch ? queryMatch[0] : null;

    // Return the response as standard JSON with explicit Content-Type
    return new NextResponse(JSON.stringify({ content: aiResponse, queryString }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`[Chat API] [Request ID: ${requestId}] Error:`, error);
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}