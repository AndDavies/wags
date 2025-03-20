// components/Hero.tsx
"use client"

import type React from "react"

import Link from "next/link"
import { Outfit, Pacifico } from "next/font/google"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PawPrint, MapPin, Compass } from "lucide-react"
import { useEffect, useState } from "react"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"], variable: "--font-pacifico" })

// Custom NoPrefetchLink
const NoPrefetchLink = ({ href, children, ...props }: React.ComponentProps<typeof Link>) => (
  <Link href={href} prefetch={false} {...props}>
    {children}
  </Link>
)

interface FloatingImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

function FloatingImage({ src, alt, width, height, className }: FloatingImageProps) {
  return (
    <div className={cn("absolute hidden md:block", className)}>
      <div className="hover-float">
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className="rounded-none"
          style={{ borderRadius: "0", background: "transparent" }}
          loading="lazy"
        />
      </div>
    </div>
  )
}

export function HeroSection({
  title1 = "Unleash Adventures",
  title2 = "Wags & Wanders",
}: {
  title1?: string
  title2?: string
}) {
  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false)

  // Effect to check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkMobile()

    // Add event listener for resize
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div
      className={`relative w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#30B8C4] via-[#30B8C4]/90 to-[#30B8C4]/80 ${outfit.variable}`}
      style={{ minHeight: "calc(100vh - 20px)" }}
    >
      {/* Mobile background pattern */}
      <div className="absolute inset-0 md:hidden opacity-10">
        <div className="absolute inset-0 bg-pattern"></div>
      </div>

      {/* Floating images - only visible on desktop */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <FloatingImage
          src="/placeholders/hero_floating_wags_and_wanders_1.png"
          alt="Dog on a beach"
          width={250}
          height={250}
          className="left-[5%] top-[30%]"
        />
        <FloatingImage
          src="/placeholders/hero_floating_wags_and_wanders_2.png"
          alt="Cat in a carrier"
          width={200}
          height={200}
          className="right-[10%] bottom-[15%]"
        />
      </div>

      <div className="relative z-20 container mx-auto px-4 md:px-6 py-16 pt-28 md:py-20 md:pt-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-4 md:mb-6 fade-in">
            <div className="relative inline-block">
              <Image
                src="/wags_and_wanders_logo_trans.png"
                alt="Wags & Wanders"
                width={120}
                height={120}
                className="mx-auto"
                loading="eager"
              />
              <div
                className="absolute -inset-1 opacity-75 blur-md"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,229,229,0.2) 70%, rgba(255,255,255,0) 100%)",
                }}
              />
            </div>
          </div>

          <div className="fade-in delay-1">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 tracking-tight leading-tight text-white">
              <span className="inline-block relative drop-shadow-md">{title1}</span>
              <br />
              <span className={cn("text-[#FFE5E5]", pacifico.className)}>{title2}</span>
            </h1>
          </div>

          <div className="fade-in delay-2">
            <p className="text-base sm:text-lg md:text-xl text-white mb-6 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4 drop-shadow-sm">
              Where every journey becomes a tail-wagging adventure. Expert guidance for seamless pet travel worldwide.
            </p>
          </div>

          {/* Enhanced CTA Section */}
          <div className="relative fade-in delay-3">
            {/* Decorative elements - only visible on desktop */}
            <div className="absolute -top-6 -left-4 text-white/20 rotate-icon hidden md:block">
              <PawPrint size={40} />
            </div>
            <div className="absolute -bottom-6 -right-4 text-white/20 rotate-icon-reverse hidden md:block">
              <Compass size={40} />
            </div>

            {/* Main CTA Button */}
            <div className="mb-4 group">
              <Link href="/create-trip" className="group relative inline-flex">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-white to-[#FFE5E5] opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <button className="relative flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-lg font-bold text-[#30B8C4] transition-all duration-200 hover:shadow-lg hover:shadow-black/20 w-full hover:scale-[1.03] group-hover:scale-[1.03]">
                  <span className="mr-2">Create Your Pet Adventure</span>
                  <div className="bounce-x">
                    <MapPin size={18} />
                  </div>
                </button>
              </Link>
            </div>

            {/* Secondary CTA */}
            <a
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full border-2 border-white px-5 py-2 text-base font-bold text-white transition-all hover:bg-white hover:text-[#30B8C4] hover:scale-105 transform"
            >
              See How We Help
            </a>
          </div>

          {/* Social proof indicators */}
          <div className="mt-6 pt-4 border-t border-white/20 fade-in delay-4">
            <div className="flex justify-center items-center gap-2 text-sm text-white">
              <span>Trusted by</span>
              <span className="font-bold">10,000+</span>
              <span>pet travelers</span>
            </div>
          </div>

          {/* Newsletter signup link */}
          <div className="mt-2 fade-in delay-5">
            <NoPrefetchLink href="/join-our-pack" className="text-sm text-white hover:text-[#FFE5E5] underline">
              Join Our Pack for Travel Tips & Updates
            </NoPrefetchLink>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .delay-1 {
          animation-delay: 0.2s;
        }
        
        .delay-2 {
          animation-delay: 0.4s;
        }
        
        .delay-3 {
          animation-delay: 0.6s;
        }
        
        .delay-4 {
          animation-delay: 0.8s;
        }
        
        .delay-5 {
          animation-delay: 1s;
        }
        
        .hover-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .rotate-icon {
          animation: rotateSlow 6s ease-in-out infinite;
        }
        
        .rotate-icon-reverse {
          animation: rotateSlowReverse 7s ease-in-out infinite;
        }
        
        .bounce-x {
          animation: bounceX 1.5s infinite;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(15px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        
        @keyframes rotateSlow {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(15deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        
        @keyframes rotateSlowReverse {
          0% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(-15deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        
        @keyframes bounceX {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </div>
  )
}

export default HeroSection

