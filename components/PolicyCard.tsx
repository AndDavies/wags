import Link from "next/link"
import { ArrowRight, Airplay, FileTextIcon } from "lucide-react"
import React from "react"

// Displays Airline and Country policies side-by-side, styled like GetInspired/ChatWithBaggo
export default function PolicyCard() {
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
    buttonText: "Explore Country Policies",
    buttonLink: "/directory/policies",
    iconBgColor: "bg-mustard-100",
    iconTextColor: "text-mustard-600",
  };

  // Renders one side of the policy card
  const renderPolicySection = (content: typeof airlineContent | typeof countryContent) => (
    // Use flex-1 to allow columns to grow, adjust padding
    <div className="flex flex-col items-start w-full flex-1 p-4 md:p-8">
      {/* Icon remains centered above text */}      
      <div className="flex justify-center w-full mb-6">
        <div className={`rounded-full p-4 w-24 h-24 flex items-center justify-center ${content.iconBgColor}`}>
          <content.IconComponent className={`w-12 h-12 ${content.iconTextColor}`} />
        </div>
      </div>

      {/* Left-aligned text content */}      
      <div className="w-full text-left">
        {/* Adjusted title size, weight, color, and alignment */}
        <h2 className="text-3xl font-bold text-black mb-6 text-left leading-tight">{content.title}</h2>

        {/* Adjusted subheading styles, left-aligned */}        
        <h3 className="text-xl font-semibold text-black mb-2 text-left">What You&apos;ll Find</h3>
        {/* Adjusted list styles, left-aligned */}
        <ul className="list-disc list-outside pl-5 mb-6 text-gray-700 text-base">
          {content.bulletPoints.map((point, index) => (
            <li key={index} className="mb-1">
              {point}
            </li>
          ))}
        </ul>

        {/* Adjusted subheading styles, left-aligned */}        
        <h3 className="text-xl font-semibold text-black mb-2 text-left">How This Helps Your Journey</h3>
        {/* Adjusted list styles, left-aligned */}
        <ol className="list-decimal list-outside pl-5 mb-8 text-gray-700 text-base">
          {content.helpPoints.map((point, index) => (
            <li key={index} className="mb-1">
              {point}
            </li>
          ))}
        </ol>

        {/* Adjusted button padding, remains centered below text block */}        
        <div className="text-center mt-4">
          <Link
            href={content.buttonLink}
            className="inline-flex items-center justify-center gap-2 bg-teal-500 text-white font-medium py-3 px-8 rounded-lg hover:bg-teal-600 transition-colors shadow hover:shadow-md"
            aria-label={`${content.buttonText}`}
          >
            {content.buttonText}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    // Main container - white background, shadow, standard padding
    <div className="flex flex-col md:flex-row gap-8 justify-center p-8 md:p-12 font-sans tracking-tight bg-white shadow-md">
      {renderPolicySection(airlineContent)}
      
      {/* Vertical Divider for medium screens and up */}      
      <div className="hidden md:block border-l border-gray-200"></div>

      {renderPolicySection(countryContent)}
    </div>
  )
}
