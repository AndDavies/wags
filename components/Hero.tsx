"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Outfit, Pacifico } from "next/font/google"
import { cn } from "@/lib/utils"
import ScrollIndicator from "./ScrollIndicator"
import { Calendar, ChevronRight, MapPin, PawPrint } from "lucide-react"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false)
  const [isZoomingIn, setIsZoomingIn] = useState(true)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setIsZoomingIn((prev) => !prev), 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`relative w-full min-h-screen overflow-hidden ${outfit.variable}`} style={{ zIndex: 1 }}>
      <div className="absolute inset-0 w-full h-full">
        <motion.div
          className="w-full h-full"
          animate={{ scale: isZoomingIn ? 1.1 : 1 }}
          transition={{ duration: 15, ease: "easeInOut" }}
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.a
            href="/create-trip"
            className="flex-1 bg-[#30B8C4] hover:bg-[#2aa6b1] text-white rounded-xl py-5 px-6 shadow-lg transition-all flex items-center justify-center gap-3 text-lg font-medium group"
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(48, 184, 196, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="h-5 w-5" />
            <span>Plan Your Journey</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>

          <motion.a
            href="/join-our-pack"
            className="flex-1 bg-white text-slate-800 rounded-xl py-5 px-6 shadow-lg border border-slate-100 transition-all flex items-center justify-center gap-3 text-lg font-medium group"
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(255, 229, 229, 0.4)" }}
            whileTap={{ scale: 0.98 }}
          >
            <PawPrint className="h-5 w-5 text-[#FFE5E5]" />
            <span>Join Our Pack</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex justify-center"
        >
          <motion.a
            href="/directory"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/30 rounded-full py-3 px-6 transition-all flex items-center gap-2 shadow-sm group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="h-4 w-4" />
            <span>Explore Pet-Friendly Destinations</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transform duration-200" />
          </motion.a>
        </motion.div>

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

