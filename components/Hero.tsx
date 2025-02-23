import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PawPrint } from "lucide-react"

const Hero = () => {
  return (
    <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
      {/* Base landscape image */}
      <Image
        src="/placeholders/hero-landscape.png"
        alt="Wags and Wanders Travel Destinations"
        fill
        className="object-cover"
        priority
      />

      {/* Lighter overlay for subtle text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

      {/* Pattern overlay */}
      <div
        className="absolute inset-0 bg-repeat opacity-20"
        style={{
          backgroundImage: 'url("/paw-print-pattern.png")',
          backgroundSize: "100px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full">
        <div className="container mx-auto px-4 h-full">
          <div className="grid lg:grid-cols-2 gap-12 h-full items-center">
            <div className="text-white space-y-6">
              <h1 className="text-4xl sm:text-5xl font-extrabold drop-shadow-lg">
                <PawPrint className="inline-block mr-2 h-12 w-12" />
                Travel Confidently With Your Pet
              </h1>
              <p className="text-xl drop-shadow-lg">
                From personal experience to professional guidance - we help you navigate pet-friendly travel across the
                globe.
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

            <div className="hidden lg:block relative">
              <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/placeholders/baggo_and_family_1.png"
                  alt="Our family traveling with Baggo, our rescue dog"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Real Travelers, Real Solutions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Silhouette image - visible only on mobile */}
      <div className="absolute right-0 bottom-0 h-4/5 w-1/3 lg:hidden">
        <Image
          src="/person-dog-silhouette.png"
          alt="Person walking a dog"
          fill
          className="object-contain object-bottom"
        />
      </div>
    </section>
  )
}

export default Hero

