import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check auth status
    const { data: { session } } = await supabase.auth.getSession();
    
    // Get request body
    const body = await req.json();
    const { messages, temperature = 0.7, max_tokens = 1000 } = body;
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      );
    }
    
    // Prepare the default system message if not provided
    const hasSystemMessage = messages.some(msg => msg.role === 'system');
    
    if (!hasSystemMessage) {
      messages.unshift({
        role: 'system',
        content: `
You are a helpful AI assistant for Wags & Wanders, a pet travel planning platform. Your goal is to help users 
plan pet-friendly trips, provide information about pet travel requirements, and offer advice on traveling with pets.

When responding to users:
1. Be concise and friendly
2. Focus on pet-related travel information
3. Suggest pet-friendly activities, accommodations, and restaurants when appropriate
4. When making suggestions, ask if they'd like to add these to their itinerary
5. Provide accurate information about pet travel regulations and requirements
6. Be helpful and supportive for all types of pets

You have access to a database of pet-friendly hotels, airlines with pet policies, and activities.
If asked about specific policies, indicate that the user can check the directory on Wags & Wanders.
`
      });
    }
    
    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature,
      max_tokens,
    });
    
    // Extract the response content
    const content = response.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response.';
    
    // Save the conversation if user is authenticated
    if (session?.user) {
      const userId = session.user.id;
      
      // Add the new response to messages
      const updatedMessages = [
        ...messages,
        { role: 'assistant', content }
      ];
      
      // Check if there's an existing conversation
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!fetchError && existingConversations && existingConversations.length > 0) {
        // Update existing conversation
        await supabase
          .from('conversations')
          .update({
            history_json: updatedMessages
          })
          .eq('id', existingConversations[0].id);
      } else if (!fetchError) {
        // Create new conversation
        await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            history_json: updatedMessages
          });
      }
    }
    
    // Return the response
    return NextResponse.json({
      content,
      usage: response.usage
    });
  } catch (error: any) {
    console.error('Error in trip assistant API:', error);
    
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'An error occurred while processing your request';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 