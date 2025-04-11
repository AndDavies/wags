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
      
      // Add AI message
      setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      
      // Handle suggested activities, hotels, restaurants if provided
      if (response.suggestions) {
        response.suggestions.forEach(suggestion => {
          if (suggestion.type === 'activity') {
            onAddActivity(suggestion);
          } else if (suggestion.type === 'hotel' || suggestion.type === 'accommodation') {
            onAddHotel(suggestion);
          } else if (suggestion.type === 'restaurant') {
            onAddRestaurant(suggestion);
          }
        });
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