'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Loader2, Send, AlertTriangle, Sparkles } from 'lucide-react';
import { useTripStore, TripData } from '@/store/tripStore';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Use Textarea for potentially longer input
import { useToast } from "@/hooks/use-toast";

interface ChatBuilderProps {
  // session might be needed later for auth-related actions
  session?: any | null; 
  className?: string;
  onActualItineraryGenerationRequested: () => Promise<void>; // Renamed prop
}

interface ChatMessage {
    role: 'user' | 'assistant' | 'system'; // Add 'system' role for internal triggering
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

// Default welcome message
const defaultWelcomeMessage: ChatMessage = {
    role: 'assistant',
    content: "Hello! I'm Baggo, your pet travel assistant. Where are you thinking of going with your furry friend?"
};

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
const ChatBuilder = forwardRef<{
  sendSystemMessage: (message: string) => void;
}, ChatBuilderProps>(({ session, className, onActualItineraryGenerationRequested }, ref) => {
  // --- State Hooks ---
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Initialize messages with the static welcome message.
  const [messages, setMessages] = useState<ChatMessage[]>([defaultWelcomeMessage]); 
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Initialize threadId from sessionStorage or null
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null); // Initial value set in useEffect

  // Ref to track previous state for detecting example load
  const previousAdditionalInfoRef = useRef<string | undefined>(undefined);
  const previousDestinationRef = useRef<string | undefined>(undefined); // NEW Ref for destination

  // --- Zustand Store Hook ---
  // Select state values needed for rendering/disabling UI
  const isStoreLoading = useTripStore((state) => state.isLoading);
  // Select specific fields needed for the effect dependencies
  const tripData = useTripStore((state) => state.tripData);
  const additionalInfo = tripData?.additionalInfo;
  const destination = tripData?.destination;
  const startDate = tripData?.startDate;
  const endDate = tripData?.endDate;
  const pets = tripData?.pets;
  const interests = tripData?.interests;

  // Actions are accessed directly inside callbacks
  const setTripData = useTripStore((state) => state.setTripData);
  const setError = useTripStore((state) => state.setError);
  const setIsStoreLoading = useTripStore((state) => state.setIsLoading);

  // NEW: Initialize useToast
  const { toast } = useToast();

  // Effect to set hasMounted to true after initial client render
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Effect to LOAD state from sessionStorage AFTER mount and INITIATE conversation if needed
  useEffect(() => {
    if (hasMounted) { // Only run on client after mount
      const storedMessages = sessionStorage.getItem('chatBuilderMessages');
      const storedThreadId = sessionStorage.getItem('chatBuilderThreadId');
      let loadedMessages: ChatMessage[] = [];

      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          // Load stored messages ONLY if they exist and are not just the default welcome
          if (Array.isArray(parsedMessages) && parsedMessages.length > 1) { 
            loadedMessages = parsedMessages;
            setMessages(loadedMessages);
            console.log("[ChatBuilder] Loaded messages from session storage.");
          } else if (parsedMessages.length === 1 && JSON.stringify(parsedMessages[0]) !== JSON.stringify(defaultWelcomeMessage)) {
             // Handle edge case: storage has only one message, but it's not the default
             loadedMessages = parsedMessages;
             setMessages(loadedMessages);
             console.log("[ChatBuilder] Loaded single non-default message from session storage.");
          } else {
            // If storage only contains the default message or is empty/invalid, keep the default
            setMessages([defaultWelcomeMessage]);
            console.log("[ChatBuilder] Session storage empty or contained only default message. Starting fresh.");
          }
        } catch (e) {
          console.error('[ChatBuilder] Failed to parse stored messages on mount:', e);
          sessionStorage.removeItem('chatBuilderMessages'); // Clear corrupted data
          setMessages([defaultWelcomeMessage]); // Reset to default
        }
      }

      if (storedThreadId) {
          setCurrentThreadId(storedThreadId);
          console.log(`[ChatBuilder] Loaded thread ID ${storedThreadId} from session storage.`);
      } 
    }
  // Depend only on hasMounted to run once after mount
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [hasMounted]); 

