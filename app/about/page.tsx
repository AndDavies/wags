"use client"

import Image from "next/image"
import { PawPrintIcon as Paw, Globe, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <motion.h1 className="text-5xl md:text-6xl font-display text-brand-teal text-center mb-4" {...fadeIn}>
        About Us
      </motion.h1>
      <motion.h2
        className="text-2xl md:text-3xl font-semibold text-center mb-8 text-offblack"
        {...fadeIn}
        transition={{ delay: 0.2 }}
      >
        Your AI-Powered Pet Travel Companion
      </motion.h2>

      <motion.p className="text-lg mb-12 text-offblack" {...fadeIn} transition={{ delay: 0.4 }}>
        At Wags and Wanders, we believe that no adventure should leave your pet behind. Founded by Andrew &#38; Ashley,
        our journey began with a street dog named Baggo and evolved into a mission to transform the way pet parents
        travel with their furry companions.
      </motion.p>

      <motion.section
        className="mb-16 flex flex-col md:flex-row items-start gap-8"
        {...fadeIn}
        transition={{ delay: 0.6 }}
      >
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
          <h3 className="text-3xl font-display text-brand-teal mb-6">Our Story</h3>
          <p className="mb-4 text-offblack">
            Our first experience with pet travel wasn&#39;t planned&#8212;it started when we met Baggo, an abandoned dog
            in Puerto Vallarta, Mexico. Navigating the complex regulations, airline policies, and health requirements to
            bring him home to Canada opened our eyes to the gaps in pet travel resources.
          </p>
          <p className="mb-4 text-offblack">
            Later, as we embraced a nomadic lifestyle, studying and working abroad, we encountered firsthand the
            frustrations, misinformation, and last-minute hurdles that come with international pet travel.
          </p>
          <p className="text-offblack">
            We met pet owners turned away at airport check-ins, stuck in bureaucratic nightmares, and forced into costly
            delays&#8212;all due to fragmented, outdated, or hard-to-find information. This inspired us to build Wags
            and Wanders, an AI-powered solution designed to make pet travel seamless, stress-free, and fully informed.
          </p>
        </div>
      </motion.section>

      <motion.section
        className="mb-16 flex flex-col md:flex-row-reverse items-start gap-8"
        {...fadeIn}
        transition={{ delay: 0.8 }}
      >
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
          <h3 className="text-3xl font-display text-brand-teal mb-6">Our Mission</h3>
          <p className="mb-4 text-offblack">
            We are creating the world&#39;s first AI-powered pet travel companion, offering an end-to-end solution that
            consolidates itinerary planning, travel regulations, document management, and community-driven insights—all
            in one intuitive platform.
          </p>
          <p className="mb-6 text-offblack">With Wags and Wanders, pet owners can:</p>
          <ul className="space-y-4">
            {[
              "Navigate pet travel requirements with AI-enabled clarity",
              "Track vaccinations, paperwork, and airline policies effortlessly",
              "Avoid last-minute surprises at check-in and border crossings",
              "Connect with a global community of pet travelers for tips and insights",
            ].map((feature, index) => (
              <motion.li
                key={index}
                className="flex items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.2 }}
              >
                <CheckCircle className="h-6 w-6 text-brand-teal mr-3 flex-shrink-0" />
                <span className="text-offblack">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.section>

      <motion.p className="text-lg mb-12 text-offblack" {...fadeIn} transition={{ delay: 1.6 }}>
        Our vision is to eliminate the guesswork and give pet parents the confidence to explore the world with their
        pets&#8212;stress-free.
      </motion.p>

      <motion.div
        className="text-center bg-brand-pink rounded-2xl p-8 shadow-lg"
        {...fadeIn}
        transition={{ delay: 1.8 }}
      >
        <p className="text-2xl font-display text-brand-teal mb-4">
          <Globe className="inline-block mr-2 h-8 w-8" />
          Join us in redefining pet travel.
        </p>
        <p className="text-xl text-offblack">
          Because every journey is better with a wagging tail.
          <Paw className="inline-block ml-2 h-6 w-6 text-brand-teal" />
        </p>
      </motion.div>
    </div>
  )
}

