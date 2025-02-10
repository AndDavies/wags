"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/card"

const sampleResources = [
  {
    id: 1,
    title: "Alitalia Airlines",
    type: "Airline",
    location: "Rome, Italy",
  },
  {
    id: 2,
    title: "Pet-Friendly Hotel Verona",
    type: "Hotel",
    location: "Verona, Italy",
  },
  {
    id: 3,
    title: "Kingsley Vet Clinic",
    type: "Vet",
    location: "London, UK",
  },
  // More sample data...
]

export default function DashboardDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter resources based on input
  const filteredResources = sampleResources.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Pet Travel Directory</h1>
      <p className="text-gray-600">
        Use the search below to filter airlines, hotels, vets, and more.
      </p>

      {/* Client-side search input */}
      <Input
        placeholder="Search by name or location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <Card
            key={resource.id}
            title={resource.title}
            description={`${resource.type} — ${resource.location}`}
            href="#"
          />
        ))}
      </div>
    </section>
  )
}
