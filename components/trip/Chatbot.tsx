'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, X } from 'lucide-react';
import { useTripStore, Activity } from '@/store/tripStore'; // Import store and Activity type
import ReactMarkdown from 'react-markdown'; // Import react-markdown
import { cn } from '@/lib/utils'; // Import cn utility

interface ChatbotProps {
  tripData: any;
  onClose: () => void;
  session: any | null;
  onTriggerSave?: () => Promise<void>;
  className?: string; // <-- Add className prop
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Structure expected in the API response's 'actions' array
interface FrontendAction {
    action: string; // e.g., 'add_activity_to_day', 'save_trip', 'get_trip_details'
    payload: any; // Data needed for the action (e.g., day number, activity details)
}

export default function Chatbot({ tripData, onClose, session, onTriggerSave, className }: ChatbotProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get actions from the Zustand store
  const addActivity = useTripStore((state) => state.addActivity);
  // Assume a saveTrip function exists or will be added to the store/component context
  // const saveTrip = useTripStore((state) => state.saveTrip); // Example if saveTrip is in store
  const triggerSave = () => {
      console.log('[Chatbot] Action received: save_trip. Calling onTriggerSave prop.');
      if (onTriggerSave) {
          onTriggerSave(); // Call the function passed down from ItineraryView
      } else {
          console.error('[Chatbot] onTriggerSave prop is missing!');
          // Optionally show an error message to the user in the chat
          setMessages(prev => [...prev, {role: 'assistant', content: 'Sorry, I couldn\'t save the trip right now. Please use the save button.'}]);
      }
  };

  useEffect(() => {
    if (session) {
      console.log('[Chatbot] Ready to potentially fetch conversation history (not implemented yet)');
    } else {
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const newMessages: ChatMessage[] = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let finalMessages = newMessages; // Keep track of messages for error display

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          tripData: tripData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      // Expect { reply: string | null, actions: FrontendAction[] }
      const result: { reply: string | null; actions?: FrontendAction[] } = await response.json();
      const { reply, actions } = result;

      // Add the assistant's text reply if it exists
      if (reply) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: reply };
        finalMessages = [...newMessages, assistantMessage]; // Update finalMessages to include reply
        setMessages(finalMessages);
      } else {
          finalMessages = newMessages; // No reply, keep messages as they were before assistant response
      }

      // Process actions requested by the backend
      if (actions && actions.length > 0) {
        console.log('[Chatbot] Processing actions:', actions);
        actions.forEach(action => {
          switch (action.action) {
            case 'add_activity_to_day':
              const { day_number, activity } = action.payload;
              // TODO: Validate payload structure and types more robustly
              if (typeof day_number === 'number' && activity && typeof activity.name === 'string') {
                  console.log(`[Chatbot] Executing action: addActivity for Day ${day_number}`, activity);
                  // Map API payload to the structure expected by addActivity store action
                  const newActivity: Activity = {
                       place_id: activity.place_id || undefined, // Map fields if names differ
                       name: activity.name,
                       description: activity.description || '',
                       petFriendly: activity.pet_friendly_status === 'yes',
                       location: activity.location || 'Unknown Location',
                       coordinates: activity.coordinates || { lat: 0, lng: 0 }, // Need coordinates if available
                       type: activity.type || 'activity', // Default type
                       startTime: activity.start_time,
                       endTime: activity.end_time,
                       cost: activity.cost,
                       website: activity.website,
                       phone_number: activity.phone_number,
                       opening_hours: activity.opening_hours,
                       photo_references: activity.photo_references || [], // Ensure it's an array
                       booking_link: activity.booking_link,
                       pet_friendliness_details: activity.pet_friendliness_details,
                       estimated_duration: activity.duration_minutes,
                       rating: activity.rating,
                       user_ratings_total: activity.user_ratings_total
                  };
                  addActivity(day_number, newActivity);
              } else {
                  console.error('[Chatbot] Invalid payload for add_activity_to_day:', action.payload);
              }
              break;
            case 'save_trip_progress':
              triggerSave(); // Call the updated save function
              break;
            case 'get_trip_details':
               console.log('[Chatbot] Action requested: get_trip_details. Frontend should provide details in next message turn (implementation TBD).');
               // For now, we just log. The AI should ideally use the tripData passed initially.
               // If needed, we could trigger sending a specific message back containing tripData.
               break;
            default:
              console.warn(`[Chatbot] Received unknown action: ${action.action}`);
          }
        });
      }

    } catch (error: any) {
      console.error('[Chatbot] Error processing message:', error);
      const errorMessage: ChatMessage = {
           role: 'assistant',
           content: `Sorry, I encountered an error: ${error.message}. Please try again.`
       };
       // Use finalMessages which might include the user's message even if API failed early
      setMessages([
        ...finalMessages,
        errorMessage
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("bg-white rounded-lg p-4 shadow-sm border border-gray-200 flex flex-col h-full", className)}>
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-teal-700 font-bold text-lg">Baggo - Travel Assistant 🐾</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto mb-3 pr-2 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2.5 rounded-lg max-w-[85%] ${
              msg.role === 'user'
                ? 'bg-teal-500 text-white ml-auto rounded-br-none'
                : 'bg-gray-100 text-gray-800 mr-auto rounded-bl-none'
            }`}
          >
            <div className="text-sm tracking-tight prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-a:text-teal-600 hover:prose-a:text-teal-700">
              <ReactMarkdown
                components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                }}
              >
                {msg.content}
               </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-start p-3">
            <Loader2 className="h-5 w-5 text-teal-600 animate-spin mr-2" />
            <span className="text-sm text-gray-500 italic">Baggo is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 border-t border-gray-200 pt-3 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
          placeholder="Ask Baggo about your trip..."
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
}