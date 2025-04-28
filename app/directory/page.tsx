"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
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
  ChevronRight,
  Star,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DirectoryHomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCategory, setSearchCategory] = useState("all")
  const [activeCategory, setActiveCategory] = useState("airlines")
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [])

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
    }
  ]

  const featuredDestinations = [
    {
      name: "United States",
      image: "/placeholders/usa.png",
      count: "50+ Policies",
      rating: 4.8,
      reviews: 124,
      tags: ["No Quarantine", "Easy Entry"],
    },
    {
      name: "United Kingdom",
      image: "/placeholders/uk.png",
      count: "25+ Policies",
      rating: 4.6,
      reviews: 98,
      tags: ["Pet Passport", "No Quarantine"],
    },
    {
      name: "Australia",
      image: "/placeholders/australia.png",
      count: "30+ Policies",
      rating: 4.2,
      reviews: 87,
      tags: ["Strict Requirements", "Quarantine"],
    },
    {
      name: "Canada",
      image: "/placeholders/canada.png",
      count: "40+ Policies",
      rating: 4.9,
      reviews: 156,
      tags: ["Easy Entry", "Pet Friendly"],
    },
  ]

  const popularSearches = ["Dog-friendly airlines", "No quarantine countries", "EU pet passport", "Pet hotels in NYC"]

  const fadeInUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  }

  const staggerContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-brand-pink/20 to-white pt-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#249ab4] to-[#249ab4]/80 py-20 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-white drop-shadow-lg">Pet Travel Directory</h1>
            <p className="mb-8 text-lg text-white/90 md:text-xl">
              Your comprehensive resource for pet-friendly travel information worldwide.
            </p>

            <div className="relative mx-auto max-w-2xl">
              <div className="flex overflow-hidden rounded-full bg-white/10 backdrop-blur-md p-1.5">
                <div className="relative flex-grow">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
                  <input
                    type="text"
                    placeholder="Search airlines, hotels, or countries..."
                    className="w-full rounded-full border-none bg-white/10 py-3 pl-12 pr-4 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="ml-2 hidden md:block">
                  <Select value={searchCategory} onValueChange={setSearchCategory}>
                    <SelectTrigger className="w-[180px] border-none bg-white/10 text-white focus:ring-2 focus:ring-white/30 focus:outline-none h-[46px]">
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

                <Button className="ml-2 bg-white text-[#249ab4] hover:bg-white/90">Search</Button>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-sm text-white/80">Popular:</span>
                {popularSearches.map((term, index) => (
                  <button
                    key={index}
                    className="text-sm text-white/90 hover:text-white hover:underline transition-colors"
                    onClick={() => setSearchQuery(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Main Directory Categories */}
        <div className="mb-20" ref={sectionRef}>
          <div className="flex flex-col items-center justify-center mb-12 text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="h-px w-12 bg-gray-200"></div>
              <span className="px-4 text-sm text-gray-500 font-medium">EXPLORE DIRECTORIES</span>
              <div className="h-px w-12 bg-gray-200"></div>
            </div>
            <h2 className="text-3xl font-bold text-[#249ab4] mb-4">Browse Our Pet Travel Resources</h2>
            <p className="text-gray-600 max-w-2xl">
              Comprehensive directories to help you plan every aspect of traveling with your pet companion.
            </p>
          </div>

          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mainDirectories.map((directory, index) => (
              <motion.div key={index} variants={fadeInUpVariants} custom={index}>
                <Link href={directory.href}>
                  <Card
                    className={`h-full border-2 hover:shadow-lg transition-all ${directory.color} group overflow-hidden`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-3 rounded-full bg-white ${directory.iconColor} transform transition-transform group-hover:scale-110`}
                        >
                          <directory.icon className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">{directory.count}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-[#249ab4] transition-colors">
                        {directory.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{directory.description}</p>
                      <div className="flex items-center text-brand-teal font-medium group-hover:translate-x-1 transition-transform">
                        Explore <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Featured Destinations */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-[#249ab4] mb-2">Popular Destinations</h2>
              <p className="text-gray-600">Top destinations for pet travelers based on our community</p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="mr-1 h-4 w-4" /> Based on recent searches
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredDestinations.map((destination, index) => (
              <Link key={index} href={`/directory/policies/${destination.name.toLowerCase().replace(" ", "-")}`}>
                <div className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={destination.image || "/placeholder.svg"}
                      alt={destination.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-xl mb-1">{destination.name}</h3>
                      <div className="flex items-center text-white/90 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 stroke-yellow-400 mr-1" />
                        <span>{destination.rating}</span>
                        <span className="mx-1">•</span>
                        <span>{destination.reviews} reviews</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-grow">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {destination.tags.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm">{destination.count}</p>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[#249ab4]">View details</span>
                      <div className="h-8 w-8 rounded-full bg-[#249ab4]/10 flex items-center justify-center text-[#249ab4] transform transition-transform group-hover:translate-x-1">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="border-[#249ab4] text-[#249ab4] hover:bg-[#249ab4]/5">
              <Link href="/directory/policies">
                View All Destinations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>


        {/* Call to Action */}
        <div className="rounded-2xl bg-gradient-to-r from-[#249ab4] to-[#249ab4]/80 p-12 text-white text-center mb-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Travel with Your Pet?</h2>
            <p className="text-white/90 mb-8 text-lg">
              Create a personalized travel plan with all the information you need for a stress-free journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-white text-[#249ab4] hover:bg-white/90">
                <Link href="/create-trip">Create Your Pet Travel Plan</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#249ab4] mb-4">What Pet Travelers Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from our community of pet owners who have successfully traveled with their furry companions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "The airline directory saved us so much time researching pet policies. We found the perfect flight for our corgi!",
                author: "Sarah M.",
                location: "Boston, MA",
                image: "/placeholders/user1.png",
              },
              {
                quote:
                  "I was worried about quarantine requirements, but the country policies section made everything clear. My cat and I had a smooth journey to Portugal.",
                author: "James L.",
                location: "Chicago, IL",
                image: "/placeholders/user2.png",
              },
              {
                quote:
                  "Finding pet-friendly hotels used to be a nightmare. Now I can see all options in one place with real reviews from other pet parents.",
                author: "Emma K.",
                location: "Seattle, WA",
                image: "/placeholders/user1.png",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-white border border-gray-100 hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative h-12 w-12 flex-shrink-0">
                      <Image
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.author}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{testimonial.author}</h4>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 italic">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <h3 className="text-xl font-bold text-[#249ab4] mb-2">Stay Updated</h3>
              <p className="text-gray-600 mb-4">
                Get the latest pet travel tips, destination guides, and policy updates delivered to your inbox.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-grow rounded-l-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#249ab4]"
                />
                <Button className="rounded-l-none bg-[#249ab4] hover:bg-[#249ab4]/90">Subscribe</Button>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-[#249ab4]">100+</div>
                  <div className="text-sm text-gray-600">Airlines</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-[#249ab4]">1,000+</div>
                  <div className="text-sm text-gray-600">Hotels</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-[#249ab4]">190+</div>
                  <div className="text-sm text-gray-600">Countries</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
