import Image from "next/image"
import { PawPrintIcon as Paw, Globe, CheckCircle } from "lucide-react"

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center mb-8">About Us – Wags and Wanders</h1>
      <h2 className="text-2xl font-semibold text-center mb-6">Your AI-Powered Pet Travel Companion</h2>

      <p className="text-lg mb-8">
        At Wags and Wanders, we believe that no adventure should leave your pet behind. Founded by Andrew & Ashley, our
        journey began with a street dog named Baggo and evolved into a mission to transform the way pet parents travel
        with their furry companions.
      </p>

      <section className="mb-12 flex flex-col md:flex-row items-start gap-6">
        <div className="md:w-1/3 flex-shrink-0">
          <Image
            src="/placeholders/bags_ashley_wags_and_wanders.png"
            alt="Founders with Baggo"
            width={300}
            height={400}
            className="rounded-lg shadow-md"
          />
        </div>
        <div className="flex-grow">
          <h3 className="text-2xl font-semibold mb-4">Our Story</h3>
          <p className="mb-4">
            Our first experience with pet travel wasn't planned—it started when we met Baggo, an abandoned dog in Puerto
            Vallarta, Mexico. Navigating the complex regulations, airline policies, and health requirements to bring him
            home to Canada opened our eyes to the gaps in pet travel resources.
          </p>
          <p className="mb-4">
            Later, as we embraced a nomadic lifestyle, studying and working abroad, we encountered firsthand the
            frustrations, misinformation, and last-minute hurdles that come with international pet travel.
          </p>
          <p>
            We met pet owners turned away at airport check-ins, stuck in bureaucratic nightmares, and forced into costly
            delays—all due to fragmented, outdated, or hard-to-find information. This inspired us to build Wags and
            Wanders, an AI-powered solution designed to make pet travel seamless, stress-free, and fully informed.
          </p>
        </div>
      </section>

      <section className="mb-12 flex flex-col md:flex-row-reverse items-start gap-6">
        <div className="md:w-1/3 flex-shrink-0">
          <Image
            src="/placeholders/bags_andrew_wags.jpeg"
            alt="Pet traveling"
            width={300}
            height={400}
            className="rounded-lg shadow-md"
          />
        </div>
        <div className="flex-grow">
          <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
          <p className="mb-4">
            We are creating the world's first AI-powered pet travel companion, offering an end-to-end solution that
            consolidates itinerary planning, travel regulations, document management, and community-driven insights—all
            in one intuitive platform.
          </p>
          <p className="mb-6">With Wags and Wanders, pet owners can:</p>
          <ul className="space-y-2">
            {[
              "Navigate pet travel requirements with AI-enabled clarity",
              "Track vaccinations, paperwork, and airline policies effortlessly",
              "Avoid last-minute surprises at check-in and border crossings",
              "Connect with a global community of pet travelers for tips and insights",
            ].map((feature, index) => (
              <li key={index} className="flex items-start">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-lg mb-8">
        Our vision is to eliminate the guesswork and give pet parents the confidence to explore the world with their
        pets—stress-free.
      </p>

      <div className="text-center">
        <p className="text-xl font-semibold mb-4">
          <Globe className="inline-block mr-2 h-6 w-6" />
          Join us in redefining pet travel.
        </p>
        <p className="text-lg">
          Because every journey is better with a wagging tail.
          <Paw className="inline-block ml-2 h-6 w-6" />
        </p>
      </div>
    </div>
  )
}

