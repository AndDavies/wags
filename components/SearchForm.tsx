"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Plane, Users, Search, ChevronDown, Minus, Plus, PawPrint } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SearchFormProps {
  className?: string
}

interface TravelerType {
  type: string
  label: string
  description: string
  count: number
}

export function SearchForm({ className }: SearchFormProps) {
  const [fromLocation, setFromLocation] = useState("Your Location")
  const [toLocation, setToLocation] = useState("Dream Destination")
  const [activeField, setActiveField] = useState<string | null>(null)
  const [showTravelerSelector, setShowTravelerSelector] = useState(false)

  const [travelers, setTravelers] = useState<TravelerType[]>([
    { type: "adults", label: "Adults", description: "Ages 13 or above", count: 0 },
    { type: "children", label: "Children", description: "Ages 2-12", count: 0 },
    { type: "infants", label: "Infants", description: "Under 2", count: 0 },
    { type: "pets", label: "Pets", description: "Bringing a service animal?", count: 0 },
  ])

  const travelerSelectorRef = useRef<HTMLDivElement>(null)

  // Close traveler selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (travelerSelectorRef.current && !travelerSelectorRef.current.contains(event.target as Node)) {
        setShowTravelerSelector(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get total traveler count
  const totalTravelers = travelers.reduce((sum, traveler) => sum + traveler.count, 0)

  // Update traveler count
  const updateTravelerCount = (type: string, increment: boolean) => {
    setTravelers((prev) =>
      prev.map((traveler) =>
        traveler.type === type
          ? { ...traveler, count: increment ? traveler.count + 1 : Math.max(0, traveler.count - 1) }
          : traveler,
      ),
    )
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Search submitted:", { fromLocation, toLocation, travelers })
  }

  return (
    <div className={cn("relative", className)} style={{ zIndex: 9999 }}>
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

          {/* Travelers Selector */}
          <div className="relative flex items-center p-2 pr-3">
            <Users className="h-5 w-5 text-white mr-2" />
            <div className="text-left">
              <label htmlFor="desktop-travelers" className="block text-white/80 text-xs">
                Travelers
              </label>
              <button
                type="button"
                onClick={() => setShowTravelerSelector(!showTravelerSelector)}
                className="bg-transparent border-none text-white text-sm font-medium focus:outline-none flex items-center"
              >
                {totalTravelers === 0 ? "Add guests" : `${totalTravelers} guest${totalTravelers !== 1 ? "s" : ""}`}
                <ChevronDown className="ml-1 h-3 w-3" />
              </button>

              {/* Traveler Selector Dropdown */}
              {showTravelerSelector && (
                <div
                  ref={travelerSelectorRef}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg p-4 w-72"
                  style={{ zIndex: 9999 }}
                >
                  {travelers.map((traveler) => (
                    <div key={traveler.type} className="py-4 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-gray-800">{traveler.label}</h3>
                          <p className="text-sm text-gray-500">{traveler.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => updateTravelerCount(traveler.type, false)}
                            className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center ${
                              traveler.count === 0
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-gray-700 hover:border-gray-500"
                            }`}
                            disabled={traveler.count === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-5 text-center">{traveler.count}</span>
                          <button
                            type="button"
                            onClick={() => updateTravelerCount(traveler.type, true)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 hover:border-gray-500"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Special note for pets */}
                      {traveler.type === "pets" && traveler.count > 0 && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center">
                          <PawPrint className="h-3 w-3 mr-1" />
                          We'll help you find pet-friendly accommodations
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className="bg-[#FF6B98] hover:bg-[#FF5A8B] text-white rounded-full p-3 transition-all hover:scale-105"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
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
                    {totalTravelers === 0 ? "Add guests" : `${totalTravelers} guest${totalTravelers !== 1 ? "s" : ""}`}
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
              <div className="p-3 pt-0 space-y-4">
                {travelers.map((traveler) => (
                  <div key={traveler.type} className="bg-white/20 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-white">{traveler.label}</h3>
                        <p className="text-xs text-white/80">{traveler.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateTravelerCount(traveler.type, false)}
                          className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ${
                            traveler.count === 0 ? "text-white/40 cursor-not-allowed" : "text-white hover:bg-white/30"
                          }`}
                          disabled={traveler.count === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-5 text-center text-white">{traveler.count}</span>
                        <button
                          type="button"
                          onClick={() => updateTravelerCount(traveler.type, true)}
                          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Button - Always visible */}
          <div className="p-3">
            <Button
              type="submit"
              className="w-full bg-[#FF6B98] hover:bg-[#FF5A8B] text-white rounded-full py-3 flex items-center justify-center transition-all"
            >
              <Search className="h-5 w-5 mr-2" />
              <span className="font-medium">Search Adventures</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default SearchForm

