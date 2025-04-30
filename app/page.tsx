import React from 'react'
import FeaturedBlog from "@/components/FeaturedBlog"
import AboutUs from "@/components/AboutUs"
import HowItWorks from "@/components/HowItWorks"
import ServicesSection from '@/components/Services'
import Hero from '@/components/Hero'
import ChatWithBaggo from '@/components/ChatWithBaggo'
import GetInspired from '@/components/GetInspired'
import PolicyCard from '@/components/PolicyCard'


export default function HomePage() {
  return (
    <div className="flex flex-col">

      <Hero />     
      <ChatWithBaggo />
      {/* <GetInspired /> */}
      <FeaturedBlog />

      <PolicyCard />
      {/* <ServicesSection />  */}
      <AboutUs />
      {/* <HowItWorks /> */}
    </div>
  )
}

