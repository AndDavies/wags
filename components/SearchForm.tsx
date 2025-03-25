"use client"

import type React from "react"

import { useState } from "react"
import { Plane, Calendar, Users, Search, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchFormProps {
  className?: string
}

export default function ResponsiveSearchForm({ className }: SearchFormProps) {
  const [fromLocation, setFromLocation] = useState("Your Location")
  const [toLocation, setToLocation] = useState("Dream Destination")
  const [travelDate, setTravelDate] = useState("")
  const [travelers, setTravelers] = useState(1)
  const [petType, setPetType] = useState("Dog")
  const [activeField, setActiveField] = useState<string | null>(null)

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would handle the actual search logic
    console.log("Search submitted:", { fromLocation, toLocation, travelDate, travelers, petType })
    // Navigate to search results page
    // window.location.href = "/search-results"
  }

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} className="w-full">
        {/* Desktop Version - All fields in one row */}
        <div className="hidden md:flex bg-white/20 backdrop-blur-md rounded-full border border-white/30 p-2">
          {/* From Location */}
          <div className="flex-1 flex items-center p-2 border-r border-white/30">
            <Plane className="h-5 w-5 text-white mr-2 rotate-45" />
            <div className="text-left flex-1">
              <label htmlFor="desktop-from" className="block text-white/80 text-xs">
                From
              </label>
              <input
                id="desktop-from"
                type="text"
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="bg-transparent border-none text-white text-sm font-medium focus:outline-none w-full"
                placeholder="Your Location"
              />
            </div>
          </div>

          {/* To Location */}
          <div className="flex-1 flex items-center p-2 border-r border-white/30">
            <Plane className="h-5 w-5 text-white mr-2" />
            <div className="text-left flex-1">
              <label htmlFor="desktop-to" className="block text-white/80 text-xs">
                To
              </label>
              <input
                id="desktop-to"
                type="text"
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="bg-transparent border-none text-white text-sm font-medium focus:outline-none w-full"
                placeholder="Dream Destination"
              />
            </div>
          </div>

          {/* Date Selection */}
          <div className="flex-1 flex items-center p-2 border-r border-white/30">
            <Calendar className="h-5 w-5 text-white mr-2" />
            <div className="text-left flex-1">
              <label htmlFor="desktop-date" className="block text-white/80 text-xs">
                Travel Date
              </label>
              <input
                id="desktop-date"
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="bg-transparent border-none text-white text-sm font-medium focus:outline-none w-full"
                placeholder="Select Date"
              />
            </div>
          </div>

          {/* Travelers */}
          <div className="flex items-center p-2 pr-3">
            <Users className="h-5 w-5 text-white mr-2" />
            <div className="text-left">
              <label htmlFor="desktop-travelers" className="block text-white/80 text-xs">
                Travelers
              </label>
              <select
                id="desktop-travelers"
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                className="bg-transparent border-none text-white text-sm font-medium focus:outline-none appearance-none pr-5"
                style={{ backgroundImage: "none" }}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num} className="text-gray-800">
                    {num} Traveler{num > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3 w-3 text-white absolute right-16 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="bg-[#FF6B98] hover:bg-[#FF5A8B] text-white rounded-full p-3 transition-all hover:scale-105"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Version - Accordion style with sticky search button */}
        <div className="md:hidden flex flex-col bg-white/20 backdrop-blur-md rounded-xl border border-white/30 overflow-hidden">
          {/* From Location */}
          <div className={cn("border-b border-white/30 transition-all", activeField === "from" ? "bg-white/30" : "")}>
            <div
              className="flex items-center justify-between p-3"
              onClick={() => setActiveField(activeField === "from" ? null : "from")}
            >
              <div className="flex items-center">
                <Plane className="h-5 w-5 text-white mr-3 rotate-45" />
                <div>
                  <span className="text-white/80 text-xs">From</span>
                  <p className="text-white font-medium">{fromLocation || "Your Location"}</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white transition-transform",
                  activeField === "from" ? "transform rotate-180" : "",
                )}
              />
            </div>
            {activeField === "from" && (
              <div className="p-3 pt-0">
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg p-2 text-white focus:outline-none"
                  placeholder="Enter departure location"
                />
              </div>
            )}
          </div>

          {/* To Location */}
          <div className={cn("border-b border-white/30 transition-all", activeField === "to" ? "bg-white/30" : "")}>
            <div
              className="flex items-center justify-between p-3"
              onClick={() => setActiveField(activeField === "to" ? null : "to")}
            >
              <div className="flex items-center">
                <Plane className="h-5 w-5 text-white mr-3" />
                <div>
                  <span className="text-white/80 text-xs">To</span>
                  <p className="text-white font-medium">{toLocation || "Dream Destination"}</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white transition-transform",
                  activeField === "to" ? "transform rotate-180" : "",
                )}
              />
            </div>
            {activeField === "to" && (
              <div className="p-3 pt-0">
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg p-2 text-white focus:outline-none"
                  placeholder="Enter destination"
                />
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className={cn("border-b border-white/30 transition-all", activeField === "date" ? "bg-white/30" : "")}>
            <div
              className="flex items-center justify-between p-3"
              onClick={() => setActiveField(activeField === "date" ? null : "date")}
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-white mr-3" />
                <div>
                  <span className="text-white/80 text-xs">Travel Date</span>
                  <p className="text-white font-medium">{travelDate || "Select Date"}</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white transition-transform",
                  activeField === "date" ? "transform rotate-180" : "",
                )}
              />
            </div>
            {activeField === "date" && (
              <div className="p-3 pt-0">
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-white/20 border border-white/30 rounded-lg p-2 text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Travelers */}
          <div className={cn("transition-all", activeField === "travelers" ? "bg-white/30" : "")}>
            <div
              className="flex items-center justify-between p-3"
              onClick={() => setActiveField(activeField === "travelers" ? null : "travelers")}
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-white mr-3" />
                <div>
                  <span className="text-white/80 text-xs">Travelers</span>
                  <p className="text-white font-medium">
                    {travelers} Traveler{travelers > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-white transition-transform",
                  activeField === "travelers" ? "transform rotate-180" : "",
                )}
              />
            </div>
            {activeField === "travelers" && (
              <div className="p-3 pt-0">
                <div className="flex justify-between items-center bg-white/20 border border-white/30 rounded-lg p-2">
                  <button
                    type="button"
                    onClick={() => setTravelers(Math.max(1, travelers - 1))}
                    className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white"
                  >
                    -
                  </button>
                  <span className="text-white font-medium">{travelers}</span>
                  <button
                    type="button"
                    onClick={() => setTravelers(travelers + 1)}
                    className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Button - Always visible */}
          <div className="p-3">
            <button
              type="submit"
              className="w-full bg-[#FF6B98] hover:bg-[#FF5A8B] text-white rounded-full py-3 flex items-center justify-center transition-all"
            >
              <Search className="h-5 w-5 mr-2" />
              <span className="font-medium">Search Adventures</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

