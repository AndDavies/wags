import { Trip, TripActivity, TripDay } from './trip-service';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from './supabase-client';

/**
 * AIItineraryService - Handles the generation of AI-powered travel itineraries
 * 
 * This service communicates with an AI model to generate detailed travel itineraries
 * based on user preferences, trip details, and pet information.
 */
export class AIItineraryService {
  private supabase = createClient();
  
  /**
   * Generates a complete itinerary based on trip data
   * 
   * @param tripData - The trip data containing preferences, destination, dates, etc.
   * @returns Promise<Trip> - Enhanced trip with AI-generated activities
   */
  async generateItinerary(tripData: Trip): Promise<Trip> {
    try {
      // Create a deep copy of the trip to avoid mutations
      const enhancedTrip = JSON.parse(JSON.stringify(tripData)) as Trip;
      
      // Generate system prompt based on trip data
      const systemPrompt = this.createSystemPrompt(enhancedTrip);
      
      // Make API call to AI service
      const response = await fetch('/api/ai/itinerary-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripData: enhancedTrip,
          systemPrompt,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process the AI response
      const processedActivities = this.processAIResponse(data.activities, enhancedTrip);
      
      // Assign activities to trip days
      this.assignActivitiesToDays(enhancedTrip, processedActivities);
      
      // Save the generated itinerary to Supabase for caching/history
      await this.saveGeneratedItinerary(enhancedTrip);
      
      return enhancedTrip;
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw error;
    }
  }
  
  /**
   * Creates a detailed system prompt for the AI based on trip details
   * 
   * @param trip - The trip data to include in the prompt
   * @returns string - A formatted system prompt
   */
  private createSystemPrompt(trip: Trip): string {
    const petDetails = trip.petDetails;
    const startDate = trip.startDate instanceof Date 
      ? trip.startDate.toISOString().split('T')[0]
      : trip.startDate;
    const endDate = trip.endDate instanceof Date 
      ? trip.endDate.toISOString().split('T')[0]
      : trip.endDate;
    
    // Calculate trip duration
    const start = trip.startDate instanceof Date 
      ? trip.startDate 
      : new Date(trip.startDate);
    const end = trip.endDate instanceof Date 
      ? trip.endDate 
      : new Date(trip.endDate);
    const tripDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    
    return `
You are an expert travel planner specializing in pet-friendly travel. Your task is to create a detailed itinerary for a trip to ${trip.destination}.

TRIP DETAILS:
- Destination: ${trip.destination}
- Travel Dates: ${startDate} to ${endDate} (${tripDuration} days)
- Pet Type: ${petDetails.type}
- Pet Size: ${petDetails.size}
- Pet Breed: ${petDetails.breed || 'Not specified'}
- Travelers: ${trip.preferences?.tripType || 'Not specified'}
- Budget: ${trip.preferences?.budget || 'moderate'}
- Accommodation Preferences: ${trip.preferences?.accommodationType.join(', ') || 'flexible'}
- Interests: ${trip.preferences?.interests.join(', ') || 'general sightseeing'}

IMPORTANT INSTRUCTIONS:
1. Create a day-by-day itinerary with 3-5 activities per day.
2. Make approximately 70% of activities pet-friendly and 30% non-pet-friendly (for when travelers might leave their pet at the accommodation).
3. Include specific details for each activity: name, description, location, estimated duration, and whether it's pet-friendly.
4. For the first day, include arrival activities and lighter scheduling.
5. For the last day, include departure activities and lighter scheduling.
6. Include a mix of: sightseeing, dining, outdoor activities, cultural experiences, and relaxation.
7. Each day should have a morning, afternoon, and evening component.
8. For each activity, specify a start time in 24-hour format (e.g., "09:00").
9. Recommend one accommodation option compatible with the specified pet type and budget.

Please return the itinerary in a structured JSON format with the following schema:
{
  "days": [
    {
      "dayNumber": 1,
      "activities": [
        {
          "title": "Activity name",
          "description": "Detailed description",
          "type": "activity|restaurant|hotel|transportation",
          "location": "Specific location",
          "startTime": "09:00",
          "endTime": "11:00", 
          "isPetFriendly": true/false
        }
      ]
    }
  ]
}
`;
  }
  
  /**
   * Processes the AI response into structured activity data
   * 
   * @param activities - Raw activity data from the AI
   * @param trip - The original trip data
   * @returns Array<TripActivity> - Processed activities
   */
  private processAIResponse(activities: any[], trip: Trip): TripActivity[] {
    // Validate and enhance the AI response
    return activities.map(activity => {
      // Ensure all required fields exist
      const processedActivity: TripActivity = {
        id: uuidv4(), // Generate unique ID
        type: activity.type || 'activity',
        title: activity.title || 'Untitled Activity',
        description: activity.description || '',
        location: activity.location || trip.destination,
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        isPetFriendly: activity.isPetFriendly ?? true,
      };
      
      // Add optional fields if they exist
      if (activity.bookingUrl) processedActivity.bookingUrl = activity.bookingUrl;
      if (activity.price) processedActivity.price = activity.price;
      if (activity.coordinates) processedActivity.coordinates = activity.coordinates;
      
      return processedActivity;
    });
  }
  
  /**
   * Distributes activities among trip days based on day number
   * 
   * @param trip - The trip to assign activities to
   * @param activities - Processed activities from AI
   */
  private assignActivitiesToDays(trip: Trip, activities: TripActivity[]): void {
    // Group activities by day
    const activitiesByDay = activities.reduce((acc, activity: any) => {
      const dayNumber = activity.dayNumber || 1;
      if (!acc[dayNumber]) acc[dayNumber] = [];
      acc[dayNumber].push(activity);
      return acc;
    }, {} as Record<number, TripActivity[]>);
    
    // Assign activities to trip days
    trip.days.forEach((day, index) => {
      const dayNumber = index + 1;
      const dayActivities = activitiesByDay[dayNumber] || [];
      
      // Sort activities by start time
      dayActivities.sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
      });
      
      // Add activities to the day
      day.activities = dayActivities;
    });
  }
  
  /**
   * Saves the generated itinerary to Supabase for history/caching
   * 
   * @param trip - The generated trip itinerary
   * @returns Promise<void>
   */
  private async saveGeneratedItinerary(trip: Trip): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) return; // Skip if no authenticated user
      
      await this.supabase
        .from('ai_generated_itineraries')
        .insert({
          user_id: user.id,
          trip_id: trip.id,
          destination: trip.destination,
          generated_at: new Date().toISOString(),
          itinerary_data: trip
        });
    } catch (error) {
      // Log but don't throw - this is non-critical
      console.error('Error saving generated itinerary:', error);
    }
  }
}

// Export as singleton instance
export const aiItineraryService = new AIItineraryService(); 