'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendIcon, PlusCircle, Loader2 } from 'lucide-react';
import { aiService, type Message, type SuggestedAction } from '@/lib/ai-service';
import { Trip } from '@/lib/trip-service';

interface TripChatbotProps {
  trip: Trip | null;
  onAddActivity?: (activity: any) => void;
  onAddHotel?: (hotel: any) => void;
  onAddRestaurant?: (restaurant: any) => void;
  className?: string;
}

export function TripChatbot({ 
  trip, 
  onAddActivity, 
  onAddHotel,
  onAddRestaurant,
  className = ''
}: TripChatbotProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: trip 
        ? `Hi there! I can help you plan your pet-friendly trip to ${trip.destination}. What would you like to know?` 
        : 'Hi there! I can help you plan a pet-friendly trip. How can I assist you today?'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: input
    };
    
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
      
      // Add assistant message to chat
      setMessages(prev => [...prev, response.message]);
      
      // Set suggested actions if any
      if (response.suggestedActions && response.suggestedActions.length > 0) {
        setSuggestedActions(response.suggestedActions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again later.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded-lg p-3 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-offwhite text-foreground'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg p-3 bg-offwhite">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>
      
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
      
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something about your trip..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Add default export
export default TripChatbot; 