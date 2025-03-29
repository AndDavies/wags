"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Hotel, FileText, Compass, ArrowRight, Search, CheckCircle, Globe, ChevronRight } from "lucide-react"

const FeaturedDirectory = () => {
  const [activeTab, setActiveTab] = useState<string>("airlines")

  const directories = [
    {
      id: "airlines",
      title: "Pet-Friendly Airlines",
      description: "Comprehensive guide to airline policies for pet travel.",
      icon: <Plane className="h-6 w-6 text-[#249ab4]" />,
      image: "/placeholders/Pet_Friendly_Airlines.png",
      link: "/directory/airlines",
      features: ["Cabin policies", "Cargo regulations", "Breed restrictions"],
      benefits: [
        "Compare pet policies across 100+ airlines",
        "Find airlines that allow your pet's breed",
        "Understand size and weight restrictions",
      ],
      stats: "100+ Airlines",
    },
    {
      id: "hotels",
      title: "Pet-Friendly Hotels",
      description: "Find accommodations that welcome your furry companions.",
      icon: <Hotel className="h-6 w-6 text-[#249ab4]" />,
      image: "/placeholders/Pet_Friendly_Hotels.png",
      link: "/directory/hotels",
      features: ["Pet amenities", "Size restrictions", "Additional fees"],
      benefits: [
        "Discover hotels with special pet amenities",
        "Filter by pet size allowances",
        "Compare pet fees before booking",
      ],
      stats: "1,000+ Hotels",
    },
    {
      id: "policies",
      title: "Country Import Policies",
      description: "Navigate international pet travel requirements with ease.",
      icon: <FileText className="h-6 w-6 text-[#249ab4]" />,
      image: "/placeholders/Pet_Travel_Policies.png",
      link: "/directory/policies",
      features: ["Vaccination requirements", "Quarantine info", "Necessary paperwork"],
      benefits: [
        "Understand entry requirements for 190+ countries",
        "Plan ahead for quarantine periods",
        "Create a checklist of required documents",
      ],
      stats: "190+ Countries",
    },
    {
      id: "activities",
      title: "Pet-Friendly Activities",
      description: "Discover experiences you can enjoy together with your pet.",
      icon: <Compass className="h-6 w-6 text-[#249ab4]" />,
      image: "/placeholder.svg?height=400&width=600",
      link: "/directory/activities",
      features: ["Parks & trails", "Outdoor dining", "Tourist attractions"],
      benefits: [
        "Find activities where pets are welcome",
        "Discover pet-friendly beaches and parks",
        "Plan your itinerary with your pet in mind",
      ],
      stats: "500+ Activities",
    },
  ]

  const activeDirectory = directories.find((dir) => dir.id === activeTab) || directories[0]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Travel Resources</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive directories to help you plan every aspect of traveling with your pet.
          </p>
        </div>

        {/* Directory Cards - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {directories.map((directory) => (
            <Card
              key={directory.id}
              className={`overflow-hidden transition-all duration-300 hover:shadow-md border border-gray-100 ${
                activeTab === directory.id ? "ring-2 ring-[#249ab4] ring-opacity-50" : ""
              }`}
              onClick={() => setActiveTab(directory.id)}
            >
              <div className="relative h-40 bg-gray-50">
                <Image
                  src={directory.image || "/placeholder.svg"}
                  alt={directory.title}
                  fill
                  className="object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end">
                  <div className="p-4 text-white">
                    <p className="text-sm font-medium">{directory.stats}</p>
                  </div>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gray-50 rounded-md text-[#249ab4]">{directory.icon}</div>
                  <CardTitle className="text-lg font-semibold text-gray-900">{directory.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-gray-600 text-sm mb-3">{directory.description}</p>
                <div className="flex items-center text-xs text-[#249ab4] font-medium">
                  <span>View directory</span>
                  <ChevronRight className="h-3 w-3 ml-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected Directory Details */}
        <div className="bg-gray-50 rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Featured Image */}
            <div className="relative h-[300px] lg:h-auto order-1 lg:order-2">
              <Image
                src={activeDirectory.image || "/placeholder.svg"}
                alt={activeDirectory.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 via-gray-900/40 to-transparent lg:bg-gradient-to-l flex items-center lg:items-start justify-center lg:justify-end">
                <div className="p-8 text-white lg:max-w-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 backdrop-blur-sm rounded-md">{activeDirectory.icon}</div>
                    <h3 className="text-2xl font-bold">{activeDirectory.title}</h3>
                  </div>
                  <p className="mb-6 text-white/90">{activeDirectory.description}</p>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#249ab4]" />
                    <span className="font-medium text-white">{activeDirectory.stats}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Directory Content */}
            <div className="p-8 order-2 lg:order-1">
              <div className="space-y-6 max-w-lg">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-[#249ab4]" />
                    What You'll Find
                  </h4>
                  <ul className="space-y-3">
                    {activeDirectory.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#249ab4] mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#249ab4]" />
                    How This Helps Your Journey
                  </h4>
                  <ul className="space-y-4">
                    {activeDirectory.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="flex items-center justify-center h-5 w-5 rounded-full border border-[#249ab4] text-[#249ab4] text-xs font-bold mr-3 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button asChild className="mt-6 bg-[#249ab4] hover:bg-[#1c7a8f] text-white rounded-md">
                  <Link href={activeDirectory.link} className="flex items-center gap-2">
                    Explore {activeDirectory.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="h-px w-12 bg-gray-200"></div>
            <span className="px-4 text-sm text-gray-500 font-medium">EXPLORE MORE</span>
            <div className="h-px w-12 bg-gray-200"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to plan your journey?</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our comprehensive directories provide everything you need for a stress-free travel experience with your pet.
          </p>
          <Button asChild className="bg-[#249ab4] hover:bg-[#1c7a8f] text-white px-6 py-2.5 rounded-md">
            <Link href="/directory">View All Directories</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedDirectory

