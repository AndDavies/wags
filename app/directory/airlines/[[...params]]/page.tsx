import { getAirlines, getUniqueCountries } from "@/lib/directory";
import DirectoryPage from "@/components/DirectoryPage";

interface AirlinesPageProps {
  params: { params: string[] };
}

function parseFilters(segments: string[]): { [key: string]: string } {
  const filters: { [key: string]: string } = {};
  for (let i = 0; i < segments.length; i += 2) {
    filters[segments[i]] = decodeURIComponent(segments[i + 1] || "");
  }
  return filters;
}

export default async function AirlinesPage({ params }: AirlinesPageProps) {
  const segments = params.params; // Guaranteed to be defined (even if empty)
  const filters = parseFilters(segments);
  const airlines = await getAirlines(filters);
  const countries = await getUniqueCountries();

  return (
    <DirectoryPage
      category="airlines"
      items={airlines}
      countries={countries}
      filters={filters}
    />
  );
}
