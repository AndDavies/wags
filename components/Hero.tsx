// components/Hero.tsx
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Outfit, Pacifico } from "next/font/google";
import Image from "next/image";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"], variable: "--font-pacifico" });

// Custom NoPrefetchLink
const NoPrefetchLink = ({ href, children, ...props }: React.ComponentProps<typeof Link>) => (
  <Link href={href} prefetch={false} {...props}>
    {children}
  </Link>
);

interface FloatingImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  delay?: number;
}

function FloatingImage({ src, alt, width, height, className, delay = 0 }: FloatingImageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn("absolute", className)}
      style={{ background: "transparent" }}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        style={{ background: "transparent" }}
      >
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className="rounded-none"
          style={{ borderRadius: "0", background: "transparent" }}
          loading="lazy" // Optimize load
        />
      </motion.div>
    </motion.div>
  );
}

export function HeroSection({
  title1 = "Explore the World",
  title2 = "With Your Pet By Your Side",
}: {
  title1?: string;
  title2?: string;
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
  };

  return (
    <div className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white ${outfit.variable}`}>
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
            <div className="relative inline-block">
              <Image
                src="/wags_and_wanders_logo_trans.png"
                alt="Wags & Wanders"
                width={140}
                height={140}
                className="mx-auto"
                loading="eager" // Load logo immediately
              />
              <motion.div
                className="absolute -inset-1 opacity-75 blur-md"
                animate={{
                  background: [
                    "radial-gradient(circle, rgba(48,184,196,0.3) 0%, rgba(255,229,229,0.2) 70%, rgba(255,255,255,0) 100%)",
                    "radial-gradient(circle, rgba(255,229,229,0.3) 0%, rgba(48,184,196,0.2) 70%, rgba(255,255,255,0) 100%)",
                    "radial-gradient(circle, rgba(48,184,196,0.3) 0%, rgba(255,229,229,0.2) 70%, rgba(255,255,255,0) 100%)",
                  ],
                }}
                transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                style={{ zIndex: -1 }}
              />
            </div>
          </motion.div>

          <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-6 md:mb-8 tracking-tight leading-tight">
              <span className="text-[#30B8C4] inline-block relative">{title1}</span>
              <br />
              <span className={cn("text-[#FFE5E5]", pacifico.className)}>{title2}</span>
            </h1>
          </motion.div>

          <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              From personal experience to professional guidance - we help you navigate pet-friendly travel across the globe.
            </p>
          </motion.div>

          <motion.div custom={3} variants={fadeUpVariants} initial="hidden" animate="visible" className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.a
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#30B8C4] px-4 py-2 text-base sm:text-lg font-bold text-white transition-all hover:bg-[#FFE5E5] hover:text-[#30B8C4] hover:scale-105 transform"
            >
              Start Your Journey Together
            </motion.a>
            <motion.a
              href="/how-it-works"
              className="inline-flex items-center justify-center rounded-full border-2 border-[#30B8C4] px-4 py-2 text-base sm:text-lg font-bold text-[#30B8C4] transition-all hover:bg-[#30B8C4] hover:text-white hover:scale-105 transform"
            >
              See How We Help
            </motion.a>
          </motion.div>

          <motion.div custom={4} variants={fadeUpVariants} initial="hidden" animate="visible" className="mt-4">
            <NoPrefetchLink href="/join-mailing-list" className="text-sm text-[#30B8C4] hover:text-[#FFE5E5] underline">
              Join Our Pack for Updates
            </NoPrefetchLink>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;