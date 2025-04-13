import { Trip, TripDay } from './trip-service';

/**
 * Service to generate AI-powered itineraries for trips
 */
export class ItineraryGenerator {
  /**
   * Generate an itinerary for a trip using AI
   * @param trip The trip to generate an itinerary for
   * @returns The updated trip days with activities
   */
  static async generateItinerary(trip: Trip): Promise<{ days: TripDay[], rawResponse?: string }> {
    try {
      const response = await fetch('/api/ai/generate-itinerary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trip }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate itinerary');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating itinerary:', error);
      throw error;
    }
  }
} 