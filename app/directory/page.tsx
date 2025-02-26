"use client"

import Link from "next/link"
import { Airplay, BedIcon, FileTextIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

export default function DirectoryHomePage() {
  const directories = [
    {
      href: "/directory/airlines",
      icon: Airplay,
      title: "Airlines",
      description: "Find pet-friendly airlines for your journey",
    },
    {
      href: "/directory/hotels",
      icon: BedIcon,
      title: "Hotels",
      description: "Discover accommodations that welcome your furry friends",
    },
    {
      href: "/directory/policies",
      icon: FileTextIcon,
      title: "Policies",
      description: "Learn about pet travel regulations and guidelines",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-16 space-y-12">
      <motion.h1 className="text-5xl md:text-6xl font-display text-brand-teal text-center mb-6" {...fadeInUp}>
        Pet Travel Directory
      </motion.h1>
      <motion.p
        className="text-center text-xl text-offblack mb-12 max-w-2xl mx-auto"
        {...fadeInUp}
        transition={{ delay: 0.2 }}
      >
        Find pet-friendly airlines, hotels, and travel policies for your next adventure.
      </motion.p>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={{
          animate: { transition: { staggerChildren: 0.1 } },
        }}
        initial="initial"
        animate="animate"
      >
        {directories.map((item, index) => (
          <motion.div key={item.href} variants={fadeInUp} transition={{ delay: 0.3 + index * 0.1 }}>
            <Link href={item.href}>
              <Card className="hover:shadow-xl transition-all duration-300 h-full bg-white border-2 border-brand-pink hover:border-brand-teal">
                <CardContent className="flex flex-col items-center space-y-6 p-8">
                  <item.icon className="h-20 w-20 text-brand-teal" />
                  <h2 className="text-2xl font-semibold text-brand-teal">{item.title}</h2>
                  <p className="text-center text-offblack">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

