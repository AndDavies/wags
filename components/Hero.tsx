"use client"

import { motion } from "framer-motion"
import { Outfit, Pacifico } from "next/font/google"
import Image from "next/image"
import { cn } from "@/lib/utils"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
})

interface FloatingImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  delay?: number
}

function FloatingImage({ src, alt, width, height, className, delay = 0 }: FloatingImageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ background: "transparent" }}
      >
        <Image src={src || "/placeholder.svg"} alt={alt} width={width} height={height} />
      </motion.div>
    </motion.div>
  )
}

export function HeroSection({
  title1 = "Travel Confidently",
  title2 = "With Your Pet",
}: {
  title1?: string
  title2?: string
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  }

  return (
    <div
      className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white ${outfit.variable}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <FloatingImage
          src="/placeholders/hero_floating_wags_and_wanders_1.png"
          alt="Dog on a beach"
          width={300}
          height={300}
          className="left-[5%] top-[20%]"
          delay={0.8}
        />
        <FloatingImage
          src="/placeholders/hero_floating_wags_and_wanders_2.png"
          alt="Cat in a carrier"
          width={250}
          height={250}
          className="right-[10%] bottom-[15%]"
          delay={1}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div custom={0} variants={fadeUpVariants} initial="hidden" animate="visible" className="mb-8 md:mb-12">
            <Image
              src="/wags_and_wanders_logo_trans.png"
              alt="Wags & Wanders"
              width={120}
              height={120}
              className="mx-auto"
            />
          </motion.div>

          <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight leading-tight">
              <span className="text-[#30B8C4]">{title1}</span>
              <br />
              <span className={cn("text-[#FFE5E5]", pacifico.className)}>{title2}</span>
            </h1>
          </motion.div>

          <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              From personal experience to professional guidance - we help you navigate pet-friendly travel across the
              globe.
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/contact"
              className="inline-flex h-12 sm:h-14 items-center justify-center rounded-full bg-[#30B8C4] px-6 sm:px-8 text-base sm:text-lg font-bold text-white transition-all hover:bg-[#FFE5E5] hover:text-[#30B8C4] hover:scale-105 transform"
            >
              Plan Your Journey
            </a>
            <a
              href="/about"
              className="inline-flex h-12 sm:h-14 items-center justify-center rounded-full border-2 border-[#30B8C4] px-6 sm:px-8 text-base sm:text-lg font-bold text-[#30B8C4] transition-all hover:bg-[#30B8C4] hover:text-white hover:scale-105 transform"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default HeroSection

