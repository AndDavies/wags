import Link from "next/link"
import Image from "next/image"

export default function GetInspired() {
  return (
    <div className="flex flex-col md:flex-row w-full font-sans tracking-tight bg-white shadow-md">
      {/* Text Content Section (40%) */}
      <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          <span className="text-teal-500">GET</span>
          <br />
          <span className="text-mustard-500">INSPIRED.</span>
        </h2>

        <p className="text-lg text-gray-700 mb-6">
          Curious about the perfect pet-friendly getaway? Visit our Inspiration Page, where Baggo and fellow pet
          travelers share pawsome itineraries. Pick one, add it to your trip with a click, and let Baggo customize it
          for you and your furry pal!
        </p>

        <div className="mt-4">
          <Link
            href="/inspiration"
            className="inline-block bg-teal-500 text-white font-medium py-3 px-8 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Get Inspired
          </Link>
        </div>
      </div>

      {/* Image Section (60%) - Fills the panel, constrained to square aspect ratio */}
      <div className="w-full md:w-3/5 order-1 md:order-2 relative aspect-square">
        <Image
          src="/images/get_inspired_2.png"
          alt="Person walking their dog past colorful street art, getting inspired for pet-friendly travel with Wags & Wanders"
          fill
          sizes="(max-width: 768px) 100vw, 60vw" // Adjusted sizes slightly
          className="object-cover" 
        />
      </div>
    </div>
  )
}
