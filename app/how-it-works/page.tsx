import type React from "react"
import {
  Rocket,
  Globe,
  CheckIcon as Checklist,
  Calendar,
  Users,
  Plane,
  CheckCircle,
  MapPin,
  Dog,
  AlertCircle,
} from "lucide-react"

const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-8">How It Works – Travel Smart with Wags and Wanders</h1>

      <p className="text-lg mb-8">
        Wags and Wanders is your AI-powered pet travel companion, designed to eliminate stress, confusion, and
        last-minute surprises. Our intuitive platform guides you through every step of traveling with your pet—whether
        you're flying internationally, crossing borders, or planning a road trip.
      </p>

      <div className="space-y-12">
        {[
          {
            icon: <Rocket className="w-10 h-10 text-blue-500" />,
            title: "Step 1: Enter Your Trip Details",
            content: (
              <>
                <p className="mb-4">Tell us where you're traveling! Simply input:</p>
                <ul className="space-y-2">
                  {[
                    "Origin & Destination (city, country, airline)",
                    "Your Pet's Details (species, breed, weight, vaccination status)",
                    "Travel Date & Mode (flight, train, car, ferry)",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <Globe className="inline-block mr-2 h-5 w-5 text-blue-500" />
                  Our AI instantly scans airline, country, and transit policies to generate a customized travel plan for
                  your pet.
                </p>
              </>
            ),
          },
          {
            icon: <Checklist className="w-10 h-10 text-blue-500" />,
            title: "Step 2: Get a Personalized Pet Travel Checklist",
            content: (
              <>
                <p className="mb-4">We provide clear, step-by-step guidance based on:</p>
                <ul className="space-y-2">
                  {[
                    "Vaccination & Health Requirements (Rabies, CFIA, USDA, EU Pet Passport, etc.)",
                    "Airline & Country Regulations (Cabin, cargo, breed restrictions, documentation)",
                    "Quarantine Rules & Exemptions (Hawaii, UK, Australia, Asia-Pacific)",
                    "Airport & Transit Guidelines (Layovers, pet relief areas, customs procedures)",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <MapPin className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <AlertCircle className="inline-block mr-2 h-5 w-5 text-yellow-500" />
                  No more scrambling through outdated airline websites—we handle the research for you!
                </p>
              </>
            ),
          },
          {
            icon: <Calendar className="w-10 h-10 text-blue-500" />,
            title: "Step 3: Track Your Pet's Travel Timeline",
            content: (
              <>
                <p className="mb-4">Our automated reminders ensure you never miss a step:</p>
                <ul className="space-y-2">
                  {[
                    "When to book vet visits for health certificates & vaccinations",
                    "Deadlines for submitting airline paperwork",
                    "Final checks before departure",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <Dog className="inline-block mr-2 h-5 w-5 text-green-500" />
                  Stay on track with real-time updates & alerts right on your phone.
                </p>
              </>
            ),
          },
          {
            icon: <Users className="w-10 h-10 text-blue-500" />,
            title: "Step 4: Learn from Real Pet Travelers",
            content: (
              <>
                <ul className="space-y-2">
                  {[
                    "Join a global community of pet owners sharing their experiences, travel hacks, and airline reviews.",
                    "Find pet-friendly hotels, cafes, and vets recommended by fellow travelers.",
                    "Get real-time updates on changing policies from other pet parents.",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <Users className="inline-block mr-2 h-5 w-5 text-blue-500" />
                  Because the best travel advice comes from those who've been there!
                </p>
              </>
            ),
          },
          {
            icon: <Plane className="w-10 h-10 text-blue-500" />,
            title: "Step 5: Enjoy a Stress-Free Journey!",
            content: (
              <>
                <p className="mb-4">
                  With Wags and Wanders, you're never caught off guard. Our AI-powered platform ensures:
                </p>
                <ul className="space-y-2">
                  {[
                    "No last-minute check-in disasters",
                    "No confusion over missing paperwork",
                    "No costly mistakes that delay or ruin your trip",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4">
                  <Dog className="inline-block mr-2 h-5 w-5 text-green-500" />
                  Travel confidently with your pet—because every journey is better together.
                </p>
              </>
            ),
          },
        ].map((step, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">{step.icon}</div>
            <div>
              <h2 className="text-2xl font-semibold mb-4">{step.title}</h2>
              {step.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-xl font-semibold mb-4">
          <Rocket className="inline-block mr-2 h-6 w-6 text-blue-500" />
          Ready to plan your pet's next adventure? Let's get started!
        </p>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Start Planning</button>
      </div>
    </div>
  )
}

export default HowItWorks

