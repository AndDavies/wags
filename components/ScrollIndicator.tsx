"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export default function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      // Hide the indicator when user scrolls down more than 100px
      if (window.scrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.div
      className="fixed bottom-8 left-8 z-40 flex flex-col items-center"
      initial={{ opacity: 0.7, y: 0 }}
      animate={{
        opacity: isVisible ? 0.7 : 0,
        y: isVisible ? 0 : 20,
      }}
      whileHover={{ opacity: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-white/60 backdrop-blur-sm p-2 rounded-full shadow-md flex flex-col items-center"
        animate={{ y: [0, -5, 0] }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 1.5,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          {/* Dog face */}
          <div className="w-8 h-8 bg-[#F9D9A7] rounded-full flex items-center justify-center">
            {/* Eyes */}
            <div className="absolute top-2 left-1.5 w-1.5 h-1.5 bg-black rounded-full"></div>
            <div className="absolute top-2 right-1.5 w-1.5 h-1.5 bg-black rounded-full"></div>

            {/* Nose */}
            <div className="absolute top-3.5 w-2 h-1.5 bg-black rounded-full"></div>

            {/* Mouth */}
            <div className="absolute top-5 w-3 h-0.5 border-b-[1.5px] border-black rounded"></div>

            {/* Ears */}
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#E5B887] rounded-full"></div>
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#E5B887] rounded-full"></div>
          </div>
        </div>

        {/* Scroll text - removed for a more minimal look */}

        {/* Arrow */}
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-600 mt-1"
          animate={{ y: [0, 3, 0] }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 1.5,
            delay: 0.2,
            ease: "easeInOut",
          }}
        >
          <path d="M12 5v14M5 12l7 7 7-7"></path>
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}

