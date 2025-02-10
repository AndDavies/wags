// components/HowItWorks.tsx
import React from 'react'

const HowItWorks = () => {
  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        <p className="text-lg leading-relaxed mb-8">
          Our platform curates the best travel options and blog insights, bringing together a comprehensive directory and engaging content to help you plan your next adventure with your pet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Search & Discover</h3>
            <p className="text-sm">
              Browse through curated lists of airlines, hotels, and activities tailored for pet travelers.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Plan Your Trip</h3>
            <p className="text-sm">
              Use our user-friendly interface to filter and select the best options for your adventure.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Book & Enjoy</h3>
            <p className="text-sm">
              Easily book your travel arrangements and start your unforgettable journey with your pet.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
