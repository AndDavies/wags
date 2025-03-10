"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Hotel, FileText, ArrowRight, Search, MapPin, CheckCircle, Globe } from "lucide-react"

const FeaturedDirectory = () => {
  const [activeTab, setActiveTab] = useState<string>("airlines")

  const directories = [
    {
      id: "airlines",
      title: "Pet-Friendly Airlines",
      description: "Comprehensive guide to airline policies for pet travel.",
      icon: <Plane className="h-8 w-8 text-brand-teal" />,
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
      icon: <Hotel className="h-8 w-8 text-brand-teal" />,
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
      icon: <FileText className="h-8 w-8 text-brand-teal" />,
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
  ]

  const activeDirectory = directories.find((dir) => dir.id === activeTab) || directories[0]

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <section className="py-16 bg-brand-pink">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2
            className="text-4xl md:text-5xl font-display text-brand-teal mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Pet Travel Resource Hub
          </motion.h2>
          <motion.p
            className="text-center text-offblack mb-6 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Plan your journey with confidence using our comprehensive directories covering every aspect of pet travel.
          </motion.p>

          {/* Directory Tabs */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {directories.map((dir) => (
              <button
                key={dir.id}
                onClick={() => setActiveTab(dir.id)}
                className={`px-6 py-3 rounded-full text-sm md:text-base font-medium transition-all duration-300 flex items-center gap-2
                  ${
                    activeTab === dir.id
                      ? "bg-brand-teal text-white shadow-md"
                      : "bg-white text-offblack hover:bg-brand-teal/10"
                  }`}
              >
                {dir.id === "airlines" && <Plane className="h-4 w-4" />}
                {dir.id === "hotels" && <Hotel className="h-4 w-4" />}
                {dir.id === "policies" && <FileText className="h-4 w-4" />}
                {dir.title}
              </button>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Featured Directory Content */}
          <motion.div
            key={activeDirectory.id}
            initial="hidden"
            whileInView="visible"
            variants={fadeIn}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-teal rounded-full text-white">{activeDirectory.icon}</div>
              <h3 className="text-2xl md:text-3xl font-bold text-brand-teal">{activeDirectory.title}</h3>
            </div>

            <p className="text-lg text-offblack">{activeDirectory.description}</p>

            <div className="bg-white p-5 rounded-xl shadow-md">
              <h4 className="font-semibold text-brand-teal mb-3 flex items-center gap-2">
                <Search className="h-5 w-5" />
                What You'll Find
              </h4>
              <ul className="space-y-2">
                {activeDirectory.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-offblack">
                    <ArrowRight className="h-4 w-4 mr-2 text-brand-teal flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-md">
              <h4 className="font-semibold text-brand-teal mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                How This Helps Your Journey
              </h4>
              <ul className="space-y-3">
                {activeDirectory.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start text-offblack">
                    <span className="bg-brand-pink/40 text-brand-teal rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-brand-teal" />
                <span className="text-lg font-semibold text-brand-teal">{activeDirectory.stats}</span>
              </div>
              <Button asChild className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
                <Link href={activeDirectory.link} className="flex items-center gap-2">
                  Explore Directory
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Featured Image */}
          <motion.div
            key={`image-${activeDirectory.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src={activeDirectory.image || "/placeholder.svg"}
                alt={activeDirectory.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5" />
                    <span className="font-medium">Directory Highlight</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {activeDirectory.id === "airlines" && "Find the perfect airline for your pet's journey"}
                    {activeDirectory.id === "hotels" && "Discover pet-friendly stays around the world"}
                    {activeDirectory.id === "policies" && "Navigate country requirements with confidence"}
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Stats */}
            <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 flex items-center gap-3">
              <div className="bg-brand-pink rounded-full p-2">{activeDirectory.icon}</div>
              <div>
                <p className="text-xs text-offblack/70">Our Directory Includes</p>
                <p className="text-lg font-bold text-brand-teal">{activeDirectory.stats}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* All Directories Cards - Mobile View */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 lg:hidden">
          {directories.map((directory, index) => (
            <Card
              key={index}
              className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg bg-white"
            >
              <div className="relative h-40">
                <Image
                  src={directory.image || "/placeholder.svg"}
                  alt={directory.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-brand-teal bg-opacity-40 flex items-center justify-center">
                  {directory.icon}
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-brand-teal">{directory.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-offblack mb-4">{directory.description}</p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
                  <Link href={directory.link}>Explore {directory.title}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-2xl md:text-3xl font-display text-brand-teal mb-4">Ready to Plan Your Pet's Journey?</h3>
          <p className="text-offblack mb-6 max-w-2xl mx-auto">
            Our comprehensive directories provide everything you need to plan a stress-free travel experience with your
            pet.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack px-8 py-6 text-lg"
          >
            <Link href="/directory">Explore All Directories</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

export default FeaturedDirectory

