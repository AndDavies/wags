import Link from "next/link"
import Image from "next/image"

export default function ChatWithBaggo() {
  return (
    <div className="flex flex-col md:flex-row w-full font-sans tracking-tight bg-white shadow-md">
      {/* Image Section (60%) */}
      <div className="w-full md:w-3/5 bg-[#ffa9dd] p-4 md:p-8 flex items-center justify-center">
        <div className="rounded-3xl overflow-hidden w-full h-full aspect-square relative">
          <Image
            src="/images/chat_with_baggo_1.png"
            alt="Baggo the mascot enjoying a drink at a pet-friendly cafe, representing Wags & Wanders chat assistant"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>

      {/* Text Content Section (40%) */}
      <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          <span className="text-teal-500">START CHATTING</span>
          <br />
          <span className="text-black">WITH </span>
          <span className="text-mustard-500">BAGGO.</span>
        </h2>

        <p className="text-lg text-gray-700 mb-6">
          Dreaming of a pet-friendly escape? Ask Baggo for destination ideas or a full itinerary tailored to your furry
          friend&apos;s needs. Share your favorite experiences—
          <span className="font-semibold text-gray-800">hikes, cafes</span>, or <span className="font-semibold text-gray-800">cozy</span> stays —or
          take our quick quiz to uncover your perfect travel style!
        </p>

        <div className="mt-4">
          <Link
            href="/create-trip"
            className="inline-block bg-teal-500 text-white font-medium py-3 px-8 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Chat Now
          </Link>
        </div>
      </div>
    </div>
  )
}
