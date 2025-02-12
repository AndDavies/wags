// components/AboutUs.tsx
import React from 'react';
import Image from 'next/image';

const AboutUs = () => {
  return (
    <section className="py-16 bg-offwhite dark:bg-neutral-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Text Column */}
          <div>
            <h2 className="text-3xl font-bold text-black dark:text-white mb-4">Our Story</h2>
            <p className="text-lg text-gray-700 dark:text-neutral-300 mb-4">
              Traveling taught us that pet adventures aren’t always easy. Our family set out across Europe, Asia, Latin America, and beyond with our rescue dog, Baggo—navigating endless paperwork, vet certificates, and pet-friendly hotel searches.
            </p>
            <p className="text-lg text-gray-700 dark:text-neutral-300">
              Frustrated by fragmented information, we created Wags Travel Hub to bring everything together in one trusted directory—so you can focus on enjoying the journey with your pet.
            </p>
          </div>
          {/* Image Column */}
          <div className="flex justify-center">
            <div className="relative w-72 h-72 rounded-3xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/placeholders/bagsy_travel_2.jpg" 
                alt="Baggo, our rescue dog, enjoying travel adventures"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
