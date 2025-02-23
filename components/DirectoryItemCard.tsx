"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, MapPinIcon, DollarSignIcon, StarIcon } from "lucide-react"
import type { DirectoryItem } from "@/lib/directory"

interface DirectoryItemCardProps {
  item: DirectoryItem
}

const DirectoryItemCard: React.FC<DirectoryItemCardProps> = ({ item }) => {
  const getTypeColor = (type: DirectoryItem["type"]) => {
    switch (type) {
      case "airlines":
        return "bg-blue-500"
      case "pet_policies":
        return "bg-green-500"
      case "hotels":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString()
  }

  const typeLabel = item.type === "airlines" ? "Airline" : item.type === "pet_policies" ? "Pet Policy" : "Hotel"

  let detailUrl = ""
  if (item.type === "airlines") {
    detailUrl = `/directory/airlines/${item.id}`
  } else if (item.type === "hotels") {
    detailUrl = `/directory/hotels/${item.id}`
  } else if (item.type === "pet_policies") {
    detailUrl = `/directory/policies/${item.id}`
  }

  return (
    <Link href={detailUrl}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold line-clamp-2">{item.name}</CardTitle>
            <Badge className={`${getTypeColor(item.type)} text-white`}>{typeLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {item.country && (
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {item.country}
              </div>
            )}
            {item.fee !== undefined && item.fee !== null && (
              <div className="flex items-center text-muted-foreground">
                <DollarSignIcon className="h-4 w-4 mr-2" />${item.fee} pet fee
              </div>
            )}
            {item.rating && (
              <div className="flex items-center text-muted-foreground">
                <StarIcon className="h-4 w-4 mr-2 text-yellow-400" />
                {item.rating.toFixed(1)} out of 5
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center text-muted-foreground text-xs">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Updated: {formatDate(item.last_updated)}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

export default DirectoryItemCard

