import { Suspense } from "react"
import { createClient } from "@/lib/supabase-server"
import AirlineList from "@/components/airlines/AirlineList"
import type { Database } from "@/types/supabase"
import { Plane } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

async function getAirlines() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from<"airlines", Database["airlines"]["Row"]>("airlines")
    .select("*")
    // Changed from "name" to "airline" to match your table schema
    .order("airline", { ascending: true })

  if (error) {
    console.error("Error fetching airlines:", error)
    throw new Error("Failed to fetch airlines")
  }

  return data
}

function AirlineListSkeleton() {
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

export default async function AirlinesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl font-bold">
              <Plane className="h-8 w-8 text-primary" />
              Pet-Friendly Airlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Explore our comprehensive directory of airlines that welcome pets on board. Find information on pet
              policies, cabin and cargo options, and breed restrictions.
            </p>
          </CardContent>
        </Card>

        <Suspense fallback={<AirlineListSkeleton />}>
          <AirlineListContent />
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

async function AirlineListContent() {
  try {
    const airlines = await getAirlines()
    return <AirlineList airlines={airlines} />
  } catch (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load airline data. Please try again later.</AlertDescription>
      </Alert>
    )
  }
}
