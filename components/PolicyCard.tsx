import Link from "next/link"
import { ArrowRight, Airplay, FileTextIcon } from "lucide-react"
import React from "react"

// This component now displays both Airline and Country policies side-by-side.
// It no longer takes props for variant or content.
export default function PolicyCard() {
  // Define content directly within the component
  const airlineContent = {
    title: "Airline Policies",
    IconComponent: Airplay,
    bulletPoints: [
      "Cabin and cargo policies",
      "Breed and size restrictions",
      "Pet travel fees and requirements",
    ],
    helpPoints: [
      "Compare pet policies for 100+ airlines",
      "Find carriers that welcome your pet's breed",
      "Plan for size, weight, and travel comfort",
    ],
    buttonText: "Explore Airline Policies",
    buttonLink: "/directory/airlines",
    iconBgColor: "bg-teal-100",
    iconTextColor: "text-teal-600",
  };

  const countryContent = {
    title: "Country Entry Policies",
    IconComponent: FileTextIcon,
    bulletPoints: [
      "Vaccination and health requirements",
      "Quarantine rules and durations",
      "Essential paperwork and permits",
    ],
    helpPoints: [
      "Navigate entry rules for 190+ countries",
      "Prepare for quarantine or health checks",
      "Build a checklist for smooth border crossings",
    ],
    buttonText: "Explore Country Policies", // Updated button text based on image
    buttonLink: "/directory/policies",
    iconBgColor: "bg-pink-100",
    iconTextColor: "text-pink-600",
  };

  // Helper function to render a policy section
  const renderPolicySection = (content: typeof airlineContent) => (
    <div className="flex flex-col items-center w-full">
      {/* Render Lucide Icon */}
      <div className={`rounded-full p-6 w-40 h-40 flex items-center justify-center mb-6 ${content.iconBgColor}`}>
        <content.IconComponent className={`w-20 h-20 ${content.iconTextColor}`} />
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-black mb-6 text-center leading-tight">{content.title}</h2>

      <div className="w-full max-w-md">
        <h3 className="text-xl font-bold text-gray-800 mb-2">What You&apos;ll Find</h3>
        <ul className="list-disc pl-6 mb-6 text-gray-700">
          {content.bulletPoints.map((point, index) => (
            <li key={index} className="mb-1">
              {point}
            </li>
          ))}
        </ul>

        <h3 className="text-xl font-bold text-gray-800 mb-2">How This Helps Your Journey</h3>
        <ol className="list-decimal pl-6 mb-8 text-gray-700">
          {content.helpPoints.map((point, index) => (
            <li key={index} className="mb-1">
              {point}
            </li>
          ))}
        </ol>

        <Link
          href={content.buttonLink}
          className="flex items-center justify-center gap-2 bg-teal-500 text-white font-medium py-3 px-6 rounded-lg text-center hover:bg-teal-600 transition-colors w-full"
        >
          {content.buttonText}
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );

  return (
    // Main container for side-by-side layout
    <div className="flex flex-col md:flex-row gap-8 lg:gap-16 justify-center p-6 md:p-8 font-sans tracking-tight bg-[#bdb5ef] rounded-lg shadow border border-gray-200">
      {/* Airline Policies Section */}
      {renderPolicySection(airlineContent)}
      
      {/* Country Policies Section */}
      {renderPolicySection(countryContent)}
    </div>
  )
}
