import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';
import { Trip, TripActivity, TripDay } from '@/lib/trip-service';

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
    const trip: Trip = body.trip;
    
    if (!trip || !trip.destination) {
      return NextResponse.json(
        { error: 'Trip details are required' },
        { status: 400 }
      );
    }
    
    // Create system prompt with trip details
    const systemPrompt = createItineraryPrompt(trip);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please generate a detailed itinerary for my trip to ${trip.destination} with my ${trip.petDetails.type}.` }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });
    
    // Extract response text
    const responseText = response.choices[0]?.message?.content || 'Sorry, I could not generate an itinerary.';
    
    // Parse the AI response to create structured itinerary activities
    const updatedDays = parseItineraryResponse(responseText, trip.days);
    
    // Return the updated trip with activities
    return NextResponse.json({
      days: updatedDays,
      rawResponse: responseText
    });
  } catch (error) {
    console.error('Error in itinerary generation API:', error);
    
    // Type assertion for the error
    const typedError = error as { status?: number; message?: string };
    
    const statusCode = typedError.status || 500;
    const errorMessage = typedError.message || 'An error occurred while generating your itinerary';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

// Helper function to create itinerary generation prompt
function createItineraryPrompt(trip: Trip): string {
  const { destination, startDate, endDate, petDetails, preferences } = trip;
  
  // Format dates
  const formattedStartDate = typeof startDate === 'string' ? startDate : (startDate as Date).toDateString();
  const formattedEndDate = typeof endDate === 'string' ? endDate : (endDate as Date).toDateString();
  
  // Number of days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const numDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Basic prompt
  let prompt = `You are an expert travel planner specializing in pet-friendly travel. Create a detailed day-by-day itinerary for a ${numDays}-day trip to ${destination} from ${formattedStartDate} to ${formattedEndDate}.

This trip includes a ${petDetails.size} ${petDetails.type}`;
  
  // Add pet breed if available
  if (petDetails.breed) {
    prompt += ` (${petDetails.breed})`;
  }
  
  prompt += '.\n\n';
  
  // Add traveler details
  if (trip.numPeople || trip.numChildren) {
    prompt += `Travelers: `;
    if (trip.numPeople) prompt += `${trip.numPeople} adult(s)`;
    if (trip.numPeople && trip.numChildren) prompt += `, `;
    if (trip.numChildren) prompt += `${trip.numChildren} child(ren)`;
    prompt += `\n`;
  }
  
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
  
  // Add additional cities if applicable
  if (trip.additionalCities && trip.additionalCities.length > 0) {
    prompt += `This trip will also include visits to: ${trip.additionalCities.join(', ')}\n\n`;
  }
  
  // Add specific format instructions
  prompt += `For each day, provide a structured itinerary with morning, afternoon, and evening activities. Each activity should be specifically pet-friendly or should note any pet accommodations needed. 

Format each activity with the following details:
- Title
- Time (e.g., "9:00 AM")
- Location
- Description (2-3 sentences)
- Pet considerations

For each day, include:
- At least one pet-specific activity (park, pet-friendly beach, etc.)
- Meal recommendations at pet-friendly restaurants
- Logistics for moving between activities with a pet

On Day 1, include arrival information and settling in recommendations.
On the final day, include departure logistics.

Use this structured format for each day:

DAY X: [DATE] - [SHORT THEME FOR THE DAY]

MORNING:
- Activity 1: [Title] - [Time]
  Location: [Specific place]
  Description: [2-3 sentences]
  Pet-friendly: [Yes/No/Partial, with explanation]

AFTERNOON:
- Activity 2: [Title] - [Time]
  Location: [Specific place]
  Description: [2-3 sentences]
  Pet-friendly: [Yes/No/Partial, with explanation]

