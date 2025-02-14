import { Suspense } from "react"
import { createClient } from "@/lib/supabase-server"
import PolicyList from "@/components/policies/PolicyList"
import type { Database } from "@/types/supabase"
import { FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

async function getPolicies() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from<"policies", Database["policies"]["Row"]>("policies")
    .select("*")
    .order("country", { ascending: true })

  if (error) {
    console.error("Error fetching policies:", error)
    throw new Error("Failed to fetch policies")
  }

  return data
}

function PolicyListSkeleton() {
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

export default async function PoliciesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-3xl font-bold">
              <FileText className="h-8 w-8 text-primary" />
              Country Policies on Pet Imports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Navigate international pet travel requirements with ease. Find detailed information on vaccination
              requirements, quarantine regulations, and necessary paperwork for bringing your pet to different
              countries.
            </p>
          </CardContent>
        </Card>

        <Suspense fallback={<PolicyListSkeleton />}>
          <PolicyListContent />
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

async function PolicyListContent() {
  try {
    const policies = await getPolicies()
    return <PolicyList policies={policies} />
  } catch (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load policy data. Please try again later.</AlertDescription>
      </Alert>
    )
  }
}

