import Link from "next/link";
import { Suspense } from "react";
import { Airplay, Hotel, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DirectoryItemCard from "@/components/DirectoryItemCard";
import DirectoryBreadcrumb from "@/components/DirectoryBreadcrumb";
import { DirectoryItem } from "@/lib/directory";

interface DirectoryPageProps {
  category: "airlines" | "hotels" | "policies";
  items: DirectoryItem[];
  countries: { value: string; count: number }[];
  filters: { [key: string]: string };
}

const categoryInfo = {
  airlines: { title: "Airlines", icon: Airplay },
  hotels: { title: "Hotels", icon: Hotel },
  policies: { title: "Policies", icon: FileText },
};

export default function DirectoryPage({
  category,
  items,
  countries,
  filters,
}: DirectoryPageProps) {
  const { title, icon: Icon } = categoryInfo[category];

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Spacer to push content below fixed navbar */}
      <div className="mt-20" />

      {/* Directory Navigation Tabs */}
      <nav className="flex justify-center gap-8 mb-8">
        {Object.entries(categoryInfo).map(([key, value]) => (
          <Link
            key={key}
            href={`/directory/${key}`}
            className={`text-xl font-bold ${
              category === key ? "text-brand-teal" : "text-offblack hover:text-brand-pink"
            }`}
          >
            {value.title}
          </Link>
        ))}
      </nav>

      {/* Filter Options */}
      <div className="mb-8 flex justify-center">
        <form method="get" action={`/directory/${category}`} className="flex items-center gap-4">
          <select
            name="country"
            className="p-2 border rounded-md border-brand-teal text-offblack"
            defaultValue={filters.country}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value} ({c.count})
              </option>
            ))}
          </select>
          <Button type="submit" className="bg-brand-teal text-white hover:bg-brand-pink hover:text-offblack">
            Filter
          </Button>
        </form>
      </div>

      {/* Page Title */}
      <Card className="bg-brand-pink border-none shadow-md">
        <CardHeader className="flex flex-row items-center space-x-4">
          <Icon className="h-12 w-12 text-brand-teal" />
          <CardTitle className="text-4xl font-display text-brand-teal">{title}</CardTitle>
        </CardHeader>
      </Card>

      {/* Breadcrumb */}
      <DirectoryBreadcrumb currentCategory={category} />

      {/* Grid of Directory Items */}
      <Suspense fallback={<DirectoryLoadingSkeleton />}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <p className="col-span-full text-center text-lg text-offblack">
              No {category} found.
            </p>
          ) : (
            items.map((item) => <DirectoryItemCard key={`${item.type}-${item.id}`} item={item} />)
          )}
        </div>
      </Suspense>
    </div>
  );
}

function DirectoryLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-48" />
      ))}
    </div>
  );
}
