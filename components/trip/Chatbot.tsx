'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-client';

interface ChatbotProps {
  tripData: any;
  onClose: () => void;
  session: any | null;
}

export default function Chatbot({ tripData, onClose, session }: ChatbotProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      const supabase = createClient();
      supabase
        .from('conversations')
        .select('message, response')
        .eq('user_id', session.user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching conversation history:', error);
          } else {
            setMessages(
              data?.flatMap((item) => [
                { role: 'user', content: item.message },
                { role: 'assistant', content: item.response },
              ]) || []
            );
          }
        });
    }
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
      // Check if query is vet-related
      if (input.toLowerCase().includes('vet') || input.toLowerCase().includes('veterinarian')) {
        const dayMatch = input.match(/day (\d+)/i);
        const day = dayMatch ? parseInt(dayMatch[1]) - 1 : 0;
        const location = tripData.itinerary?.[day]?.city || tripData.destination;
        const response = await fetch('/api/places/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location, type: 'veterinary_care' }),
        });
        if (!response.ok) throw new Error('Failed to fetch vets');
        const results = await response.json();
        const vetList = results.map((vet: any) => `${vet.name} (${vet.rating || 'N/A'} stars)`).join(', ');
        const reply = results.length > 0 ? `Nearby vets: ${vetList}` : 'No vets found nearby.';
        setMessages([...newMessages, { role: 'assistant', content: reply }]);
        if (session) {
          const supabase = createClient();
          await supabase
            .from('conversations')
            .insert({ user_id: session.user.id, message: input, response: reply });
        }
      } else {
        const response = await fetch('/api/ai/enhanced-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: input, tripData }),
        });
        if (!response.ok) throw new Error('Failed to process query');
        const { reply } = await response.json();
        setMessages([...newMessages, { role: 'assistant', content: reply }]);
        if (session) {
          const supabase = createClient();
          await supabase
            .from('conversations')
            .insert({ user_id: session.user.id, message: input, response: reply });
        }
      }
    } catch (error) {
      console.error('Error processing chatbot query:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I couldn’t process that. Try again?' }]);
    }
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-teal-700 font-bold text-lg">Travel Assistant</h3>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-800"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto mb-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg mb-2 ${
              msg.role === 'user' ? 'bg-teal-50 text-gray-700' : 'bg-white text-gray-700'
            }`}
          >
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Ask about your trip..."
        />
        <button
          onClick={handleSend}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          Send
        </button>
      </div>
    </div>
  );
}