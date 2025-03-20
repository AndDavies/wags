// components/Hero.tsx
"use client"

import type React from "react"

import Link from "next/link"
import { Outfit, Pacifico } from "next/font/google"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { PawPrint, MapPin, Compass } from "lucide-react"

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
    <div className={cn("absolute", className)}>
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
  title2 = "Paws & Passports",
}: {
  title1?: string
  title2?: string
}) {
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
        />
        <FloatingImage
          src="/placeholders/hero_floating_wags_and_wanders_2.png"
          alt="Cat in a carrier"
          width={250}
          height={250}
          className="right-[10%] bottom-[15%]"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-8 md:mb-12 fade-in">
            <div className="relative inline-block">
              <Image
                src="/wags_and_wanders_logo_trans.png"
                alt="Wags & Wanders"
                width={140}
                height={140}
                className="mx-auto"
                loading="eager"
              />
              <div
                className="absolute -inset-1 opacity-75 blur-md"
                style={{
                  background:
                    "radial-gradient(circle, rgba(48,184,196,0.3) 0%, rgba(255,229,229,0.2) 70%, rgba(255,255,255,0) 100%)",
                }}
              />
            </div>
          </div>

          <div className="fade-in delay-1">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight leading-tight">
              <span className="text-[#30B8C4] inline-block relative">{title1}</span>
              <br />
              <span className={cn("text-[#FFE5E5]", pacifico.className)}>{title2}</span>
            </h1>
          </div>

          <div className="fade-in delay-2">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              Where every journey becomes a tail-wagging adventure. Expert guidance for seamless pet travel worldwide.
            </p>
          </div>

          {/* Enhanced CTA Section */}
          <div className="relative fade-in delay-3">
            {/* Decorative elements */}
            <div className="absolute -top-6 -left-4 text-[#30B8C4]/20 rotate-icon">
              <PawPrint size={40} />
            </div>
            <div className="absolute -bottom-6 -right-4 text-[#30B8C4]/20 rotate-icon-reverse">
              <Compass size={40} />
            </div>

            {/* Main CTA Button */}
            <div className="mb-6 group">
              <Link href="/create-trip" className="group relative inline-flex">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#30B8C4] to-[#FFE5E5] opacity-75 blur-sm group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <button className="relative flex items-center justify-center gap-2 rounded-full bg-[#30B8C4] px-8 py-4 text-xl font-bold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#30B8C4]/50 w-full hover:scale-[1.03] group-hover:scale-[1.03]">
                  <span className="mr-2">Create Your Pet Adventure</span>
                  <div className="bounce-x">
                    <MapPin size={20} />
                  </div>
                </button>
              </Link>
            </div>

            {/* Secondary CTA */}
            <a
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#30B8C4] px-6 py-3 text-base font-bold text-[#30B8C4] transition-all hover:bg-[#30B8C4] hover:text-white hover:scale-105 transform"
            >
              See How We Help
            </a>
          </div>

          {/* Social proof indicators */}
          <div className="mt-10 pt-6 border-t border-gray-200/30 fade-in delay-4">
            <div className="flex justify-center items-center gap-2 text-sm text-gray-500">
              <span>Trusted by</span>
              <span className="font-bold text-[#30B8C4]">10,000+</span>
              <span>pet travelers</span>
            </div>
          </div>

          {/* Newsletter signup link */}
          <div className="mt-4 fade-in delay-5">
            <NoPrefetchLink href="/join-our-pack" className="text-sm text-[#30B8C4] hover:text-[#FFE5E5] underline">
              Join Our Pack for Travel Tips & Updates
            </NoPrefetchLink>
          </div>
        </div>
      </div>

      <style jsx>{`
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

