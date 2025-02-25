"use client"

import Image from "next/image"
import { PawPrint, Plane, Globe, Heart } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const AboutUs = () => {
  const features = [
    { icon: <PawPrint className="h-6 w-6" />, text: "Pet-Friendly" },
    { icon: <Plane className="h-6 w-6" />, text: "Travel Experts" },
    { icon: <Globe className="h-6 w-6" />, text: "Global Coverage" },
    { icon: <Heart className="h-6 w-6" />, text: "Passionate Team" },
  ]

  return (
    <section className="relative py-16 bg-brand-pink">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <PawPrint className="w-12 h-12 text-brand-teal mb-4" />
            <h2 className="text-5xl md:text-6xl font-display text-brand-teal mb-8">Our Story</h2>
            <p className="text-lg text-offblack">
              Traveling taught us that pet adventures aren&apos;t always easy. Our family set out across Europe, Asia,
              Latin America, and beyond with our rescue dog, Baggo—navigating endless paperwork, vet certificates, and
              pet-friendly hotel searches.
            </p>
            <p className="text-lg text-offblack">
              Frustrated by fragmented information, we created Wags Travel Hub to bring everything together in one
              trusted directory—so you can focus on enjoying the journey with your pet.
            </p>
            <div className="pt-4">
              <Button asChild className="bg-brand-teal hover:bg-brand-teal/90 text-white">
                <Link href="/about">Learn More About Us</Link>
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="relative h-[400px] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/placeholders/bagsy_family_travel.jpeg"
                alt="Relaxed pet being pampered"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4"
                >
                  <div className="text-brand-teal">{item.icon}</div>
                  <span className="text-sm font-medium text-offblack">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AboutUs

