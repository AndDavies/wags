"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Outfit, Pacifico } from "next/font/google"
import { SearchForm } from "@/components/SearchForm"
// Import the ScrollIndicator component
import ScrollIndicator from "./ScrollIndicator"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

export function HeroRe() {
  const [isMobile, setIsMobile] = useState(false)
  const [isZoomingIn, setIsZoomingIn] = useState(true)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkMobile()

    // Add event listener for resize
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Toggle zoom direction every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsZoomingIn((prev) => !prev)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative w-full min-h-screen overflow-hidden ${outfit.variable}`} style={{ zIndex: 1 }}>
      {/* Background image with zoom effect */}
      <div className="absolute inset-0 w-full h-full">
        <motion.div
          className="w-full h-full"
          animate={{
            scale: isZoomingIn ? 1.1 : 1,
          }}
          transition={{
            duration: 15,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/placeholders/hero-landscape_5.png"
            alt="Hero background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </div>

      {/* Content container */}
      <div
        className="relative container mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-screen"
        style={{ zIndex: 50 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8"
        >
          {/* Logo removed as requested */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight leading-tight text-white drop-shadow-lg">
            <span className="inline-block">Travel Confidently</span>
            <br />
            <span className={cn("text-[#FFE5E5]", pacifico.className)}>With Your Pet</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg sm:text-xl md:text-2xl font-light text-white drop-shadow-md leading-relaxed">
            From personal experience to professional guidance - we help you navigate pet-friendly travel across the
            globe.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl mx-auto mb-8"
          style={{ zIndex: 100 }}
        >
          <SearchForm className="w-full" />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
        >
          <Link
            href="/contact"
            className="inline-flex h-12 sm:h-14 items-center justify-center rounded-full bg-white px-6 sm:px-8 text-base sm:text-lg font-bold text-[#30B8C4] transition-all hover:bg-yellow-400 hover:text-white hover:scale-105 transform"
          >
            Plan Your Journey
          </Link>
          <Link
            href="/about"
            className="inline-flex h-12 sm:h-14 items-center justify-center rounded-full border-2 border-white px-6 sm:px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-white hover:text-[#30B8C4] hover:scale-105 transform"
          >
            Learn More
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute bottom-8 left-0 right-0 flex justify-center"
        >
          <div className="text-white/80 text-sm flex items-center gap-2">
            <span>Trusted by</span>
            <span className="font-bold">10,000+</span>
            <span>pet travelers worldwide</span>
          </div>
        </motion.div>
      </div>
      <ScrollIndicator />
    </div>
  )
}

export default HeroRe

