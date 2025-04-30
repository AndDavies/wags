'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Send, AlertTriangle, Sparkles } from 'lucide-react';
import { useTripStore, TripData } from '@/store/tripStore';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Use Textarea for potentially longer input

interface ChatBuilderProps {
  // session might be needed later for auth-related actions
  session?: any | null; 
  className?: string;
  // Add prop to handle the generation trigger
  onInitiateItineraryGeneration: () => Promise<void>; 
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Placeholder for API response structure (will evolve)
interface BuilderApiResponse {
    reply: string | null;
    updatedTripData?: Partial<TripData>; // Backend can send back updates
    // Actions might be needed later, similar to Chatbot
    actions?: any[]; 
    threadId?: string; // Maintain conversation context if needed
    // Add the trigger flag to the expected response type
    triggerItineraryGeneration?: boolean; 
}

/**
 * ChatBuilder Component
 * Provides a conversational interface for users to build their pet-friendly trip itinerary.
 * Guides the user through steps like destination, dates, pet details, and preferences.
 * @param {object} props - Component props.
 * @param {any} props.session - Optional user session data.
 * @param {string} props.className - Optional Tailwind CSS classes for styling.
 * @param {() => Promise<void>} props.onInitiateItineraryGeneration - Callback to trigger itinerary generation.
 * @returns {JSX.Element} The rendered ChatBuilder component.
 */
export default function ChatBuilder({ session, className, onInitiateItineraryGeneration }: ChatBuilderProps) {
  // --- State Hooks ---
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
      {
          role: 'assistant',
          // Initial prompt based on the wireframe
          content: "Hey there, where would you like to go? I'm here to assist you in planning your experience. Ask me anything travel related, or tell me where you'd like to plan a trip!"
      }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // --- Zustand Store Hook ---
  // Select state values needed for rendering/disabling UI
  const isStoreLoading = useTripStore((state) => state.isLoading);
  // Remove tripData selection here if read via getState() in callback
  // const tripData = useTripStore((state) => state.tripData);
  // Actions are accessed directly inside callbacks
  const setTripData = useTripStore((state) => state.setTripData);
  const setError = useTripStore((state) => state.setError);
  const setIsStoreLoading = useTripStore((state) => state.setIsLoading);

  // --- Effects ---
  // Scroll to bottom effect
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [messages]);

  // Effect to initialize tripData in the store if it's null 
  // (ensures we always have an object to work with)
  useEffect(() => {
    // Read state directly only for initialization check
    if (useTripStore.getState().tripData === null) {
      console.log('[ChatBuilder] Initializing tripData in store.')
      setTripData({}); 
    }
  }, [setTripData]); // Depend only on the stable setter

