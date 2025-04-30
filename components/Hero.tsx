"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ScrollIndicator from "./ScrollIndicator";
import { Send, Globe, ChevronRight, MapPin, Users, PawPrint } from "lucide-react";

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);
  const [isZoomingIn, setIsZoomingIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setIsZoomingIn((prev) => !prev), 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSuggestion = (text: string) => {
    setIsLoading(true);
    router.push(`/create-trip`);
  };

  const pawVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut",
      },
    }),
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden font-sans tracking-tight" style={{ zIndex: 1 }}>
      <div className="absolute inset-0 w-full h-full">
        <motion.div
          className="w-full h-full"
          animate={{ scale: isZoomingIn ? 1.1 : 1 }}
          transition={{ duration: 15, ease: "easeInOut" }}
        >
          <Image
            src="/placeholders/hero-landscape_5.png"
            alt="Hero background: Scenic landscape view suitable for pet travel inspiration."
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </motion.div>
      </div>

      <div
        className="relative container mx-auto px-4 py-32 flex flex-col items-center justify-center min-h-screen text-center"
        style={{ zIndex: 50 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-4 tracking-tight leading-tight text-white drop-shadow-lg">
            Travel Confidently
            <br />
            <span className="text-teal-300">With Your Pet</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg sm:text-xl md:text-2xl font-normal text-white/90 drop-shadow-md leading-relaxed">
            Baggo, our AI powered assistant builds your perfect pet-friendly itinerary in seconds, tackling airline rules and country policies with ease!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
        >
          <Button
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg py-2 px-6 transition-all flex items-center gap-2 shadow hover:shadow-md group disabled:opacity-75 text-base font-medium"
            onClick={() => handleSuggestion("Create a new Trip")}
            disabled={isLoading}
            aria-label="Create a new trip itinerary"
          >
            {isLoading ? (
              <div className="flex space-x-1 items-center justify-center h-5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    variants={pawVariants}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    className="w-2 h-2"
                  >
                    <PawPrint className="w-4 h-4 text-white" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <>
                <Globe className="h-5 w-5" />
                <span>Create a New Trip</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1 transform duration-200" />
              </>
            )}
          </Button>
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
  );
}