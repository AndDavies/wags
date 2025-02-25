import { getHotels, getUniqueCountries } from "@/lib/directory";
import DirectoryPage from "@/components/DirectoryPage";

interface HotelsPageProps {
  params?: { params?: string[] };
}

function parseFilters(segments: string[] = []): { [key: string]: string } {
  const filters: { [key: string]: string } = {};
  for (let i = 0; i < segments.length; i += 2) {
    filters[segments[i]] = decodeURIComponent(segments[i + 1] || "");
  }
  return filters;
}

export default async function HotelsPage({ params }: HotelsPageProps) {
  const segments = params?.params || [];
  const filters = parseFilters(segments);
  const hotels = await getHotels(filters);
  const countries = await getUniqueCountries();

  return (
    <DirectoryPage
      category="hotels"
      items={hotels}
      countries={countries}
      filters={filters}
    />
  );
}
