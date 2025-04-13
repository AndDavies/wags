import { NextRequest, NextResponse } from 'next/server';
import { Trip } from '@/lib/trip-service';

// Default OpenAI API configuration
const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4-turbo-preview'; // Using GPT-4 for complex itinerary generation

/**
 * POST handler for itinerary generation
 * 
 * Processes request data and communicates with the OpenAI API to generate a detailed itinerary
 */
export async function POST(req: NextRequest) {
  try {
    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const { tripData, systemPrompt } = await req.json();
    
    if (!tripData || !systemPrompt) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Prepare the messages for the OpenAI API
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Please create a detailed travel itinerary for my trip to ${tripData.destination} with my ${tripData.petDetails.type}.`
      }
    ];

    // Make the API request to OpenAI
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2500, // Generous token limit for detailed itineraries
        response_format: { type: 'json_object' } // Ensure structured JSON response
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: `OpenAI API request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Process the OpenAI response
    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json(
        { error: 'No response generated from OpenAI' },
        { status: 500 }
      );
    }

    // Parse the JSON response from the content
    let parsedResponse;
    try {
      // The AI model should return JSON directly due to response_format setting
      parsedResponse = JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error parsing OpenAI response as JSON:', error);
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON' },
        { status: 500 }
      );
    }

    // Return the structured itinerary data
    return NextResponse.json({
      activities: flattenActivities(parsedResponse),
      raw_response: parsedResponse
    });
    
  } catch (error) {
    console.error('Error in itinerary-generator API:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to flatten the day-based structure from OpenAI into a list of activities
 * 
 * @param response - The structured response from OpenAI
 * @returns Array of activities with day information
 */
function flattenActivities(response: any): any[] {
  if (!response.days || !Array.isArray(response.days)) {
    return [];
  }

  return response.days.flatMap((day: { dayNumber: number; activities?: any[] }) => {
    const dayNumber = day.dayNumber;
    if (!day.activities || !Array.isArray(day.activities)) {
      return [];
    }
    
    return day.activities.map((activity: any) => ({
      ...activity,
      dayNumber
    }));
  });
} 