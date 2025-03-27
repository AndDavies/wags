// app/chat/page.tsx
"use client";

import { useState, FormEvent, useRef } from "react";
import { Send, Globe, MapPin, Users, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Define the type for chat messages
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Define the type for the data returned by /api/chat
type ChatData = {
  content: string;
  queryString?: string;
};

export default function ChatPage() {
  const [petType, setPetType] = useState<string>("Dog");
  const [tags, setTags] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChatData[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // Extract tags from the latest user message
  const extractTags = (message: string) => {
    const messageLower = message.toLowerCase();
    const possibleTags = messageLower.match(/\b(spain|france|iceland|japan|uk|usa|hiking|sightseeing|relaxing)\b/gi) || [];
    setTags([...new Set([...tags, ...possibleTags])]);
    console.log("[Chat Page] Extracted tags:", possibleTags);
  };

  // Custom fetch function to call /api/chat
  const sendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Date.now().toString(), // Generate a unique ID
          messages: [
            {
              role: "user",
              content: message,
              parts: [{ type: "text", text: message }],
            },
          ],
          petType,
          tags,
        }),
      });

      console.log("[Chat Page] Received response:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch response: ${response.status} ${response.statusText}`);
      }

      const result: ChatData = await response.json();
      console.log("[Chat Page] Response data:", result);

      // Add the user message and assistant response to the chat
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "user", content: message },
        { id: (Date.now() + 1).toString(), role: "assistant", content: result.content },
      ]);

      // Update data for queryString
      setData((prev) => [...prev, result]);
    } catch (err) {
      console.error("[Chat Page] Error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      console.log("[Chat Page] No input provided");
      return;
    }
    console.log("[Chat Page] Submitting message:", inputValue);
    extractTags(inputValue);
    sendMessage(inputValue);
    setInputValue(""); // Clear the input after submission
  };

  // Handle tag click by updating the input and submitting the form
  const handleTagClick = (tag: string) => {
    const newMessage = `Tell me more about ${tag}`;
    setInputValue(newMessage);
    extractTags(newMessage);
    if (formRef.current) {
      const submitEvent = new Event("submit", { cancelable: true, bubbles: true });
      formRef.current.dispatchEvent(submitEvent);
    }
  };

  // Handle suggested prompt click by updating the input and submitting the form
  const handlePromptClick = (promptText: string) => {
    setInputValue(promptText);
    extractTags(promptText);
    if (formRef.current) {
      const submitEvent = new Event("submit", { cancelable: true, bubbles: true });
      formRef.current.dispatchEvent(submitEvent);
    }
  };

  const suggestedPrompts = [
    { text: "Plan a trip to Paris with my dog", params: { destination: "Paris", pet: "dog" } },
    { text: "What does Spain require for pets?", params: { destination: "Spain" } },
    { text: "Find pet-friendly activities in London", params: { destination: "London", activities: "sightseeing" } },
    { text: "More", params: {} },
  ];

  // Safely access the latest queryString from data
  const latestData = data && data.length > 0 ? data[data.length - 1] : null;
  const queryString = latestData?.queryString;

  return (
    <div className="min-h-screen bg-white pt-24 pb-16 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#333]">
            Hey, I’m Baggo your
            <br />
            personal pet travel agent
          </h1>
          <p className="text-lg text-[#555] max-w-2xl mx-auto">
            Let me help plan your pet’s next adventure—from requirements to activities. Think of me as your pet travel-savvy friend who knows all the ins and outs!
          </p>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-[#f5f5f5] rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center">Start by asking me anything about pet travel!</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-4 p-3 rounded-lg ${
                    m.role === "user" ? "bg-gray-200 text-right" : "bg-brand-teal/10 text-left"
                  }`}
                >
                  {m.content}
                  {m.role === "assistant" && queryString && (
                    <div className="mt-2">
                      <Link href={queryString} className="text-brand-teal underline">
                        Plan This Trip
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <p className="text-gray-500 text-center">Baggo is thinking...</p>
            )}
            {error && (
              <p className="text-red-500 text-center">Error: {error}</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about pet travel requirements..."
                className="w-full bg-[#f5f5f5] border-none rounded-full py-5 px-6 pr-16 text-[#333] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-brand-teal/50 shadow-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-teal text-white rounded-full p-3 hover:bg-brand-teal/90 transition-colors"
                aria-label="Send message"
                disabled={isLoading}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </motion.div>

        {/* Pet Type Selector */}
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Select value={petType} onValueChange={setPetType}>
            <SelectTrigger className="w-32 bg-[#f5f5f5] border-none rounded-full py-3 px-5 text-[#333] focus:outline-none focus:ring-2 focus:ring-brand-teal/50 shadow-sm">
              <SelectValue placeholder="Select Pet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dog">Dog</SelectItem>
              <SelectItem value="Cat">Cat</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Tags */}
        {tags.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2 justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {tags.map((tag) => (
              <Button
                key={tag}
                variant="outline"
                className="bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#555] rounded-full py-3 px-5 transition-colors"
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Button>
            ))}
          </motion.div>
        )}

        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {suggestedPrompts.map((prompt) => (
            <Button
              key={prompt.text}
              className="flex items-center gap-2 bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#555] rounded-full py-3 px-5 transition-colors"
              onClick={() => handlePromptClick(prompt.text)}
            >
              {prompt.text === "Plan a trip to Paris with my dog" && <Globe className="h-5 w-5 text-brand-teal" />}
              {prompt.text === "What does Spain require for pets?" && <MapPin className="h-5 w-5 text-brand-teal" />}
              {prompt.text === "Find pet-friendly activities in London" && <Users className="h-5 w-5 text-brand-teal" />}
              {prompt.text === "More" && <MoreHorizontal className="h-5 w-5 text-brand-teal" />}
              {prompt.text}
            </Button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}