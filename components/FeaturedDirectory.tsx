// components/FeaturedDirectory.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const FeaturedDirectory = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Featured Deals & Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sample Card: Airline Deals */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="relative w-full h-48">
              <Image 
                src="/placeholders/placeholder_image_18.jpg" 
                alt="Featured Airline Deal" 
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">Airline Deals</h3>
              <p className="text-sm mb-4">Exclusive offers on pet-friendly flights.</p>
              <Link href="/directory/airlines" className="text-primary font-medium hover:underline">
                Explore
              </Link>
            </div>
          </div>
          {/* Sample Card: Hotel Deals */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="relative w-full h-48">
              <Image 
                src="/placeholders/placeholder_image_24.jpg" 
                alt="Featured Hotel Deal" 
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">Hotel Deals</h3>
              <p className="text-sm mb-4">Stay at pet-friendly hotels around the world.</p>
              <Link href="/directory/hotels" className="text-primary font-medium hover:underline">
                Discover
              </Link>
            </div>
          </div>
          {/* Sample Card: Activities */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="relative w-full h-48">
              <Image 
                src="/placeholders/placeholder_image_13.jpg" 
                alt="Featured Activity" 
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">Activities</h3>
              <p className="text-sm mb-4">Adventure activities perfect for pet travelers.</p>
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
