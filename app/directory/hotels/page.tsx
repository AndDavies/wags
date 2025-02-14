import { Suspense } from "react"
import { createClient } from "@/lib/supabase-server"
import HotelList from "@/components/hotels/HotelList"
import type { Database } from "@/types/supabase"
import { Hotel } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

async function getHotels() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from<"hotels", Database["hotels"]["Row"]>("hotels")
    .select("*")
    .order("hotel_chain", { ascending: true })

  if (error) {
    console.error("Error fetching hotels:", error)
    throw new Error("Failed to fetch hotels")
  }

  return data
}

function HotelListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function HotelsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl font-bold">
              <Hotel className="h-8 w-8 text-primary" />
              Pet-Friendly Hotels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Discover a wide range of pet-friendly accommodations. From luxury hotels to cozy bed and breakfasts, find
              the perfect stay for you and your furry companion.
            </p>
          </CardContent>
        </Card>

        <Suspense fallback={<HotelListSkeleton />}>
          <HotelListContent />
        </Suspense>

        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link href="/directory">Back to Directory</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

async function HotelListContent() {
  try {
    const hotels = await getHotels()
    return <HotelList hotels={hotels} />
  } catch (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load hotel data. Please try again later.</AlertDescription>
      </Alert>
    )
  }
}

