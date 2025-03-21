"use client"

import Image from "next/image"
import { PawPrintIcon as Paw, Globe, CheckCircle } from "lucide-react"

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-t from-brand-pink/20 to-white pt-24">
      <div className="container mx-auto px-4">
        {/* Hero Section - Styled like Directory */}
        <div className="relative mb-12 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#93dcec]/10 to-[#FFA9DE]/10 z-0"></div>
          <div className="relative z-10 p-8 md:p-10">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#249ab4] mb-4">About Us</h1>
              <p className="text-lg text-[#493f40] mb-6">Your AI-Powered Pet Travel Companion</p>
              <div className="h-1 w-20 bg-[#FFA9DE] mx-auto mb-6"></div>
              <p className="text-[#493f40]">
                At Wags and Wanders, we believe that no adventure should leave your pet behind. Founded by Andrew &#38;
                Ashley, our journey began with a street dog named Baggo and evolved into a mission to transform the way
                pet parents travel with their furry companions.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-1 w-6 bg-[#249ab4] rounded-full"></div>
            <h2 className="text-2xl font-bold text-[#249ab4] mb-0">Our Story</h2>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
            <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="md:w-1/3 flex-shrink-0">
                <Image
                  src="/placeholders/bags_ashley_wags_and_wanders.png"
                  alt="Founders with Baggo"
                  width={300}
                  height={400}
                  className="rounded-2xl shadow-lg"
                />
              </div>
              <div className="flex-grow">
                <p className="mb-4 text-[#493f40]">
                  Our first experience with pet travel wasn&#39;t planned&#8212;it started when we met Baggo, an
                  abandoned dog in Puerto Vallarta, Mexico. Navigating the complex regulations, airline policies, and
                  health requirements to bring him home to Canada opened our eyes to the gaps in pet travel resources.
                </p>
                <p className="mb-4 text-[#493f40]">
                  Later, as we embraced a nomadic lifestyle, studying and working abroad, we encountered firsthand the
                  frustrations, misinformation, and last-minute hurdles that come with international pet travel.
                </p>
                <p className="text-[#493f40]">
                  We met pet owners turned away at airport check-ins, stuck in bureaucratic nightmares, and forced into
                  costly delays&#8212;all due to fragmented, outdated, or hard-to-find information. This inspired us to
                  build Wags and Wanders, an AI-powered solution designed to make pet travel seamless, stress-free, and
                  fully informed.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-1 w-6 bg-[#249ab4] rounded-full"></div>
            <h2 className="text-2xl font-bold text-[#249ab4] mb-0">Our Mission</h2>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
            <div className="flex flex-col md:flex-row-reverse items-start gap-8">
              <div className="md:w-1/3 flex-shrink-0">
                <Image
                  src="/placeholders/bags_andrew_wags.jpeg"
                  alt="Pet traveling"
                  width={300}
                  height={400}
                  className="rounded-2xl shadow-lg"
                />
              </div>
              <div className="flex-grow">
                <p className="mb-4 text-[#493f40]">
                  We are creating the world&#39;s first AI-powered pet travel companion, offering an end-to-end solution
                  that consolidates itinerary planning, travel regulations, document management, and community-driven
                  insights—all in one intuitive platform.
                </p>
                <p className="mb-6 text-[#493f40]">With Wags and Wanders, pet owners can:</p>
                <ul className="space-y-4">
                  {[
                    "Navigate pet travel requirements with AI-enabled clarity",
                    "Track vaccinations, paperwork, and airline policies effortlessly",
                    "Avoid last-minute surprises at check-in and border crossings",
                    "Connect with a global community of pet travelers for tips and insights",
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#249ab4] mr-3 flex-shrink-0" />
                      <span className="text-[#493f40]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action - Styled like Directory */}
        <div className="text-center mb-16 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#249ab4] mb-4">Join Us in Redefining Pet Travel</h2>
          <p className="text-[#493f40] mb-6 max-w-2xl mx-auto">
            Our vision is to eliminate the guesswork and give pet parents the confidence to explore the world with their
            pets&#8212;stress-free.
          </p>
          <div className="bg-gradient-to-r from-[#93dcec]/10 to-[#FFA9DE]/10 rounded-2xl p-8 max-w-2xl mx-auto">
            <p className="text-xl text-[#493f40]">
              <Globe className="inline-block mr-2 h-6 w-6 text-[#249ab4]" />
              Because every journey is better with a wagging tail.
              <Paw className="inline-block ml-2 h-6 w-6 text-[#249ab4]" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

