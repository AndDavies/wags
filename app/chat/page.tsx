"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Send, MapPin, MapIcon, PawPrint, Plus, Plane, Hotel, Car, Utensils, Camera, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tripId?: string;
  tripData?: {
    departure: string;
    destination: string;
    petType: string;
    travelDate: string;
    activityTags: string[];
    activities: string[];
  };
}

interface Itinerary {
  departure: string;
  destination: string;
  dates: { start: string };
  travelers: { pet: { type: string } };
  method: string;
  tips: { general: string };
  activities: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hey there! I’m here to plan a pet-friendly trip anywhere in the world. Where are you starting, and where are you headed with your pet? (e.g., 'Paris to Tokyo')",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary>({
    departure: '',
    destination: '',
    dates: { start: 'TBD' },
    travelers: { pet: { type: 'unknown' } },
    method: 'flight',
    tips: { general: '' },
    activities: [],
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const activityOptions = [
    "Relaxing Beach", "Adventure", "Cultural Immersion", "Romantic Getaway",
    "Family-Friendly", "Luxury Stay", "Budget-Friendly", "Solo Travel",
    "Historical Tour", "Culinary Experience", "Wellness Retreat", "Eco-Tourism"
  ];

  const handleTagClick = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    setInput(newTags.length ? `Yes, ${newTags.join(', ')}` : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMessages((prev) => [...prev, data]);

      // Update itinerary from tripData
      if (data.tripData) {
        setItinerary({
          departure: data.tripData.departure || '',
          destination: data.tripData.destination || '',
          dates: { start: data.tripData.travelDate || 'TBD' },
          travelers: { pet: { type: data.tripData.petType || 'unknown' } },
          method: 'flight',
          tips: { general: data.tripId ? 'Check pet import rules and pack comfort items.' : itinerary.tips.general },
          activities: data.tripData.activities || [],
        });
      }

      if (data.tripId) console.log('Itinerary finalized with ID:', data.tripId);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Sorry, something went wrong. Try again!' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current messages:', JSON.stringify(messages, null, 2));
  }, [messages]);

  const formatMessage = (content: string) => {
    const paragraphs = content.split('\n\n');
    return paragraphs.map((para, index) => {
      if (para.match(/^\d+\.\s*\*\*/)) {
        const items = para.split('\n').filter(Boolean);
        return (
          <ul key={index} className="list-decimal list-inside space-y-1">
            {items.map((item, i) => {
              const [heading, ...rest] = item.split(':');
              const cleanHeading = heading.replace(/^\d+\.\s*\*\*(.+)\*\*/, '$1');
              return (
                <li key={i}>
                  <span className="font-bold text-teal-600">{cleanHeading}:</span>{' '}
                  {rest.join(':')}
                </li>
              );
            })}
          </ul>
        );
      }
      const formattedPara = para.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-teal-600">$1</strong>');
      if (formattedPara.includes('Relaxing Beach')) {
        return (
          <div key={index} className="mb-2">
            <p dangerouslySetInnerHTML={{ __html: formattedPara }} />
            <div className="flex flex-wrap gap-2 mt-2">
              {activityOptions.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer ${selectedTags.includes(tag) ? 'bg-teal-600 text-white' : 'text-teal-600 border-teal-600 hover:bg-teal-100'}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        );
      }
      return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedPara }} />;
    });
  };

  // Bubble indicators
  const indicators = [
    { label: "Origin", value: itinerary.departure, icon: <MapPin className="h-4 w-4" /> },
    { label: "Destination", value: itinerary.destination, icon: <MapPin className="h-4 w-4" /> },
    { label: "Pet", value: itinerary.travelers.pet.type !== 'unknown' ? itinerary.travelers.pet.type : '', icon: <PawPrint className="h-4 w-4" /> },
    { label: "Date", value: itinerary.dates.start !== 'TBD' ? itinerary.dates.start : '', icon: <Calendar className="h-4 w-4" /> },
    { label: "Activities", value: itinerary.activities.length ? itinerary.activities.join(', ') : '', icon: <Camera className="h-4 w-4" /> },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-white pt-24">
      {/* Left Panel - Chat */}
      <div className="w-1/2 h-full flex flex-col border-r border-gray-200">
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 font-montserrat">Where to today?</h1>

          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-4 mb-4">
              <div
                className={`bg-${
                  msg.role === "user" ? "gray-100" : "black"
                } rounded-full p-2 flex-shrink-0`}
              >
                <PawPrint
                  className={`h-6 w-6 ${msg.role === "user" ? "text-gray-600" : "text-white"}`}
                />
              </div>
              <div
                className={`text-gray-800 text-lg font-lato ${
                  msg.role === "user" ? "text-right w-full" : "w-full"
                }`}
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-4 mb-4 animate-pulse">
              <div className="bg-black rounded-full p-2 flex-shrink-0">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-2 w-3/4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="text-center mb-2 text-sm text-gray-500 font-lato">
            What can I ask Wags & Wanders?
          </div>
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-white border border-gray-300 rounded-full py-4 px-6 pr-24 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm font-lato disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 disabled:text-gray-400"
                  disabled={isLoading}
                >
                  <Plus className="h-5 w-5" />
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-600 text-white rounded-full p-2 hover:bg-teal-700 disabled:bg-teal-400"
                  disabled={isLoading}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>
          <div className="text-center mt-2 text-xs text-gray-400 font-lato">
            Wags & Wanders can make mistakes. Check important info.
          </div>
        </div>
      </div>

      {/* Right Panel - Itinerary & Details */}
      <div className="w-1/2 h-full overflow-y-auto bg-gray-50">
        <div className="p-6">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 font-montserrat">Your Itinerary</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center">
                  <MapIcon className="h-4 w-4 mr-1" />
                  Map
                </Button>
                <Button variant="link" className="text-teal-600 hover:underline text-sm font-lato">
                  Explore
                </Button>
              </div>
            </div>

            {/* Bubble Indicators */}
            <div className="flex flex-wrap gap-4 mb-6">
              {indicators.map((indicator, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      indicator.value ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {indicator.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{indicator.label}</p>
                    <p className="text-xs text-gray-600">{indicator.value || 'Pending'}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Card className="bg-white shadow-md border-teal-200">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-montserrat text-gray-800">
                  <Plane className="h-5 w-5 text-teal-600 mr-2" />
                  {itinerary.departure || 'TBD'} → {itinerary.destination || 'TBD'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600 font-lato">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <span>{itinerary.dates.start}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-lato">
                  <PawPrint className="h-4 w-4 text-teal-600" />
                  <span>{itinerary.travelers.pet.type}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-lato">
                  <Plane className="h-4 w-4 text-teal-600" />
                  <span>Flight: <a href="https://expedia.com" target="_blank" className="text-teal-600 hover:underline">Book for $200</a> (example)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 font-lato">
                  <Hotel className="h-4 w-4 text-teal-600" />
                  <span>Hotel: <a href="https://booking.com" target="_blank" className="text-teal-600 hover:underline">Book for $150/night</a> (example)</span>
                </div>
                {itinerary.activities.length ? (
                  <div className="flex items-start gap-2 text-gray-600 font-lato">
                    <Camera className="h-4 w-4 text-teal-600 mt-1" />
                    <span>Activities: {itinerary.activities.join(', ')}</span>
                  </div>
                ) : null}
                {itinerary.tips.general ? (
                  <div className="flex items-start gap-2 text-gray-600 font-lato">
                    <Utensils className="h-4 w-4 text-teal-600 mt-1" />
                    <span>Tips: {itinerary.tips.general}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 font-montserrat">Jump back in</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-500 shadow-md border-blue-600">
                <CardContent className="flex items-center justify-center p-4">
                  <div className="text-center text-white">
                    <div className="mx-auto w-16 h-16 mb-2 relative">
                      <Image
                        src="/placeholder.svg?height=100&width=100"
                        alt="Create a trip"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-sm font-lato">Create a trip</h3>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}