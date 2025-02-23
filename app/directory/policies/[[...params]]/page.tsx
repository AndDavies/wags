import FilterSidebarPolicies from "@/components/FilterSidebarPolicies"
import DirectoryItemCard from "@/components/DirectoryItemCard"
import { getPolicies, getUniqueCountries, getUniquePetTypes } from "@/lib/directory"
import { FileTextIcon } from "lucide-react"
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"

interface PoliciesPageProps {
  params?: { params?: string[] }
}

function parseFilters(segments: string[] = []): Record<string, string> {
  const filters: Record<string, string> = {}
  for (let i = 0; i < segments.length; i += 2) {
    filters[segments[i]] = decodeURIComponent(segments[i + 1] || "")
  }
  return filters
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const resolvedParams = await Promise.resolve(params)
  const filters = parseFilters(resolvedParams?.params || [])
  const policies = await getPolicies({ country: filters.country, pet_type: filters.pet_type })
  const countries = await getUniqueCountries()
  const pet_types = await getUniquePetTypes()

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DirectoryBreadcrumb currentCategory="policies" />
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <FileTextIcon className="h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold">Policies</CardTitle>
        </CardHeader>
      </Card>
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebarPolicies countries={countries} petTypes={pet_types} />
        <Suspense fallback={<PoliciesLoadingSkeleton />}>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {policies.length === 0 ? (
              <p className="col-span-full text-center text-lg text-muted-foreground">No policies found.</p>
            ) : (
              policies.map((item) => <DirectoryItemCard key={`${item.type}-${item.id}`} item={item} />)
            )}
          </div>
        </Suspense>
      </div>
    </div>
  )
}

function PoliciesLoadingSkeleton() {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  )
}

