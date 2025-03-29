"use client";

import { useState, useEffect, FormEvent } from "react"; // Added FormEvent
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Outfit, Pacifico } from "next/font/google";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ScrollIndicator from "./ScrollIndicator";
import { // Added Lucide imports
  Send,
  Globe,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);
  const [isZoomingIn, setIsZoomingIn] = useState(true);
  const [inputValue, setInputValue] = useState<string>("");
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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/chat?input=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleSuggestion = (text: string) => {
    router.push(`/chat?input=${encodeURIComponent(text)}`);
  };

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

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="w-full max-w-4xl mx-auto mb-8"
        >
          <div className="relative">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Create a weekend getaway..."
              className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full py-6 px-6 pr-16 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 shadow-sm"
            />
            <Button
              type="submit"
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full p-3 transition-all shadow-sm",
                inputValue.trim()
                  ? "hover:shadow-md hover:from-pink-600 hover:to-pink-700 active:scale-95"
                  : "opacity-75 cursor-not-allowed"
              )}
              aria-label="Send message"
              disabled={!inputValue.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
        >
          <Button
            className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 transition-all flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow group"
            onClick={() => handleSuggestion("Create a new Trip")}
          >
            <Globe className="h-4 w-4 text-pink-500 group-hover:text-pink-600 transition-colors" />
            <span>Create a new Trip</span>
            <ChevronRight className="h-3.5 w-3.5 text-pink-500 group-hover:text-pink-600 transition-colors group-hover:translate-x-0.5 transform duration-200" />
          </Button>
          <Button
            className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 transition-all flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow group"
            onClick={() => handleSuggestion("Inspire me where to go")}
          >
            <MapPin className="h-4 w-4 text-pink-500 group-hover:text-pink-600 transition-colors" />
            <span>Inspire me where to go</span>
            <ChevronRight className="h-3.5 w-3.5 text-pink-500 group-hover:text-pink-600 transition-colors group-hover:translate-x-0.5 transform duration-200" />
          </Button>
          <Button
            className="bg-white hover:bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 transition-all flex items-center gap-2 border border-slate-200 shadow-sm hover:shadow group"
            onClick={() => handleSuggestion("Find pet-friendly hotels")}
          >
            <Users className="h-4 w-4 text-pink-500 group-hover:text-pink-600 transition-colors" />
            <span>Find pet-friendly hotels</span>
            <ChevronRight className="h-3.5 w-3.5 text-pink-500 group-hover:text-pink-600 transition-colors group-hover:translate-x-0.5 transform duration-200" />
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