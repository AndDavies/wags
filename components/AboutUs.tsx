"use client"

import Image from "next/image"
import { PawPrint, Plane, Globe, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const AboutUs = () => {
  const features = [
    { icon: <PawPrint className="h-6 w-6" />, text: "Pet-Friendly Travel" },
    { icon: <Plane className="h-6 w-6" />, text: "Expert Guidance" },
    { icon: <Globe className="h-6 w-6" />, text: "Global Coverage" },
    { icon: <Heart className="h-6 w-6" />, text: "Passionate Team" },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Story</h2>
          <div className="w-20 h-1 bg-[#249ab4] mx-auto mb-6"></div>
          <p className="text-lg text-gray-600">We're transforming pet travel with technology and expertise</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="bg-[#249ab4]/10 p-3 rounded-full">
                  <PawPrint className="w-6 h-6 text-[#249ab4]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Journey</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Traveling taught us that pet adventures aren't always easy. Our family set out across Europe, Asia,
                    Latin America, and beyond with our rescue dog, Baggo—navigating endless paperwork, vet certificates,
                    and pet-friendly hotel searches.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-[#249ab4]/10 p-3 rounded-full">
                  <Globe className="w-6 h-6 text-[#249ab4]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Our Mission</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Frustrated by fragmented information, we created Wags Travel Hub to bring everything together in one
                    trusted directory—so you can focus on enjoying the journey with your pet.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Button asChild className="bg-[#249ab4] hover:bg-[#249ab4]/90 text-white rounded-full px-6">
                  <Link href="/about">Learn More About Us</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-8">
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/placeholders/bagsy_family_travel.jpeg"
                alt="Our family traveling with our dog Baggo"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3 shadow-sm border border-gray-100 transition-all hover:shadow-md"
                >
                  <div className="text-[#249ab4]">{item.icon}</div>
                  <span className="text-sm font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutUs

