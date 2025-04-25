"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Airplay,
  BedIcon,
  FileTextIcon,
  ArrowRight,
  Search,
  MapPin,
  Globe,
  Filter,
  TrendingUp,
  MapIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DirectoryHomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCategory, setSearchCategory] = useState("all")

  const mainDirectories = [
    {
      href: "/directory/airlines",
      icon: Airplay,
      title: "Airlines",
      description: "Find pet-friendly airlines for your journey",
      count: "100+ Airlines",
      color: "bg-[#93dcec]/20 border-[#93dcec]",
      iconColor: "text-[#249ab4]",
    },
    {
      href: "/directory/hotels",
      icon: BedIcon,
      title: "Hotels",
      description: "Discover accommodations that welcome your furry friends",
      count: "1,000+ Hotels",
      color: "bg-[#9fc7aa]/20 border-[#9fc7aa]",
      iconColor: "text-[#9fc7aa]",
    },
    {
      href: "/directory/policies",
      icon: FileTextIcon,
      title: "Policies",
      description: "Learn about pet travel regulations and guidelines",
      count: "190+ Countries",
      color: "bg-[#fddada]/20 border-[#fddada]",
      iconColor: "text-[#FFA9DE]",
    },
    {
      href: "/directory/activities",
      icon: MapIcon,
      title: "Activities",
      description: "Explore pet-friendly activities and attractions",
      count: "500+ Activities",
      color: "bg-[#FFA9DE]/20 border-[#FFA9DE]",
      iconColor: "text-[#493f40]",
    },
  ]

  const featuredDestinations = [
    { name: "United States", image: "/placeholders/usa.png", count: "50+ Policies" },
    { name: "United Kingdom", image: "/placeholders/uk.png", count: "25+ Policies" },
    { name: "Australia", image: "/placeholders/australia.png", count: "30+ Policies" },
    { name: "Canada", image: "/placeholders/canada.png", count: "40+ Policies" },
  ]

  const popularSearches = ["Dog-friendly airlines", "No quarantine countries", "EU pet passport", "Pet hotels in NYC"]

  return (
    <div className="min-h-screen bg-gradient-to-t from-brand-pink/20 to-white">
      <div className="container mx-auto px-4">
        {/* Search Section */}
        <div className="relative mb-12 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#93dcec]/10 to-[#FFA9DE]/10 z-0"></div>
          <div className="relative z-10 p-8 md:p-10">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#249ab4] mb-4">Pet Travel Directory</h1>
              <p className="text-lg text-[#493f40] mb-6">
                Your comprehensive resource for pet-friendly travel information worldwide.
              </p>
              <div className="h-1 w-20 bg-[#FFA9DE] mx-auto mb-6"></div>
              <p className="text-[#493f40]">
                Search our extensive database of airlines, accommodations, country policies, and activities that welcome
                your furry companions.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 max-w-3xl mx-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search airlines, hotels, or countries..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#249ab4]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="relative w-full md:w-[220px]">
                <Select value={searchCategory} onValueChange={setSearchCategory}>
                  <SelectTrigger className="w-full bg-white border border-gray-300 h-[46px] focus:ring-2 focus:ring-[#249ab4] focus:outline-none">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>All Categories</span>
                    </SelectItem>
                    <SelectItem value="airlines" className="flex items-center gap-2">
                      <Airplay className="h-4 w-4" />
                      <span>Airlines</span>
                    </SelectItem>
                    <SelectItem value="hotels" className="flex items-center gap-2">
                      <BedIcon className="h-4 w-4" />
                      <span>Hotels</span>
                    </SelectItem>
                    <SelectItem value="policies" className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4" />
                      <span>Country Policies</span>
                    </SelectItem>
                    <SelectItem value="activities" className="flex items-center gap-2">
                      <MapIcon className="h-4 w-4" />
                      <span>Pet Activities</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="bg-[#249ab4] hover:bg-[#249ab4]/90 text-white py-3 px-6">Search</Button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-[#493f40]">Popular searches:</span>
              {popularSearches.map((term, index) => (
                <button
                  key={index}
                  className="text-sm text-[#249ab4] hover:underline"
                  onClick={() => setSearchQuery(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Directory Categories */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#249ab4] mb-6">Browse Directories</h2>
            <Link
              href="/directory/all"
              className="text-[#249ab4] hover:text-[#FFA9DE] hover:underline flex items-center"
            >
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mainDirectories.map((directory, index) => (
              <Link key={index} href={directory.href}>
                <Card className={`h-full border-2 hover:shadow-lg transition-all ${directory.color}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-full bg-white ${directory.iconColor}`}>
                        <directory.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium text-gray-500">{directory.count}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{directory.title}</h3>
                    <p className="text-gray-600 mb-4">{directory.description}</p>
                    <div className="flex items-center text-brand-teal font-medium">
                      Explore <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Destinations */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#249ab4] mb-6">Popular Destinations</h2>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="mr-1 h-4 w-4" /> Based on recent searches
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredDestinations.map((destination, index) => (
              <Link key={index} href={`/directory/policies/${destination.name.toLowerCase().replace(" ", "-")}`}>
                <div className="relative rounded-lg overflow-hidden group h-48">
                  <Image
                    src={destination.image || "/placeholder.svg"}
                    alt={destination.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-white font-bold">{destination.name}</h3>
                    <p className="text-white/80 text-sm">{destination.count}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links & Resources */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-16">
          <h2 className="text-xl font-bold text-[#249ab4] mb-4">Quick Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="p-2 bg-[#93dcec]/20 rounded-full mr-3">
                <Globe className="h-5 w-5 text-[#249ab4]" />
              </div>
              <div>
                <h3 className="font-medium mb-1">International Travel</h3>
                <p className="text-sm text-[#493f40] mb-2">Learn about pet passports and international requirements</p>
                <Link href="/blog/international-pet-travel" className="text-sm text-[#249ab4] hover:underline">
                  Read guide
                </Link>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-2 bg-[#9fc7aa]/20 rounded-full mr-3">
                <Filter className="h-5 w-5 text-[#9fc7aa]" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Compare Airlines</h3>
                <p className="text-sm text-[#493f40] mb-2">Side-by-side comparison of pet policies</p>
                <Link href="/directory/airlines/compare" className="text-sm text-[#249ab4] hover:underline">
                  Compare now
                </Link>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-2 bg-[#fddada]/20 rounded-full mr-3">
                <MapPin className="h-5 w-5 text-[#FFA9DE]" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Plan Your Trip</h3>
                <p className="text-sm text-[#493f40] mb-2">Create a custom itinerary with your pet</p>
                <Link href="/create-trip" className="text-sm text-[#249ab4] hover:underline">
                  Start planning
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-[#249ab4] mb-4">Ready to Travel with Your Pet?</h2>
          <p className="text-[#493f40] mb-6 max-w-2xl mx-auto">
            Create a personalized travel plan with all the information you need for a stress-free journey.
          </p>
          <Button asChild className="bg-[#249ab4] hover:bg-[#FFA9DE] text-white hover:text-[#493f40] px-8 py-3">
            <Link href="/create-trip">Create Your Pet Travel Plan</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

