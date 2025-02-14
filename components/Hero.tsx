import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PawPrint } from "lucide-react"

const Hero = () => {
  return (
    <section className="relative h-[70vh] min-h-[600px] overflow-hidden">
      {/* Base landscape image */}
      <Image src="/placeholders/hero-landscape.png" alt="Wags and Wanders Travel Destinations and Pet Policies" fill className="object-cover" />

      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 bg-black opacity-40" />

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 bg-repeat opacity-40"
        style={{
          backgroundImage: 'url("/paw-print-pattern.png")',
          backgroundSize: "100px",
        }}
      />

      {/* Silhouette image */}
      <div className="absolute right-0 bottom-0 h-4/5 w-1/3">
        <Image
          src="/person-dog-silhouette.png"
          alt="Person walking a dog"
          fill
          className="object-contain object-bottom"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
              <PawPrint className="inline-block mr-2 h-12 w-12" />
              Explore Pet-Friendly Adventures
            </h1>
            <p className="text-xl text-white mb-8 drop-shadow">
              Discover travel experiences that welcome you and your furry friend.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="default" className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href="/directory">Find Your Next Trip</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white hover:bg-white/20"
              >
                <Link href="/how-it-works">How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

