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
  sidePanelData?: any;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidePanelContent, setSidePanelContent] = useState<any>(null);
  const [streamedContent, setStreamedContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial greeting on mount
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hey there! Let\'s plan a pawsome trip. Quick Qs: Work hours to avoid? City or nature? Family, solo, or luxury vibe?'
      }
    ]);
  }, []);

  // Clean up any ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle streaming response from the Grok API
  const processStreamData = (data: string) => {
    try {
      if (data === "[DONE]") return;
      
      const parsed = JSON.parse(data);
      const content = parsed.choices[0]?.delta?.content || '';
      
      if (content) {
        setStreamedContent(prev => prev + content);
      }
    } catch (e) {
      console.error('Error parsing stream data:', e);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    
    // Update the messages with the user's input
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamedContent('');

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

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
        body: JSON.stringify({ 
          messages: apiMessages,
          stream: true // Enable streaming
        }),
        signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      // Handle the streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available in response');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk and add it to our buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process any complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep any incomplete line for the next chunk

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            processStreamData(data);
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer && buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        processStreamData(data);
      }

      // Add the complete response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: streamedContent,
        sidePanelData: null // Will be updated later when we implement structured data
      }]);
      
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Request was cancelled');
      } else {
        console.error('Error sending message:', error);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request. Please try again.'
        }]);
      }
    } finally {
      setIsLoading(false);
      setStreamedContent('');
      abortControllerRef.current = null;
    }
  };

  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I stopped generating the response.'
      }]);
      setStreamedContent('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50" ref={containerRef}>
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
                    onClick={() => setSidePanelContent(message.sidePanelData)}
                    className="mt-2 text-sm underline"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
          {/* Streaming content */}
          {streamedContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-4 bg-white border border-gray-200">
                <p className="whitespace-pre-wrap">{streamedContent}</p>
              </div>
            </div>
          )}
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
            {isLoading ? (
              <Button onClick={cancelRequest} variant="destructive">
                Stop
              </Button>
            ) : (
              <Button onClick={handleSendMessage} disabled={!input.trim()}>
                Send
              </Button>
            )}
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