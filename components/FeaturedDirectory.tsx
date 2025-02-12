// components/FeaturedDirectory.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FeaturedDirectory = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-black dark:text-white">
          Featured Deals & Destinations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Airline Deals Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
              <Image 
                src="/placeholders/placeholder_image_18.jpg" 
                alt="Featured Airline Deal" 
                fill
                className="object-cover transition-transform duration-500 ease-in-out"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Airline Deals</h3>
              <p className="text-sm mb-4 text-gray-600 dark:text-neutral-300">
                Exclusive offers on pet-friendly flights.
              </p>
              <Link href="/directory/airlines" className="text-primary font-medium hover:underline">
                Explore
              </Link>
            </div>
          </div>
          {/* Hotel Deals Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
              <Image 
                src="/placeholders/placeholder_image_24.jpg" 
                alt="Featured Hotel Deal" 
                fill
                className="object-cover transition-transform duration-500 ease-in-out"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Hotel Deals</h3>
              <p className="text-sm mb-4 text-gray-600 dark:text-neutral-300">
                Stay at pet-friendly hotels around the world.
              </p>
              <Link href="/directory/hotels" className="text-primary font-medium hover:underline">
                Discover
              </Link>
            </div>
          </div>
          {/* Activities Card */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="relative w-full h-48 overflow-hidden rounded-t-2xl">
              <Image 
                src="/placeholders/placeholder_image_13.jpg" 
                alt="Featured Activity" 
                fill
                className="object-cover transition-transform duration-500 ease-in-out"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Activities</h3>
              <p className="text-sm mb-4 text-gray-600 dark:text-neutral-300">
                Adventure activities perfect for pet travelers.
              </p>
              <Link href="/directory/activities" className="text-primary font-medium hover:underline">
                See More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDirectory;
