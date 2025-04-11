import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

// Define types for the request and response
type TripDetails = {
  destination: string;
  startDate: string | Date;
  endDate: string | Date;
  petDetails: {
    type: string;
    size: string;
    breed?: string;
  };
  preferences?: {
    budget?: string;
    accommodationType?: string[];
    interests?: string[];
  };
};

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type SuggestedActivity = {
  type: 'activity' | 'hotel' | 'restaurant';
  title: string;
  description: string;
  location?: string;
  isPetFriendly: boolean;
};

type ApiRequest = {
  messages: Message[];
  trip: TripDetails;
};

type ApiResponse = {
  text: string;
  suggestedActivities?: SuggestedActivity[];
};

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
    const body = await req.json() as ApiRequest;
    const { messages, trip } = body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }
    
    if (!trip || !trip.destination) {
      return NextResponse.json(
        { error: 'Trip details are required' },
        { status: 400 }
      );
    }
    
    // Create system prompt with trip details
    const systemPrompt = createSystemPrompt(trip);
    
    // Add system prompt to beginning of messages array
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: fullMessages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Extract response text
    const responseText = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    // Extract suggested activities if any
    const suggestedActivities = extractSuggestedActivities(responseText);
    
    // Save the conversation if user is authenticated
    if (session?.user) {
      const userId = session.user.id;
      
      // Add the new response to messages
      const updatedMessages = [
        ...messages,
        { role: 'assistant', content: responseText }
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
    
    return NextResponse.json({
      text: responseText,
      suggestedActivities
    });
  } catch (error) {
    console.error('Error in trip assistant API:', error);
    
    // Type assertion for the error
    const typedError = error as { status?: number; message?: string };
    
    const statusCode = typedError.status || 500;
    const errorMessage = typedError.message || 'An error occurred while processing your request';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// Helper function to create system prompt
function createSystemPrompt(trip: TripDetails): string {
  const { destination, startDate, endDate, petDetails, preferences } = trip;
  
  // Format dates
  const formattedStartDate = typeof startDate === 'string' ? startDate : startDate.toDateString();
  const formattedEndDate = typeof endDate === 'string' ? endDate : endDate.toDateString();
  
  // Basic prompt
  let prompt = `You are an expert travel assistant specializing in pet-friendly travel. The user is planning a trip to ${destination} from ${formattedStartDate} to ${formattedEndDate} with their ${petDetails.size} ${petDetails.type}`;
  
  // Add pet breed if available
  if (petDetails.breed) {
    prompt += ` (${petDetails.breed})`;
  }
  
  prompt += '.\n\n';
  
  // Add preferences if available
  if (preferences) {
    prompt += 'Trip preferences:\n';
    
    if (preferences.budget) {
      prompt += `- Budget: ${preferences.budget}\n`;
    }
    
    if (preferences.accommodationType?.length) {
      prompt += `- Accommodation types: ${preferences.accommodationType.join(', ')}\n`;
    }
    
    if (preferences.interests?.length) {
      prompt += `- Interests: ${preferences.interests.join(', ')}\n`;
    }
    
    prompt += '\n';
  }
  
  // Add instructions for the assistant
  prompt += `When suggesting specific activities, hotels, or restaurants, identify them clearly by saying "SUGGESTION: [type]" where type is one of: activity, hotel, restaurant. Include location, description, and whether it's pet-friendly.

Example:
SUGGESTION: hotel
Name: Pet Paradise Hotel
Location: Downtown
Description: Luxury hotel with pet amenities
Pet-friendly: Yes

Provide helpful, specific advice for traveling with pets to ${destination}. Focus on pet-friendly accommodations, activities, restaurants, and transportation options. Consider the specific needs of a ${petDetails.size} ${petDetails.type} when making suggestions.`;
  
  return prompt;
}

// Helper function to extract suggested activities from response text
function extractSuggestedActivities(text: string): SuggestedActivity[] {
  const activities: SuggestedActivity[] = [];
  
  // Use regex to find suggestions in the format 
  // SUGGESTION: type
  // Name: name
  // Location: location (optional)
  // Description: description
  // Pet-friendly: yes/no
  const regex = /SUGGESTION:\s*(\w+)\s*\n+Name:\s*([^\n]+)\s*\n+(?:Location:\s*([^\n]+)\s*\n+)?Description:\s*([^\n]+)\s*\n+Pet-friendly:\s*(\w+)/gi;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    const [_, type, title, location, description, petFriendly] = match;
    
    activities.push({
      type: type.toLowerCase() as 'activity' | 'hotel' | 'restaurant',
      title,
      description,
      location,
      isPetFriendly: petFriendly.toLowerCase() === 'yes'
    });
  }
  
  return activities;
} 