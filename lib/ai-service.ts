import { Trip } from './trip-service';
import { createClient } from './supabase-client';

// Cache for responses to minimize API calls
const responseCache = new Map<string, { response: string, timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Define message types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatRequest {
  messages: Message[];
  tripData?: Trip;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  message: Message;
  suggestedActions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: 'add_activity' | 'add_hotel' | 'add_restaurant' | 'add_flight' | 'add_vet' | 'add_transportation';
  label: string;
  details?: any;
}

class AIService {
  private supabase = createClient();
  
  // Function to send messages to the AI
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // Create a cache key based on the request
      const cacheKey = this.createCacheKey(request);
      
      // Check cache first
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
        return {
          message: {
            role: 'assistant',
            content: cachedResponse.response
          }
        };
      }
      
      // Generate system message with context if trip data is provided
      if (request.tripData) {
        const systemMessage = this.createTripContextMessage(request.tripData);
        // Add the system message if it doesn't already exist
        if (!request.messages.some(msg => msg.role === 'system')) {
          request.messages.unshift({
            role: 'system',
            content: systemMessage
          });
        }
      }
      
      // Make API call to OpenAI
      const response = await fetch('/api/ai/trip-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 1000
        }),
      });
      
      if (!response.ok) {
        throw new Error(`AI request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract suggested actions if any
      const suggestedActions = this.extractSuggestedActions(data.content);
      
      // Cache the response
      responseCache.set(cacheKey, {
        response: data.content,
        timestamp: Date.now()
      });
      
      // Save conversation if user is logged in
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user && request.tripData) {
        await this.saveConversation(user.id, request.messages, data.content, request.tripData.id);
      }
      
      return {
        message: {
          role: 'assistant',
          content: data.content
        },
        suggestedActions
      };
    } catch (error) {
      console.error('Error in AI chat:', error);
      return {
        message: {
          role: 'assistant',
          content: 'I apologize, but I encountered an error processing your request. Please try again later.'
        }
      };
    }
  }
  
  // Function to get airline pet policies
  async getAirlinePetPolicies(airline?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('airline_pet_policies')
        .select('*');
      
      if (airline) {
        query = query.ilike('airline', `%${airline}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching airline pet policies:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching airline pet policies:', error);
      return [];
    }
  }
  
  // Function to get hotel pet policies
  async getHotelPetPolicies(hotel?: string, location?: string): Promise<any[]> {
    try {
      let query = this.supabase
        .from('hotels')
        .select('*');
      
      if (hotel) {
        query = query.ilike('hotel_chain', `%${hotel}%`);
      }
      
      if (location) {
        query = query.ilike('country_scope', `%${location}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching hotel pet policies:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching hotel pet policies:', error);
      return [];
    }
  }
  
  // Function to get pet-friendly activities
  async getPetFriendlyActivities(location: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('activities')
        .select('*')
        .ilike('location', `%${location}%`);
      
      if (error) {
        console.error('Error fetching pet-friendly activities:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching pet-friendly activities:', error);
      return [];
    }
  }
  
  // Helper function to save conversation to Supabase
  private async saveConversation(
    userId: string, 
    messages: Message[], 
    assistantResponse: string,
    tripId?: string
  ): Promise<void> {
    try {
      // Add the assistant response to the messages
      const updatedMessages = [
        ...messages,
        { role: 'assistant', content: assistantResponse }
      ];
      
      // Check if there's an existing conversation
      const { data: existingConversations, error: fetchError } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError) {
        console.error('Error fetching existing conversations:', fetchError);
        return;
      }
      
      if (existingConversations && existingConversations.length > 0) {
        // Update existing conversation
        const { error } = await this.supabase
          .from('conversations')
          .update({
            history_json: updatedMessages,
            trip_id: tripId
          })
          .eq('id', existingConversations[0].id);
        
        if (error) {
          console.error('Error updating conversation:', error);
        }
      } else {
        // Create new conversation
        const { error } = await this.supabase
          .from('conversations')
          .insert({
            user_id: userId,
            history_json: updatedMessages,
            trip_id: tripId
          });
        
        if (error) {
          console.error('Error creating conversation:', error);
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }
  
  // Helper function to create a system message with trip context
  private createTripContextMessage(trip: Trip): string {
    return `
You are a helpful AI assistant for Wags & Wanders, a pet travel platform. You are currently helping with a trip to ${trip.destination} 
from ${trip.startDate instanceof Date ? trip.startDate.toLocaleDateString() : trip.startDate} 
to ${trip.endDate instanceof Date ? trip.endDate.toLocaleDateString() : trip.endDate}.

Trip Details:
- Destination: ${trip.destination}
- Pet Type: ${trip.petDetails.type}
- Pet Size: ${trip.petDetails.size}
${trip.petDetails.breed ? `- Pet Breed: ${trip.petDetails.breed}` : ''}
${trip.petDetails.health ? `- Pet Health Considerations: ${trip.petDetails.health}` : ''}

Your role is to:
1. Answer questions about pet travel requirements and regulations
2. Suggest pet-friendly activities, accommodations, and restaurants
3. Help with trip planning and itinerary adjustments
4. Provide information about pet care, health, and emergency services at the destination
5. Offer tips for traveling with pets

Keep responses concise, helpful, and focused on making pet travel easier and more enjoyable.
`;
  }
  
  // Helper function to create a cache key
  private createCacheKey(request: ChatRequest): string {
    // Use only the last 5 messages to create the cache key (for practical limits)
    const messages = request.messages.slice(-5);
    const tripId = request.tripData?.id || 'no-trip';
    
    return `${tripId}-${JSON.stringify(messages)}`;
  }
  
  // Helper function to extract suggested actions from response
  private extractSuggestedActions(content: string): SuggestedAction[] | undefined {
    const actions: SuggestedAction[] = [];
    
    // Check for suggestions in the response using regex patterns
    
    // Activity suggestions
    const activityMatch = content.match(/would you like to add this (activity|park|beach|museum|tour|attraction).*?to your itinerary/i);
    if (activityMatch) {
      actions.push({
        type: 'add_activity',
        label: 'Add Activity'
      });
    }
    
    // Hotel suggestions
    const hotelMatch = content.match(/would you like to add this (hotel|accommodation|lodging|place to stay)/i);
    if (hotelMatch) {
      actions.push({
        type: 'add_hotel',
        label: 'Add Hotel'
      });
    }
    
    // Restaurant suggestions
    const restaurantMatch = content.match(/would you like to add this (restaurant|cafe|diner|eatery)/i);
    if (restaurantMatch) {
      actions.push({
        type: 'add_restaurant',
        label: 'Add Restaurant'
      });
    }
    
    // Vet suggestions
    const vetMatch = content.match(/would you like to add this (vet|veterinarian|animal hospital|pet clinic)/i);
    if (vetMatch) {
      actions.push({
        type: 'add_vet',
        label: 'Add Vet'
      });
    }
    
    return actions.length > 0 ? actions : undefined;
  }
}

export const aiService = new AIService(); 