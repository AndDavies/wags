// components/AboutUs.tsx
import React from 'react';
import Image from 'next/image';

const AboutUs = () => {
  return (
    <section className="py-16 bg-offwhite">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column: Story Text */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-offblack">Our Story</h2>
            <p className="text-lg text-gray-700">
              Traveling taught us that pet adventures aren’t always easy. Our family set out across Europe, Asia, Latin America, and beyond with our rescue dog, Baggo—navigating endless paperwork, vet certificates, and pet-friendly hotel searches.
            </p>
            <p className="text-lg text-gray-700">
              Frustrated by fragmented information, we created Wags and Wanders to bring everything together in one trusted directory—so you can focus on enjoying the journey with your pet.
            </p>
          </div>
          {/* Right Column: Circular Image */}
          <div className="flex justify-center">
            <div className="relative w-72 h-72">
              <Image 
                src="/placeholders/bagsy_travel_2.jpg" 
                alt="Baggo, our rescue dog, enjoying travel adventures"
                fill
                className="object-cover rounded-3xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
