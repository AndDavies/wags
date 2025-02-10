// components/Hero.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assumes use of a shadcn UI Button component

const Hero = () => {
  return (
    <section className="relative bg-white pt-24 pb-16 overflow-hidden">
      {/* Background overlay for added depth */}
      <div className="absolute inset-0">
        <Image
          src="/hero-background.jpg" // Use a high-quality, subtle background image or illustration
          alt="Subtle background pattern"
          fill
          className="object-cover opacity-20"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
        {/* Left Column: Text Content */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-extrabold text-offblack leading-tight">
            Explore Pet-Friendly Adventures
          </h1>
          <p className="text-xl md:text-2xl text-offblack leading-relaxed">
            Discover travel experiences that welcome you and your furry friend.
          </p>
          <Link href="/directory">
            <Button
              variant="default"
              className="transition-transform duration-300 hover:scale-105"
            >
              Find Your Next Trip
            </Button>
          </Link>
        </div>

        {/* Right Column: Hero Image */}
        <div className="flex justify-center">
          <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
            <Image
              src="/wags_and_wanders_hero.png"
              alt="Pet enjoying a scenic outdoor adventure"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
