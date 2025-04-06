'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SidePanel from '@/components/ui/side-panel';
import { createClient } from '@/lib/supabase-client';

// Define a type for side-panel data
interface SidePanelData {
  title: string;
  content: string;
  imageUrl?: string;
  bookingLink?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sidePanelData?: SidePanelData;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState<SidePanelData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting based on PRD
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hey there! Let\'s plan a pawsome trip. Quick Qs: Work hours to avoid? City or nature? Family, solo, or luxury vibe?'
      }
    ]);
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare messages for API in the format expected by Grok
      const apiMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      apiMessages.push({ role: 'user', content: input });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      // Add the bot's response to the messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        sidePanelData: data.sidePanelData // Typed as SidePanelData
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area - Left Panel */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h1 className="text-xl font-semibold">Wags & Wanders Chat</h1>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sidePanelData && (
                  <button
                    onClick={() => setSidePanelContent(message.sidePanelData ?? null)} // Fixed undefined to null
                    className="mt-2 text-sm underline"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-4">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>

      {/* Rich Side Panel - Right Panel */}
      <div className="w-[400px] border-l border-gray-200 bg-white overflow-y-auto">
        {sidePanelContent ? (
          <SidePanel
            title={sidePanelContent.title}
            content={sidePanelContent.content}
            imageUrl={sidePanelContent.imageUrl}
            bookingLink={sidePanelContent.bookingLink}
          />
        ) : (
          <div className="p-4 text-center text-gray-500">
            Select a message with details to view more information
          </div>
        )}
      </div>
    </div>
  );
}