  // --- Event Handlers ---
  // Wrap handleSend in useCallback
  const handleSend = useCallback(async () => {
    const currentInput = input.trim(); // Read input directly
    // Prevent sending if API call or store loading is in progress
    if (!currentInput || isLoadingApi || isStoreLoading) return; 

    const userMessage: ChatMessage = { role: 'user', content: currentInput };
    // Use functional update for messages to avoid needing messages in deps
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsLoadingApi(true); // Start API loading state
    setError(null);

    const currentTripData = useTripStore.getState().tripData; // Read latest state here

    try {
      console.log(`[ChatBuilder] Sending message to API. Thread ID: ${currentThreadId}`);
      const response = await fetch('/api/chat-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageContent: currentInput,
          threadId: currentThreadId,
          currentTripData: currentTripData // Send latest data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const result: BuilderApiResponse = await response.json();
      const { reply, updatedTripData, threadId, actions, triggerItineraryGeneration } = result;

      if (threadId) {
        console.log(`[ChatBuilder] Received thread ID: ${threadId}`);
        setCurrentThreadId(threadId);
      }

      if (updatedTripData) {
        console.log('[ChatBuilder] Received tripData updates:', updatedTripData);
        // Revert to direct update using the state read at the start of the callback
        setTripData({ ...(currentTripData || {}), ...updatedTripData });
      }

      if (reply) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: reply };
        // Use functional update for messages
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
      } else {
        console.log('[ChatBuilder] No text reply received from assistant.');
        // If no reply but data updated, maybe add a generic confirmation? (Optional)
      }

      if (triggerItineraryGeneration) {
        console.log('[ChatBuilder] Received triggerItineraryGeneration flag.');
        setIsStoreLoading(true); // Set store loading state
        await onInitiateItineraryGeneration();
        // Loading state will be turned off by the parent/store itself
      }
      
      if (actions && actions.length > 0) {
        console.warn('[ChatBuilder] Received actions, but handling is not implemented yet:', actions);
        // Future implementation: Loop through actions and trigger UI changes or store updates
      }

    } catch (error: any) {
      console.error('[ChatBuilder] Error processing message:', error);
      const errorContent = `Sorry, I encountered an error processing your request. Please try again. (${error.message})`;
      setError(error.message);
      const errorMessage: ChatMessage = { role: 'assistant', content: errorContent };
      // Use functional update
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoadingApi(false); // End API loading state
    }
  }, [input, isLoadingApi, isStoreLoading, currentThreadId, setError, setTripData, setIsStoreLoading, onInitiateItineraryGeneration]);

  // --- JSX ---
  return (
    // Mimicking Mindtrip layout: white background, flex column, full height
    <div className={cn("bg-white flex flex-col h-full font-sans", className)}>
      {/* Header Section (Mimicking Mindtrip Style) */}
      <div className="p-4 flex-shrink-0">
        <h1 className="text-4xl font-bold text-black tracking-tight font-inter">Where to today?</h1>
        <div className="flex items-start mt-3 text-gray-700">
          <Sparkles className="h-6 w-6 mr-2 mt-0.5 text-black flex-shrink-0" />
          <p className="text-base leading-relaxed">
            {/* Display the latest assistant message or the initial prompt */} 
            {messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || 
             "Hey there, where would you like to go? I'm here to assist you in planning your experience."}
          </p>
        </div>
      </div>
      
      {/* Messages Area - takes remaining space */}
      <div className="flex-grow overflow-y-auto px-4 space-y-3 mb-2">
        {/* Skip rendering the very first assistant message again here */} 
        {messages.slice(1).map((msg, index) => {
           const isError = msg.role === 'assistant' && msg.content.includes('Sorry, I encountered an error');
           return (
             <div
               // Start key from 1 because we slice the first message
               key={index + 1} 
               className={cn(
                 "p-3 rounded-lg max-w-[85%] text-sm leading-relaxed shadow-sm",
                 msg.role === 'user'
                   ? 'bg-teal-500 text-white ml-auto rounded-br-none'
                   : 'bg-gray-100 text-gray-800 mr-auto rounded-bl-none',
                 isError && 'bg-red-50 border border-red-200 text-red-800'
               )}
             >
               {isError && <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5 text-red-600" />}
               {/* Use prose for markdown styling */} 
               <div className="prose prose-sm max-w-none prose-p:my-1 prose-a:text-teal-600 hover:prose-a:text-teal-700">
                 <ReactMarkdown
                   components={{ a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
                 >
                   {msg.content}
                 </ReactMarkdown>
               </div>
             </div>
           );
        })}
        {/* Display loading indicator if API call OR itinerary generation is happening */}
        {(isLoadingApi || isStoreLoading) && (
          <div className="flex items-center justify-start p-2">
            <Loader2 className="h-4 w-4 text-teal-600 animate-spin mr-2" />
            <span className="text-xs text-gray-500 italic">
              {isStoreLoading ? 'Generating your itinerary...' : 'Baggo is thinking...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - fixed at the bottom */} 
      <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
        {/* Mimicking Mindtrip input style */} 
        <div className="relative flex items-center border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 overflow-hidden">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 p-3 pr-12 border-0 focus:ring-0 resize-none text-sm bg-transparent min-h-[40px] max-h-[120px]"
              placeholder="Ask anything..."
              rows={1} // Start with 1 row, automatically adjusts
              // Disable input during API call OR itinerary generation
              disabled={isLoadingApi || isStoreLoading}
            />
            <Button
                onClick={handleSend}
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-teal-600 disabled:opacity-50 h-8 w-8"
                // Disable button during API call OR itinerary generation
                disabled={isLoadingApi || isStoreLoading || !input.trim()}
                aria-label="Send message"
             >
                {(isLoadingApi || isStoreLoading) ? (
                 <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                 <Send className="h-5 w-5" />
                )}
            </Button>
        </div>
        {/* Optional: Add the "Mindtrip can make mistakes" note */}
        <p className="text-xs text-center text-gray-400 mt-2">
             Baggo is learning! Please double-check important information.
        </p>
      </div>
    </div>
  );
}
