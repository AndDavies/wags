import { NextResponse } from 'next/server';
import { getGrokChatResponse } from '@/lib/chat-utils';

// Define the expected request body type
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    
    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }

    // Get response from Grok API
    const response = await getGrokChatResponse(body.messages);

    if (!response) {
      return NextResponse.json(
        { error: 'Failed to get response from Grok API' },
        { status: 500 }
      );
    }

    // Return the response
    return NextResponse.json({ 
      message: response,
      // In the future, we'll add structured data here for the side panel
      // sidePanelData: { ... }
    });

  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}