// Ensure your Grok API key is set in .env.local as GROK_API_KEY
const grokApiKey = process.env.GROK_API_KEY;

if (!grokApiKey) {
  console.warn(
    'GROK_API_KEY is not set in the environment variables. Chat functionality will be limited.'
  );
}

// Define the type for message history expected by the chat utility
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Generates a chat response using the Grok API.
 *
 * @param messageHistory - An array of messages representing the conversation history.
 *                         Each message should have a 'role' ('user', 'assistant', or 'system')
 *                         and 'content' (the message text).
 * @returns The content of the assistant's response, or null if an error occurs or Grok is not configured.
 */
export async function getGrokChatResponse(
  messageHistory: ChatMessage[]
): Promise<string | null> {
  if (!grokApiKey) {
    console.error('Grok API key is not configured. Check GROK_API_KEY.');
    return 'Sorry, my chat capabilities are currently offline.';
  }

  // PRD-based System Prompt (Customize as needed)
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `You are Wags & Wanders, a proactive, uplifting, and trustworthy pet travel planner chatbot. 
    Your goal is to help users plan joyful, seamless trips with their pets (cats and dogs primarily).
    - Start conversations by asking clarifying questions (work hours, travel style: city/nature, family/solo/luxury) to personalize suggestions.
    - Proactively suggest destinations, activities (like parks, cafes, coworking spaces), and lodging, tailored to user needs (digital nomad, family, luxury).
    - Provide precise, actionable pet policy information (like required documents, vet visit timelines, specific locations for stamps if available in the database later) based on the destination.
    - Embed suggestions as clear, clickable items (the backend will format these later).
    - Keep responses concise, use bullet points for lists, and maintain a positive, empowering tone.
    - When suggesting things, mention *why* it fits the user's stated preferences (e.g., 'Since you prefer nature, try Asheville...').
    - Assume you have access to a pet policy database (via Supabase), Google Places/Yelp APIs for real-time info, and booking links (Expedia/Booking.com), which will be handled by the backend later. Focus on generating the conversational text and identifying *what* information is needed. 
    - Example Interaction Start:
      User: 9-3 work, city, family.
      You: Perfect! Based on your family city preferences, how about Barcelona? 
           * Policy: Standard EU rules - Microchip, rabies vac, EU pet passport or health cert from an official vet 10 days pre-travel.
           * Activity: After 3 PM, Parc de la Ciutadella is great for walks and has pet play areas. [Details needed: Parc de la Ciutadella]
           * Stay: Many spacious, pet-friendly apartments available. [Booking link needed: Barcelona Family Pet Stay]
           Shall I add Barcelona to your potential trip ideas?`
  };

  try {
    console.log('Sending request to Grok API...');
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [systemPrompt, ...messageHistory],
        temperature: 0.7,
        // max_tokens: 1024, // Optional: Limit response length
        // top_p: 1, // Optional: Nucleus sampling
        // stream: false, // Set to true for streaming (handle differently in API route)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Grok API error (${response.status}):`, errorText);
      throw new Error(`Grok API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from Grok API.');
    
    const responseContent = data.choices[0]?.message?.content;

    if (!responseContent) {
      console.error('Grok API returned an empty response.');
      return 'Sorry, I received an unexpected response. Could you try rephrasing?';
    }

    return responseContent;

  } catch (error) {
    console.error('Error fetching response from Grok API:', error);
    return 'Sorry, I encountered an error while processing your request. Please try again later.';
  }
}

/**
 * Sends a streaming request to the Grok API.
 * 
 * @param messageHistory - The conversation history
 * @returns A Response object with a streaming body
 */
export async function streamGrokChatResponse(
  messageHistory: ChatMessage[]
): Promise<Response> {
  if (!grokApiKey) {
    return new Response(
      'data: {"choices":[{"delta":{"content":"Sorry, my chat capabilities are currently offline."}}]}\n\ndata: [DONE]\n\n', 
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }

  // System prompt
  const systemPrompt: ChatMessage = {
    role: 'system',
    content: `You are Wags & Wanders, a proactive, uplifting, and trustworthy pet travel planner chatbot. 
    Your goal is to help users plan joyful, seamless trips with their pets (cats and dogs primarily).
    - Start conversations by asking clarifying questions (work hours, travel style: city/nature, family/solo/luxury) to personalize suggestions.
    - Proactively suggest destinations, activities (like parks, cafes, coworking spaces), and lodging, tailored to user needs (digital nomad, family, luxury).
    - Provide precise, actionable pet policy information (like required documents, vet visit timelines).
    - Keep responses concise, use bullet points for lists, and maintain a positive, empowering tone.
    - When suggesting things, mention *why* it fits the user's stated preferences.`
  };

  // Make streaming API request to Grok
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${grokApiKey}`
      },
      body: JSON.stringify({
        model: 'grok-2-1212',
        messages: [systemPrompt, ...messageHistory],
        stream: true,
        temperature: 0.7,
        max_tokens: 1500,
      })
    });

    // Return the streaming response directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error setting up Grok API stream:', error);
    
    // Return an error in the correct SSE format so the client can handle it
    return new Response(
      'data: {"choices":[{"delta":{"content":"Sorry, I encountered an error. Please try again later."}}]}\n\ndata: [DONE]\n\n', 
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }
} 