import { NextResponse } from 'next/server';
import { getGrokChatResponse, streamGrokChatResponse } from '@/lib/chat-utils';

// Define the expected request body type
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
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

    // If streaming is requested, use our streamGrokChatResponse utility
    if (body.stream) {
      return streamGrokChatResponse(body.messages);
    }

    // Non-streaming response
    const response = await getGrokChatResponse(body.messages);

    if (!response) {
      return NextResponse.json(
        { error: 'Failed to get response from Grok API' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: response,
      sidePanelData: null // This will be updated when we implement structured data
    });

  } catch (error) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}