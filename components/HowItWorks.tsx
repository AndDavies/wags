// components/HowItWorks.tsx
import React from 'react';

const HowItWorks = () => {
  return (
    <section className="py-16 bg-white dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4 text-black dark:text-white">How It Works</h2>
        <p className="text-lg text-gray-700 dark:text-neutral-300 mb-8">
          Our platform curates the best travel options and blog insights—making it easy for you to plan unforgettable adventures with your pet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            {/* You can insert a custom icon here */}
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Search & Discover</h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Browse through curated lists of pet-friendly hotels, parks, and activities.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Plan Your Trip</h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Use our intuitive tools to filter and select the best options for you and your pet.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2 text-black dark:text-white">Book & Enjoy</h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              Easily make bookings and enjoy hassle-free travel with your furry companion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