  // Effect to SAVE messages and threadId to sessionStorage whenever they change
  useEffect(() => {
    if (hasMounted) { // Only run on client and after initial load from storage is complete
      try {
        sessionStorage.setItem('chatBuilderMessages', JSON.stringify(messages));
      } catch (e) {
        console.error('[ChatBuilder] Failed to save messages to sessionStorage:', e);
      }
      if (currentThreadId) {
        sessionStorage.setItem('chatBuilderThreadId', currentThreadId);
      } else {
        sessionStorage.removeItem('chatBuilderThreadId');
      }
    }
  }, [messages, currentThreadId, hasMounted]); // Re-run when messages, threadId, or hasMounted change

  // --- Internal Send Function --- (Refactored for reuse)
  const sendMessage = useCallback(async (messageContent: string, isSystemMessage: boolean = false) => {
    // Prevent sending if API call or store loading is in progress
    if (isLoadingApi || isStoreLoading) return;

    // Don't add system messages to the visible chat history
    if (!isSystemMessage) {
        const userMessage: ChatMessage = { role: 'user', content: messageContent };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInput(''); // Clear input only for user messages
    }

    setIsLoadingApi(true); // Start API loading state
    setError(null);

    const currentTripData = useTripStore.getState().tripData; // Read latest state here

    try {
      console.log(`[ChatBuilder] Sending ${isSystemMessage ? 'SYSTEM' : 'USER'} message to API. Thread ID: ${currentThreadId}`);
      const response = await fetch('/api/chat-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageContent: messageContent, // Use the provided content
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
        // Use functional update for store if reading state inside callback is problematic
        setTripData({ ...(useTripStore.getState().tripData || {}), ...updatedTripData }); // Read fresh state for update
      }

      if (reply) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: reply };
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
      } else if (!isSystemMessage) {
        // Only log lack of reply for non-system messages
        console.log('[ChatBuilder] No text reply received from assistant for user message.');
      }

      if (triggerItineraryGeneration) {
        console.log('[ChatBuilder] Received triggerItineraryGeneration flag.');
        setIsStoreLoading(true); // Set store loading state
        await onActualItineraryGenerationRequested(); // Call the renamed prop
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
      setMessages(prevMessages => [...prevMessages, errorMessage]);
      toast({ 
        title: "Chat Error", 
        description: `Could not process your message: ${error.message}`,
        variant: "destructive" 
      });
    } finally {
      setIsLoadingApi(false); // End API loading state
    }
  }, [isLoadingApi, isStoreLoading, currentThreadId, setError, setTripData, setIsStoreLoading, onActualItineraryGenerationRequested, toast]);

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

  // *** NEW Effect to Detect Example Trip Load and Send System Message ***
  useEffect(() => {
    const currentAdditionalInfo = additionalInfo;
    const currentDestination = destination; // Use selected state variable
    const previousInfo = previousAdditionalInfoRef.current;
    const previousDest = previousDestinationRef.current; // Get previous destination

    // Check if flag is present AND destination has changed since last time flag was detected
    if (currentAdditionalInfo === 'SYSTEM_FLAG: Example trip loaded.' && currentDestination !== previousDest) {
        console.log('[ChatBuilder] Detected example trip load via flag and destination change.');

        // Use the selected state variables directly in the check and message
        if (currentDestination && startDate && endDate && pets !== undefined && interests) {
          const interestsString = Array.isArray(interests) ? interests.join(', ') : 'None';
          const systemMessageContent = `SYSTEM_UPDATE: Example trip selected: ${currentDestination} (${startDate} to ${endDate}) with ${pets} pet(s). Interests: ${interestsString || 'None'}.`;
          sendMessage(systemMessageContent, true);
        } else {
            console.warn('[ChatBuilder] Detected example load flag, but required data (destination, dates, pets, interests) is missing in the store. Cannot send system update.');
        }
    }

    // Update the refs AFTER the check
    previousAdditionalInfoRef.current = currentAdditionalInfo;
    previousDestinationRef.current = currentDestination; // Update previous destination

  // Correct dependency array using ONLY the selected state variables from the store hook and stable functions
  }, [additionalInfo, destination, startDate, endDate, pets, interests, sendMessage]);

  // Expose sendSystemMessage via ref
  useImperativeHandle(ref, () => ({
    sendSystemMessage: (message: string) => {
      console.log('[ChatBuilder] sendSystemMessage called via ref:', message);
      sendMessage(message, true); // Call internal sendMessage with isSystemMessage = true
    }
  }));

  // --- Event Handlers ---
  // Wrap handleSend in useCallback
  const handleSend = useCallback(async () => {
    const currentInput = input.trim(); // Read input directly
    // Prevent sending if API call or store loading is in progress
    if (!currentInput || isLoadingApi || isStoreLoading) return; 

    // Clear input immediately for better UX
    setInput(''); 

    // Call the central sendMessage function instead of duplicating logic
    await sendMessage(currentInput, false);

    /* Removed duplicated API call and state logic:
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
        await onActualItineraryGenerationRequested(); // Call the renamed prop
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
      // NEW: Show toast notification for the error
      toast({ 
        title: "Chat Error", 
        description: `Could not process your message: ${error.message}`,
        variant: "destructive" 
      });
    } finally {
      setIsLoadingApi(false); // End API loading state
    }
    */
  // Simplified dependencies: only depends on input, loading states, and sendMessage
  }, [input, isLoadingApi, isStoreLoading, sendMessage]); 

  // --- JSX ---
  return (
    // Mimicking Mindtrip layout: white background, flex column, full height
    <div className={cn("bg-white flex flex-col h-full font-sans", className)}>
      {/* Header Section (Mimicking Mindtrip Style) */}
      <div className="p-4 flex-shrink-0">
        <h1 className="text-4xl font-bold text-black tracking-tight font-inter">Where to today?</h1>
      </div>
      
      {/* Messages Area - takes remaining space */}
      <div className="flex-grow overflow-y-auto px-4 space-y-3 mb-2">
        {/* Conditionally render messages based on hasMounted to prevent hydration mismatch */}
        {/* The .slice(1) might be an issue if the initial message from storage IS the default. */}
        {/* Let's render all messages if hasMounted, and handle the default message logic carefully. */}
        {/* If messages are loaded from storage, the default greeting might not be the first one. */}
        {/* For now, assume the first message is always the greeting for slicing, or remove slice if problematic. */}
        {/* REMOVED slice(1) to ensure all messages, including the first greeting, are rendered */}
        {hasMounted && messages.length > 0 ? messages.map((msg, index) => { 
           const isError = msg.role === 'assistant' && msg.content.includes('Sorry, I encountered an error');
           return (
             <div
               // Start key from 0 as we are no longer slicing
               key={index} 
               className={cn(
                 "p-3 rounded-lg max-w-[85%] text-sm leading-relaxed shadow-sm",
                 msg.role === 'user'
                   ? 'bg-teal-500 text-white ml-auto rounded-br-none'
                   : 'bg-gray-100 text-gray-800 mr-auto rounded-bl-none',
                 isError && 'bg-red-50 border border-red-200 text-red-800'
               )}
             >
               {isError && <AlertTriangle className="inline-block h-4 w-4 mr-1.5 mb-0.5 text-red-600" />}
               {/* Use prose for markdown styling - ensure links are teal */}
               <div className="prose prose-sm max-w-none prose-p:my-1 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-ul:list-disc prose-ul:pl-5 prose-li:my-0.5">
                 <ReactMarkdown
                   components={{ a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
                 >
                   {msg.content}
                 </ReactMarkdown>
               </div>
             </div>
           );
        }) : null}
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
});

export default ChatBuilder;
