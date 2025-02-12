// app/page.tsx
import React from 'react';
import Hero from '@/components/Hero';
import FeaturedDirectory from '@/components/FeaturedDirectory';
import FeaturedBlog from '@/components/FeaturedBlog';
import AboutUs from '@/components/AboutUs';
import HowItWorks from '@/components/HowItWorks';

export default function HomePage() {
  return (
    <div>
      <Hero />
      <FeaturedBlog />
      <FeaturedDirectory />
      <AboutUs />
      <HowItWorks />
    </div>
  );
}