EVENING:
- Activity 3: [Title] - [Time]
  Location: [Specific place]
  Description: [2-3 sentences]
  Pet-friendly: [Yes/No/Partial, with explanation]`;

  return prompt;
}

// Helper function to parse AI response and create structured activities
function parseItineraryResponse(text: string, days: TripDay[]): TripDay[] {
  const updatedDays = [...days];
  
  // Use regex to split by day sections
  const dayRegex = /DAY\s+(\d+):[^\n]*/gi;
  const dayMatches = text.split(dayRegex).filter(Boolean);
  
  // Skip the first element if it's empty (happens with split)
  let startIndex = dayMatches[0].trim() === '' ? 1 : 0;
  
  // Process each day section
  for (let i = startIndex; i < dayMatches.length; i += 2) {
    const dayNumber = parseInt(dayMatches[i], 10);
    if (isNaN(dayNumber) || dayNumber > updatedDays.length) continue;
    
    const dayContent = dayMatches[i + 1];
    if (!dayContent) continue;
    
    // Process day content by time periods
    const dayIndex = dayNumber - 1;
    const activities: TripActivity[] = [];
    
    // Extract activities from different parts of the day
    extractActivitiesFromSection(dayContent, "MORNING", activities, "09:00");
    extractActivitiesFromSection(dayContent, "AFTERNOON", activities, "13:00");
    extractActivitiesFromSection(dayContent, "EVENING", activities, "18:00");
    
    // Add any extracted activities to the day
    if (activities.length > 0) {
      updatedDays[dayIndex].activities = activities;
    }
  }
  
  return updatedDays;
}

// Helper to extract activities from a section of the day
function extractActivitiesFromSection(text: string, section: string, activities: TripActivity[], defaultTime: string): void {
  const sectionRegex = new RegExp(`${section}:\\s*([\\s\\S]*?)(?:(?:AFTERNOON|EVENING|DAY|$))`, 'i');
  const sectionMatch = text.match(sectionRegex);
  
  if (!sectionMatch || !sectionMatch[1]) return;
  
  const sectionText = sectionMatch[1].trim();
  
  // Extract individual activities (starting with a dash)
  const activityRegex = /[-•]\s*Activity\s*\d*:\s*([^-\n]*?)(?:\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?)?\s*\n\s*Location:\s*([^\n]*)\s*\n\s*Description:\s*([^\n]*(?:\n[^-\n]*)*)\s*\n\s*Pet-friendly:\s*([^\n]*)/gi;
  
  let activityMatch;
  while ((activityMatch = activityRegex.exec(sectionText)) !== null) {
    const [_, title, time, location, description, petFriendly] = activityMatch;
    
    // Process the time string
    let startTime = defaultTime;
    if (time) {
      // Convert 12-hour format to 24-hour format
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
      if (timeMatch) {
        let [_, hour, minute, period] = timeMatch;
        let hourNum = parseInt(hour, 10);
        
        // Handle 12-hour format conversion
        if (period?.toLowerCase() === 'pm' && hourNum < 12) {
          hourNum += 12;
        } else if (period?.toLowerCase() === 'am' && hourNum === 12) {
          hourNum = 0;
        }
        
        startTime = `${hourNum.toString().padStart(2, '0')}:${minute}`;
      }
    }
    
    // Calculate end time (1 hour after start time by default)
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let endHour = startHour + 1;
    const endMinute = startMinute;
    if (endHour > 23) endHour = 23;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    activities.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'activity',
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      startTime,
      endTime,
      isPetFriendly: petFriendly.toLowerCase().includes('yes')
    });
  }
  
  // Also try to extract restaurants specifically
  const restaurantRegex = /[-•]\s*(?:Meal|Breakfast|Lunch|Dinner):\s*([^-\n]*?)(?:\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)?)?\s*\n\s*Location:\s*([^\n]*)\s*\n\s*Description:\s*([^\n]*(?:\n[^-\n]*)*)\s*\n\s*Pet-friendly:\s*([^\n]*)/gi;
  
  let restaurantMatch;
  while ((restaurantMatch = restaurantRegex.exec(sectionText)) !== null) {
    const [_, title, time, location, description, petFriendly] = restaurantMatch;
    
    // Process the time string (same as above)
    let startTime = defaultTime;
    if (time) {
      const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
      if (timeMatch) {
        let [_, hour, minute, period] = timeMatch;
        let hourNum = parseInt(hour, 10);
        
        if (period?.toLowerCase() === 'pm' && hourNum < 12) {
          hourNum += 12;
        } else if (period?.toLowerCase() === 'am' && hourNum === 12) {
          hourNum = 0;
        }
        
        startTime = `${hourNum.toString().padStart(2, '0')}:${minute}`;
      }
    }
    
    // Calculate end time (1 hour after start time by default)
    const [startHour, startMinute] = startTime.split(':').map(Number);
    let endHour = startHour + 1;
    const endMinute = startMinute;
    if (endHour > 23) endHour = 23;
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    activities.push({
      id: Math.random().toString(36).substring(2, 9),
      type: 'restaurant',
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      startTime,
      endTime,
      isPetFriendly: petFriendly.toLowerCase().includes('yes')
    });
  }
} 