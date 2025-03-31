"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Send,
  MapPin,
  Map,
  PawPrint,
  Plus,
  ChevronLeft,
  Calendar,
  Camera,
  Compass
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  tripId?: string
  tripData?: {
    departure: string
    destination: string
    petType: string
    travelDate: string
    activityTags: string[]
    activities: string[]
  }
}

interface Itinerary {
  departure: string
  destination: string
  dates: { start: string }
  travelers: { pet: { type: string } }
  method: string
  tips: { general: string }
  activities: string[]
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hey there! I’m here to plan a pet-friendly trip anywhere in the world. Where are you starting, and where are you headed with your pet? (e.g., 'Paris to Tokyo')",
    },
  ])
  const [inputValue, setInputValue] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [itinerary, setItinerary] = useState<Itinerary>({
    departure: "",
    destination: "",
    dates: { start: "TBD" },
    travelers: { pet: { type: "unknown" } },
    method: "flight",
    tips: { general: "" },
    activities: [],
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const activityOptions = [
    "Relaxing Beach",
    "Adventure",
    "Cultural Immersion",
    "Romantic Getaway",
    "Family-Friendly",
    "Luxury Stay",
    "Budget-Friendly",
    "Solo Travel",
    "Historical Tour",
    "Culinary Experience",
    "Wellness Retreat",
    "Eco-Tourism",
  ]

  const handleTagClick = (tag: string) => {
    const newTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    setSelectedTags(newTags)
    setInputValue(newTags.length ? `Yes, ${newTags.join(", ")}` : "")
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      setMessages((prev) => [...prev, data])

      if (data.tripData) {
        setItinerary({
          departure: data.tripData.departure || '',
          destination: data.tripData.destination || '',
          dates: { start: data.tripData.travelDate || 'TBD' },
          travelers: { pet: { type: data.tripData.petType || 'unknown' } },
          method: 'flight',
          tips: { general: data.tripId ? 'Check pet import rules and pack comfort items.' : itinerary.tips.general },
          activities: data.tripData.activities || [],
        })
      }

      if (data.tripId) console.log('Itinerary finalized with ID:', data.tripId)
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Sorry, something went wrong. Try again!' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const formatMessage = (content: string) => {
    const paragraphs = content.split("\n\n")
    return paragraphs.map((para, index) => {
      if (para.match(/^\*\*Day \d+:/)) {
        const days = para.split('\n**Day ').filter(Boolean)
        return days.map((day, i) => {
          const [title, ...lines] = (i === 0 ? para : `**Day ${day}`).split('\n')
          return (
            <div key={`${index}-${i}`} className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">{title.replace(/\*\*/g, '')}</h3>
              {lines.map((line, j) => (
                <p key={`${index}-${i}-${j}`} className="text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-teal-600">$1</strong>') }} />
              ))}
            </div>
          )
        })
      }
      const formattedPara = para.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-teal-600">$1</strong>')
      if (formattedPara.includes("Relaxing Beach")) {
        return (
          <div key={index} className="mb-2">
            <p dangerouslySetInnerHTML={{ __html: formattedPara }} />
            <div className="flex flex-wrap gap-2 mt-2">
              {activityOptions.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className={`cursor-pointer ${selectedTags.includes(tag) ? "bg-teal-600 text-white" : "text-teal-600 border-teal-600 hover:bg-teal-100"}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )
      }
      return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedPara }} />
    })
  }

  // Bubble indicators
  const indicators = [
    { label: "Origin", value: itinerary.departure, icon: <MapPin className="h-4 w-4" /> },
    { label: "Destination", value: itinerary.destination, icon: <MapPin className="h-4 w-4" /> },
    {
      label: "Pet",
      value: itinerary.travelers.pet.type !== "unknown" ? itinerary.travelers.pet.type : "",
      icon: <PawPrint className="h-4 w-4" />,
    },
    {
      label: "Date",
      value: itinerary.dates.start !== "TBD" ? itinerary.dates.start : "",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "Activities",
      value: itinerary.activities.length ? itinerary.activities.join(", ") : "",
      icon: <Camera className="h-4 w-4" />,
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Main Chat Area (50%) */}
      <div className="w-1/2 flex flex-col border-r border-gray-200">
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft size={20} />
            </Link>
            <h1 className="text-lg font-medium">New Chat</h1>
          </div>
          <Button variant="link" className="text-[#249ab4] hover:text-[#1e8a9f] text-sm font-medium">
            Create a Trip
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <h2 className="text-3xl font-bold mb-6">Where to today?</h2>
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="flex items-start space-x-3">
                {message.role === "assistant" && (
                  <div className="bg-black rounded-full p-2 flex-shrink-0">
                    <PawPrint className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-4 max-w-3xl ${
                    message.role === "user" ? "bg-[#249ab4] text-white ml-auto" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {formatMessage(message.content)}
                </div>
                {message.role === "user" && (
                  <div className="bg-gray-200 rounded-full p-2 flex-shrink-0">
                    <div className="h-5 w-5 flex items-center justify-center text-gray-600 font-medium text-sm">U</div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="bg-black rounded-full p-2 flex-shrink-0">
                  <PawPrint className="h-5 w-5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl p-4 max-w-3xl">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
                    <div
                      className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-2 text-sm text-gray-500">What can I ask Wags & Wanders?</div>
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-white border border-gray-300 rounded-full py-3 px-6 pr-24 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#249ab4]/50 shadow-sm"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <button type="button" className="p-2 text-gray-500 hover:text-gray-700 disabled:text-gray-400" disabled={isLoading}>
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  type="submit"
                  className="bg-[#249ab4] text-white rounded-full p-2 hover:bg-[#1e8a9f] disabled:bg-[#1e8a9f]/50"
                  aria-label="Send message"
                  disabled={isLoading}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
            <div className="text-center mt-2 text-xs text-gray-400">
              <span>Wags & Wanders can make mistakes. Check important info.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (50%) */}
      <div className="w-1/2 bg-white overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Your Itinerary</h2>
            <Button variant="outline" size="sm" className="flex items-center">
              <Map className="h-4 w-4 mr-1" />
              Map
            </Button>
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

          {/* Itinerary Card */}
          <Card className="bg-white shadow-md border-teal-200">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-montserrat text-gray-800">
                <PawPrint className="h-5 w-5 text-teal-600 mr-2" />
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
              {itinerary.activities.length ? (
                <div className="flex items-start gap-2 text-gray-600 font-lato">
                  <Camera className="h-4 w-4 text-teal-600 mt-1" />
                  <span>Activities: {itinerary.activities.join(', ')}</span>
                </div>
              ) : null}
              {itinerary.tips.general ? (
                <div className="flex items-start gap-2 text-gray-600 font-lato">
                  <Compass className="h-4 w-4 text-teal-600 mt-1" />
                  <span>Tips: {itinerary.tips.general}</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}