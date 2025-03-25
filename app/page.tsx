import React from 'react'
import Hero from "@/components/Hero"
import FeaturedDirectory from "@/components/FeaturedDirectory"
import FeaturedBlog from "@/components/FeaturedBlog"
import AboutUs from "@/components/AboutUs"
import HowItWorks from "@/components/HowItWorks"
import ServicesSection from '@/components/Services'
import HeroRe from '@/components/hero-two'

export default function HomePage() {
  return (
    <div className="flex flex-col">

      <HeroRe />     
      <FeaturedDirectory />
      <FeaturedBlog />
      {/* <ServicesSection />  */}
      <AboutUs />
      <HowItWorks />
    </div>
  )
}

