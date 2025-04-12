'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon, PlusCircle, Loader2, ArrowDown } from 'lucide-react';
import { aiService, type Message, type SuggestedAction } from '@/lib/ai-service';
import { Trip, TripActivity } from '@/lib/trip-service';

type TripChatbotProps = {
  trip: Trip;
  onAddActivity: (activity: Omit<TripActivity, 'id'>) => void;
  onAddHotel: (hotel: Omit<TripActivity, 'id'>) => void;
  onAddRestaurant: (restaurant: Omit<TripActivity, 'id'>) => void;
  className?: string;
};

type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// Add custom ChatResponse type for our component
interface ChatResponse {
  message: Message;
  text?: string;
  suggestions?: SuggestedActivity[];
  suggestedActions?: SuggestedAction[];
}

interface SuggestedActivity {
  type: 'activity' | 'hotel' | 'restaurant';
  title: string;
  description: string;
  location?: string;
  isPetFriendly: boolean;
  startTime?: string;
  endTime?: string;
}

export function TripChatbot({ 
  trip, 
  onAddActivity, 
  onAddHotel,
  onAddRestaurant,
  className = ''
}: TripChatbotProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your travel assistant for your trip to ${trip.destination}. How can I help with your pet-friendly travel plans?`
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSuggestedActions([]);
    
    try {
      // Get AI response
      const response = await aiService.chat({
        messages: [...messages, userMessage],
        tripData: trip || undefined
      });
      
      // Extract text from response.message
      const responseText = response.message.content;
      
      // Add AI message
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      // Extract suggestions from the response text
      const extractedSuggestions = extractSuggestedActivities(responseText);
      
      // Handle suggested activities, hotels, restaurants if provided
      if (extractedSuggestions.length > 0) {
        extractedSuggestions.forEach((suggestion: SuggestedActivity) => {
          if (suggestion.type === 'activity') {
            onAddActivity(suggestion);
          } else if (suggestion.type === 'hotel') {
            onAddHotel(suggestion);
          } else if (suggestion.type === 'restaurant') {
            onAddRestaurant(suggestion);
          }
        });
      }
      
      // Set suggested actions from response
      if (response.suggestedActions) {
        setSuggestedActions(response.suggestedActions);
      }
    } catch (error) {
      const err = error as Error;
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `Sorry, I encountered an error: ${err.message}. Please try again.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const handleSuggestedAction = (action: SuggestedAction) => {
    // Extract details from the last assistant message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;
    
    const content = lastMessage.content;
    
    // Based on action type, call the appropriate handler
    switch (action.type) {
      case 'add_activity':
        if (onAddActivity) {
          onAddActivity({
            type: 'activity',
            title: extractEntityName(content, ['activity', 'park', 'beach', 'museum', 'tour', 'attraction']),
            description: extractDescription(content),
            location: extractLocation(content),
            isPetFriendly: true
          });
          
          // Add confirmation message
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'Great! I\'ve added that activity to your itinerary.'
            }
          ]);
        }
        break;
        
      case 'add_hotel':
        if (onAddHotel) {
          onAddHotel({
            type: 'hotel',
            title: extractEntityName(content, ['hotel', 'accommodation', 'lodging', 'place to stay']),
            description: extractDescription(content),
            location: extractLocation(content),
            isPetFriendly: true
          });
          
          // Add confirmation message
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'Perfect! I\'ve added that hotel to your itinerary.'
            }
          ]);
        }
        break;
        
      case 'add_restaurant':
        if (onAddRestaurant) {
          onAddRestaurant({
            type: 'restaurant',
            title: extractEntityName(content, ['restaurant', 'cafe', 'diner', 'eatery']),
            description: extractDescription(content),
            location: extractLocation(content),
            isPetFriendly: true
          });
          
          // Add confirmation message
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: 'Excellent! I\'ve added that restaurant to your itinerary.'
            }
          ]);
        }
        break;
        
      default:
        break;
    }
    
    // Clear suggested actions after handling
    setSuggestedActions([]);
  };
  
  // Helper functions to extract information from message content
  const extractEntityName = (content: string, entityTypes: string[]): string => {
    // Try to find name patterns like "XYZ [entity type]" or "the [entity type] called XYZ"
    for (const type of entityTypes) {
      const patterns = [
        new RegExp(`(?:the\\s+)?([\\w\\s'&-]+)\\s+${type}`, 'i'),
        new RegExp(`(?:the\\s+)?${type}\\s+(?:called|named)\\s+([\\w\\s'&-]+)`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    // Fallback: use the first sentence as name
    const firstSentence = content.split('.')[0];
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 50) + '...' 
      : firstSentence;
  };
  
  const extractDescription = (content: string): string => {
    // Find sentences that describe the place
    const sentences = content.split('.');
    
    // Look for descriptive sentences (typically the 2nd or 3rd sentence)
    if (sentences.length > 1) {
      const descriptionSentences = sentences.slice(1, 3).join('. ');
      return descriptionSentences.length > 100 
        ? descriptionSentences.substring(0, 100) + '...' 
        : descriptionSentences;
    }
    
    return '';
  };
  
  const extractLocation = (content: string): string => {
    // Try to find a location mentioned in the content
    const locationPattern = /(?:located|situated|found)\s+(?:in|at|on|near)\s+([^.]+)/i;
    const match = content.match(locationPattern);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // If no location found and we have trip data, use the trip destination
    return trip ? trip.destination : '';
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Add the function to extract time from the AI response
  const extractTimeFromActivity = (activityText: string): { startTime?: string; endTime?: string } => {
    // Look for time patterns like "9:00 AM - 11:00 AM" or "2PM - 4:30PM" 
    const timePattern = /(\d{1,2}(?::\d{2})?(?:\s*[AP]M)?)\s*(?:-|to)\s*(\d{1,2}(?::\d{2})?(?:\s*[AP]M)?)/i;
    const match = activityText.match(timePattern);
    
    if (match && match.length >= 3) {
      // Convert to 24-hour format for HTML time input
      const formatTimeTo24 = (timeStr: string): string => {
        let [time, modifier] = timeStr.split(/(?=[AP]M)/i);
        if (!modifier) {
          // If no AM/PM specified, assume based on hour
          const hour = parseInt(time.split(':')[0], 10);
          modifier = hour < 8 || hour === 12 ? 'PM' : 'AM';
        }
        
        let [hours, minutes = '00'] = time.replace(/[^\d:]/g, '').split(':');
        let hoursNum = parseInt(hours, 10);
        
        if (modifier.toUpperCase() === 'PM' && hoursNum < 12) {
          hoursNum += 12;
        } else if (modifier.toUpperCase() === 'AM' && hoursNum === 12) {
          hoursNum = 0;
        }
        
        return `${hoursNum.toString().padStart(2, '0')}:${minutes.padEnd(2, '0')}`;
      };
      
      try {
        return {
          startTime: formatTimeTo24(match[1]),
          endTime: formatTimeTo24(match[2])
        };
      } catch (e) {
        console.error('Error parsing activity time:', e);
        return {};
      }
    }
    
    return {};
  };
  
  // Then update where you extract activities
  const extractSuggestedActivities = (text: string): SuggestedActivity[] => {
    const suggestions: SuggestedActivity[] = [];
    
    // Look for activity suggestions in a few formats
    const patterns = [
      /I suggest (.*?)(?:\n|$)/gi,
      /You could visit (.*?)(?:\n|$)/gi,
      /Try (.*?)(?:\n|$)/gi,
      /How about (.*?)(?:\n|$)/gi,
      /Consider (.*?)(?:\n|$)/gi,
      // Add more patterns as needed
    ];
    
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const activityText = match[1].trim();
          const { startTime, endTime } = extractTimeFromActivity(activityText);
          
          // Determine the type based on keywords
          const lowerText = activityText.toLowerCase();
          let type: SuggestedActivity['type'] = 'activity';
          
          if (lowerText.includes('hotel') || lowerText.includes('stay') || lowerText.includes('accommodation')) {
            type = 'hotel';
          } else if (lowerText.includes('restaurant') || lowerText.includes('eat') || lowerText.includes('dining') || lowerText.includes('cafe')) {
            type = 'restaurant';
          }
          
          // Extract location if present (anything after "at" or "in")
          let location = undefined;
          const locationMatch = activityText.match(/(?:at|in)\s+(.+?)(?:\.|\(|$)/i);
          if (locationMatch && locationMatch[1]) {
            location = locationMatch[1].trim();
          }
          
          // Basic description extraction
          let title = activityText;
          let description = '';
          
          if (activityText.includes(':')) {
            [title, description] = activityText.split(':', 2).map(s => s.trim());
          } else if (activityText.includes('-')) {
            [title, description] = activityText.split('-', 2).map(s => s.trim());
          } else if (activityText.includes('(')) {
            title = activityText.split('(')[0].trim();
            description = activityText.match(/\((.*?)\)/)?.[1] || '';
          }
          
          // Limit title length
          if (title.length > 50) {
            description = description ? title.substring(50) + ' - ' + description : title.substring(50);
            title = title.substring(0, 50) + '...';
          }
          
          suggestions.push({
            type,
            title,
            description,
            location,
            isPetFriendly: true, // Assume pet-friendly by default for the assistant's suggestions
            startTime,
            endTime
          });
        }
      }
    });
    
    return suggestions;
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-auto p-4 bg-gray-50 rounded-lg mb-2">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 ${
              message.role === 'user' 
                ? 'text-right' 
                : 'text-left'
            }`}
          >
            <div 
              className={`inline-block p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white border border-gray-200 rounded-tl-none'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {messages.length > 3 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-20 right-5 rounded-full p-2 bg-white shadow"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about pet-friendly activities..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </form>
      
      {suggestedActions.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Suggested actions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant="outline"
                onClick={() => handleSuggestedAction(action)}
                className="text-primary border-primary/50 hover:bg-primary/10"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add default export
export default TripChatbot; 