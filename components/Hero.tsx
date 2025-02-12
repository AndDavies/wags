// components/Hero.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative h-[calc(100vh-106px)] overflow-hidden bg-gray-100 dark:bg-neutral-800">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/wags_and_wanders_hero.png"
          alt="Scenic pet travel background"
          fill
          className="object-cover opacity-30 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
      </div>
      <div className="relative z-10 flex flex-col justify-center h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white drop-shadow-lg mb-6">
            Explore Pet-Friendly Adventures
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 mb-8">
            Discover travel experiences that welcome you and your furry friend.
          </p>
          <Link href="/directory">
            <Button variant="default" className="py-3 px-6 text-lg transition-transform duration-300 hover:scale-105">
              Find Your Next Trip
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
