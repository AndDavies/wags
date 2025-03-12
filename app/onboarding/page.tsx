"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { PawPrint, ChevronRight, MapPin, Plane, Calendar, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      router.push("/profile")
    }
  }

  const handleSkip = () => {
    router.push("/profile")
  }

  const steps = [
    {
      title: "Welcome to Wags & Wanders!",
      description: "We're excited to help you plan amazing adventures with your pet. Let's get your account set up.",
      icon: <PawPrint className="h-8 w-8 text-white" />,
    },
    {
      title: "Tell Us About Your Pet",
      description: "Add information about your furry travel companion to personalize your experience.",
      icon: <PawPrint className="h-8 w-8 text-white" />,
    },
    {
      title: "Travel Preferences",
      description: "Let us know your travel style and preferences to provide tailored recommendations.",
      icon: <Plane className="h-8 w-8 text-white" />,
    },
    {
      title: "You're All Set!",
      description: "Your profile is ready. Start exploring pet-friendly destinations and planning your next adventure.",
      icon: <Check className="h-8 w-8 text-white" />,
    },
  ]

  const currentStepData = steps[currentStep - 1]

  return (
    <div className="min-h-screen bg-gradient-to-r from-brand-teal/10 to-brand-pink/10 flex items-center justify-center py-12 px-4">
      <Card className="max-w-3xl w-full border-none shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left side - Image */}
            <div className="relative h-64 md:h-auto bg-brand-teal">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-teal to-brand-teal/80"></div>
              <div className="relative h-full flex flex-col items-center justify-center text-white p-8">
                <div className="bg-white/20 rounded-full p-4 mb-6">{currentStepData.icon}</div>
                <h2 className="text-2xl font-display text-center mb-4">{currentStepData.title}</h2>
                <p className="text-white/90 text-center text-sm">{currentStepData.description}</p>

                {/* Progress indicator */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <div className="flex space-x-2">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full ${index + 1 === currentStep ? "bg-white" : "bg-white/40"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div className="p-8">
              <div className="h-full flex flex-col">
                <div className="flex-grow">
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-brand-teal">Create Your Profile</h3>
                      <p className="text-offblack">
                        We'll help you set up your profile so you can get the most out of Wags & Wanders.
                      </p>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-brand-teal/10 rounded-full p-2">
                            <PawPrint className="h-5 w-5 text-brand-teal" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-offblack">Pet Profiles</h4>
                            <p className="text-xs text-offblack/70">Track vaccinations and preferences</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-brand-teal/10 rounded-full p-2">
                            <MapPin className="h-5 w-5 text-brand-teal" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-offblack">Travel Planning</h4>
                            <p className="text-xs text-offblack/70">Find pet-friendly destinations</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="bg-brand-teal/10 rounded-full p-2">
                            <Calendar className="h-5 w-5 text-brand-teal" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-offblack">Trip Management</h4>
                            <p className="text-xs text-offblack/70">Organize your pet travel itineraries</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-brand-teal">Pet Information</h3>
                      <p className="text-offblack">
                        This feature is coming soon! You'll be able to add details about your pets.
                      </p>
                      <div className="bg-brand-pink/10 rounded-lg p-4 text-center">
                        <PawPrint className="h-8 w-8 text-brand-teal mx-auto mb-2" />
                        <p className="text-sm text-offblack">
                          Pet profile management is under development. Soon you'll be able to add multiple pets and
                          track their travel documents.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-brand-teal">Travel Preferences</h3>
                      <p className="text-offblack">
                        This feature is coming soon! You'll be able to set your travel preferences.
                      </p>
                      <div className="bg-brand-pink/10 rounded-lg p-4 text-center">
                        <Plane className="h-8 w-8 text-brand-teal mx-auto mb-2" />
                        <p className="text-sm text-offblack">
                          We're working on personalized travel recommendations based on your preferences and your pet's
                          needs.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-6"
                    >
                      <h3 className="text-xl font-semibold text-brand-teal">Ready to Explore!</h3>
                      <p className="text-offblack">
                        Your account is set up and ready to go. Start exploring pet-friendly travel options!
                      </p>
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
                        <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-green-800">
                          Onboarding complete! You're all set to start planning amazing adventures with your pet.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-8 pt-4 border-t">
                  <Button variant="ghost" className="text-offblack/70 hover:text-brand-teal" onClick={handleSkip}>
                    Complete Later
                  </Button>
                  <Button className="bg-brand-teal hover:bg-brand-pink text-white" onClick={handleNext}>
                    {currentStep < totalSteps ? (
                      <span className="flex items-center">
                        Continue
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </span>
                    ) : (
                      "Get Started"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

