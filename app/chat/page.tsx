"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Globe,
  MapPin,
  Users,
  MoreHorizontal,
  ChevronRight,
  MessageSquare,
  Calendar,
  PawPrint,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  options?: { text: string; action: string }[];
}

interface ConversationMemory {
  destination?: string;
  travelDates?: { start: string; end: string };
  petTypes?: string[];
  petNames?: string[];
}

interface ChatResponse {
  content: string;
  updatedMemory?: ConversationMemory;
}

function ChatInitializer({
  stage,
  sendMessage,
}: {
  stage: "greeting" | "planning" | "exploring" | "tips" | "itinerary";
  sendMessage: (message: string) => Promise<void>;
}) {
  const searchParams = useSearchParams();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const input = searchParams.get("input");
    if (input && stage === "greeting" && !hasInitialized.current) {
      console.log("Starting Chat from Query Param:", input);
      hasInitialized.current = true; // Prevent re-run
      sendMessage(decodeURIComponent(input));
    }
  }, [searchParams, stage, sendMessage]);

  return null;
}

export default function ChatPage() {
  const [stage, setStage] = useState<"greeting" | "planning" | "exploring" | "tips" | "itinerary">("greeting");
  const [memory, setMemory] = useState<ConversationMemory>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey there! I’m Baggo, your pet travel companion. Let’s plan a pawsome trip—tell me where you’re going with your furry friend!",
    },
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tripDetails, setTripDetails] = useState<string[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const itineraryContainerRef = useRef<HTMLDivElement>(null);

  const handleOptionSelect = (action: string) => {
    setStage(action === "plan" ? "planning" : action === "explore" ? "exploring" : "tips");
    const optionMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content:
        action === "plan"
          ? "Tell me where you're going, when, and how many pets you're bringing!"
          : action === "explore"
          ? "Not sure where to go? What do you prefer—parks, cities, or beaches?"
          : "Need travel advice? Ask away about packing, logistics, or anything else!",
    };
    setMessages((prev) => [...prev, optionMessage]);
    console.log("Option Selected:", action, "New Message:", optionMessage);
  };

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    console.log("Sending Message:", message);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: message }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status} - ${await response.text()}`);

      const data: ChatResponse = await response.json();
      console.log("API Response Received:", data);

      const userMessage: ChatMessage = { id: Date.now().toString(), role: "user", content: message };
      const assistantMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: data.content };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      setTripDetails((prev) => [...prev, data.content]);

      if (data.updatedMemory) {
        setMemory((prev) => {
          const newMemory = { ...prev, ...data.updatedMemory };
          console.log("Updated Memory:", newMemory);
          return newMemory;
        });
      }

      if (stage === "greeting") setStage("planning");
    } catch (error) {
      console.error("Error Sending Message:", error.message || error);
      const errorMessage: ChatMessage = { id: Date.now().toString(), role: "assistant", content: "Oops, something went wrong! Try again?" };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const startNewConversation = () => {
    console.log("Starting New Conversation—Resetting State");
    setStage("greeting");
    setMemory({});
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hey there! I’m Baggo, your pet travel companion. Let’s plan a pawsome trip—tell me where you’re going with your furry friend!",
      },
    ]);
    setTripDetails([]);
    setInputValue("");
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    if (itineraryContainerRef.current) {
      itineraryContainerRef.current.scrollTop = itineraryContainerRef.current.scrollHeight;
    }
    console.log("Scroll Updated—Messages:", messages.length, "Trip Details:", tripDetails.length);
  }, [messages, tripDetails]);

  const formatResponse = (text: string) => {
    if (text.includes("* ")) {
      const items = text.split("* ").slice(1).map((item) => item.trim());
      return (
        <ul className="list-disc pl-5 text-slate-700 space-y-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed">{item}</li>
          ))}
        </ul>
      );
    }

    return (
      <div className="text-slate-700">
        {text.split("\n").map((para, idx) => (
          <div key={idx} className="mb-2 text-sm leading-relaxed">
            {para.includes("[") && para.includes("](")
              ? para.split(/(\[.*?\]$$.*?$$)/g).map((part, i) => {
                  if (part.match(/\[(.*?)\]$$(.*?)$$/)) {
                    const [_, linkText, linkUrl] = part.match(/\[(.*?)\]$$(.*?)$$/) || [];
                    return (
                      <a
                        key={i}
                        href={linkUrl}
                        className="text-teal-600 hover:text-teal-800 font-medium underline underline-offset-2 transition-colors"
                      >
                        {linkText}
                      </a>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })
              : para}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chat-interface-container flex flex-col overflow-hidden font-sans bg-gradient-to-br from-slate-50 to-slate-100">
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-slate-600">Loading chat...</div>}>
        <ChatInitializer stage={stage} sendMessage={sendMessage} />
        <AnimatePresence mode="wait">
          {stage === "greeting" ? (
            <motion.div
              key="greeting"
              className="flex-1 flex flex-col justify-center items-center px-4 md:px-8 py-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-10 max-w-2xl">
                <motion.div
                  className="mb-6 flex justify-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
                    <PawPrint className="h-10 w-10 text-white" />
                  </div>
                </motion.div>

                <motion.h1
                  className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  Hey, I'm Baggo your personal travel agent
                </motion.h1>

                <motion.p
                  className="text-base md:text-lg text-slate-600 font-light"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  Let me help you plan a stress-free trip with your furry friend—from flights to pet-friendly spots. I’m your travel-savvy buddy who knows the ropes!
                </motion.p>
              </div>

              <motion.form
                onSubmit={handleSubmit}
                className="w-full max-w-xl mb-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="relative">
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Create a weekend getaway..."
                    className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full py-6 px-6 pr-16 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm disabled:opacity-75"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full p-3 transition-all shadow-sm",
                      isLoading ? "opacity-75 cursor-not-allowed" : "hover:shadow-md hover:from-teal-600 hover:to-teal-700 active:scale-95"
                    )}
                    aria-label="Send message"
                    disabled={isLoading}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </motion.form>

              <motion.div
                className="flex flex-wrap gap-3 justify-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <Button
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 transition-all flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow group"
                  onClick={() => handleOptionSelect("plan")}
                >
                  <Globe className="h-4 w-4 text-teal-500 group-hover:text-teal-600 transition-colors" />
                  <span>Create a new Trip</span>
                  <ChevronRight className="h-3.5 w-3.5 text-teal-500 group-hover:text-teal-600 transition-colors group-hover:translate-x-0.5 transform duration-200" />
                </Button>
                <Button
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 transition-all flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow group"
                  onClick={() => handleOptionSelect("explore")}
                >
                  <MapPin className="h-4 w-4 text-teal-500 group-hover:text-teal-600 transition-colors" />
                  <span>Inspire me where to go</span>
                  <ChevronRight className="h-3.5 w-3.5 text-teal-500 group-hover:text-teal-600 transition-colors group-hover:translate-x-0.5 transform duration-200" />
                </Button>
                <Button
                  className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 transition-all flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow group"
                  onClick={() => handleOptionSelect("tips")}
                >
                  <Users className="h-4 w-4 text-teal-500 group-hover:text-teal-600 transition-colors" />
                  <span>Find pet-friendly hotels</span>
                  <ChevronRight className="h-3.5 w-3.5 text-teal-500 group-hover:text-teal-600 transition-colors group-hover:translate-x-0.5 transform duration-200" />
                </Button>
                <Button className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 transition-all flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow group">
                  <MoreHorizontal className="h-4 w-4 text-teal-500 group-hover:text-teal-600 transition-colors" />
                  <span>More</span>
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              className="flex-1 flex flex-col h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="border-b border-slate-200 bg-white py-3 px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mr-3">
                    <PawPrint className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-lg font-medium text-slate-800">Baggo</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:text-slate-900"
                    onClick={startNewConversation}
                    aria-label="Start New Conversation"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="md:w-1/2 flex flex-col h-[calc(100vh-132px)]">
                  <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6" ref={chatContainerRef}>
                    <div className="space-y-4">
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          className="mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div
                            className={cn(
                              "p-3 rounded-2xl max-w-[85%]",
                              m.role === "user"
                                ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white ml-auto shadow-sm"
                                : "bg-white text-slate-800 mr-auto border border-slate-200 shadow-sm"
                            )}
                          >
                            {m.role === "user" ? <div className="text-sm">{m.content}</div> : formatResponse(m.content)}
                          </div>
                          {m.options && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {m.options.map((opt) => (
                                <Button
                                  key={opt.action}
                                  className="bg-white hover:bg-slate-50 text-slate-700 text-xs rounded-full py-1 px-3 border border-slate-200 shadow-sm hover:shadow transition-all"
                                  onClick={() => handleOptionSelect(opt.action)}
                                >
                                  {opt.text}
                                </Button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                      {isLoading && (
                        <div
                          className="p-3 bg-white rounded-2xl max-w-[85%] mr-auto border border-slate-200 shadow-sm"
                          aria-busy="true"
                          aria-live="polite"
                        >
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "300ms" }} />
                            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "600ms" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:w-1/2 border-l border-slate-200 flex flex-col h-[calc(100vh-132px)]">
                  <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6" ref={itineraryContainerRef}>
                    <h2 className="text-lg font-medium text-slate-800 mb-4 pb-2 border-b border-slate-200 flex items-center">
                      <span className="bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent">
                        Trip Details
                      </span>
                    </h2>
                    {tripDetails.length > 0 ? (
                      <div className="space-y-4">
                        {tripDetails.map((detail, idx) => (
                          <motion.div
                            key={idx}
                            className="p-3 rounded-lg border border-slate-200 shadow-sm bg-white"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                          >
                            {formatResponse(detail)}
                          </motion.div>
                        ))}
                      </div>
                    ) : isLoading ? (
                      <div className="space-y-3 p-4" aria-busy="true" aria-live="polite">
                        <div className="h-3 w-[90%] bg-slate-200 rounded-full animate-pulse" />
                        <div className="h-3 w-[70%] bg-slate-200 rounded-full animate-pulse" />
                        <div className="h-3 w-[80%] bg-slate-200 rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[calc(100%-3rem)] text-center p-6">
                        <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                          <MessageSquare className="h-6 w-6 text-teal-500" />
                        </div>
                        <p className="text-slate-500 text-sm">
                          Your trip details and itinerary will appear here once Baggo has gathered enough information.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 left-0 right-0 border-t border-slate-200 bg-white py-3 px-4 md:px-6 z-10">
                <form onSubmit={handleSubmit} className="max-w-full mx-auto">
                  <div className="relative">
                    <Input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full bg-white border border-slate-200 rounded-full py-2.5 px-4 pr-12 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 shadow-sm disabled:opacity-75"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-full p-2 transition-all",
                        isLoading ? "opacity-75 cursor-not-allowed" : "hover:from-teal-600 hover:to-teal-700 active:scale-95"
                      )}
                      aria-label="Send message"
                      disabled={isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}