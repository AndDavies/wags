import React from 'react'
import Hero from '@/components/Hero'
import FeaturedDirectory from '@/components/FeaturedDirectory'
import FeaturedBlog from '@/components/FeaturedBlog'
import AboutUs from '@/components/AboutUs'
import HowItWorks from '@/components/HowItWorks'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <FeaturedBlog />
      <FeaturedDirectory />
      <AboutUs />
      <HowItWorks />
    </div>
  )
}