/* eslint-disable @typescript-eslint/no-explicit-any */
import DirectoryItemCard from "@/components/DirectoryItemCard";
import FilterSidebarHotels from "@/components/FilterSidebarHotels";
import { getHotels, getUniqueCountries } from "@/lib/directory";
import { BedIcon } from "lucide-react";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

function parseFilters(segments: string[] = []): Record<string, string> {
  const filters: Record<string, string> = {};
  for (let i = 0; i < segments.length; i += 2) {
    filters[segments[i]] = decodeURIComponent(segments[i + 1] || "");
  }
  return filters;
}

export default async function HotelsPage({ params }: any) {
  // Resolve route params; if not provided, default to an empty array.
  const resolvedParams = await Promise.resolve(params);
  const segments = resolvedParams?.params || [];
  const filters = parseFilters(segments);
  const hotels = await getHotels(filters);
  const countries = await getUniqueCountries();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DirectoryBreadcrumb currentCategory="hotels" />
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <BedIcon className="h-10 w-10 text-primary" />
          <CardTitle className="text-3xl font-bold">Hotels</CardTitle>
        </CardHeader>
      </Card>
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebarHotels countries={countries} />
        <Suspense fallback={<HotelsLoadingSkeleton />}>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hotels.length === 0 ? (
              <p className="col-span-full text-center text-lg text-muted-foreground">
                No hotels found.
              </p>
            ) : (
              hotels.map((item: any) => (
                <DirectoryItemCard key={`${item.type}-${item.id}`} item={item} />
              ))
            )}
          </div>
        </Suspense>
      </div>
    </div>
  );
}

function HotelsLoadingSkeleton() {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}
