import React from 'react'
import FeaturedDirectory from "@/components/FeaturedDirectory"
import FeaturedBlog from "@/components/FeaturedBlog"
import AboutUs from "@/components/AboutUs"
import HowItWorks from "@/components/HowItWorks"
import ServicesSection from '@/components/Services'
import Hero from '@/components/Hero'


export default function HomePage() {
  return (
    <div className="flex flex-col">

      <Hero />     
      <FeaturedDirectory />
      <FeaturedBlog />
      {/* <ServicesSection />  */}
      <AboutUs />
      <HowItWorks />
    </div>
  )
}

