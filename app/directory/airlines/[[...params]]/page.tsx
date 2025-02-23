import FilterSidebarAirlines from "@/components/FilterSidebarAirlines";
import DirectoryItemCard from "@/components/DirectoryItemCard";
import { getAirlines, getUniqueCountries } from "@/lib/directory";
import { Airplay } from "lucide-react";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface AirlinesPageProps {
  params: { params: string[] };
}

function parseFilters(segments: string[] = []): Record<string, string> {
  const filters: Record<string, string> = {};
  for (let i = 0; i < segments.length; i += 2) {
    filters[segments[i]] = decodeURIComponent(segments[i + 1] || "");
  }
  return filters;
}

export default async function AirlinesPage({ params }: AirlinesPageProps) {
  const filters = parseFilters(params.params || []);
  const airlines = await getAirlines(filters);
  const countries = await getUniqueCountries();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DirectoryBreadcrumb currentCategory="airlines" />
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <Airplay className="h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold">Airlines</CardTitle>
        </CardHeader>
      </Card>
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebarAirlines countries={countries} />
        <Suspense fallback={<AirlinesLoadingSkeleton />}>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {airlines.length === 0 ? (
              <p className="col-span-full text-center text-lg text-muted-foreground">
                No airlines found.
              </p>
            ) : (
              airlines.map((item) => (
                <DirectoryItemCard key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </div>
        </Suspense>
      </div>
    </div>
  );
}

function AirlinesLoadingSkeleton() {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}
