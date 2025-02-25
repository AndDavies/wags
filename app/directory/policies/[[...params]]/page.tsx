import { getPolicies, getUniqueCountries, getUniquePetTypes } from "@/lib/directory";
import DirectoryPage from "@/components/DirectoryPage";

interface PoliciesPageProps {
  params?: { params?: string[] };
}

function parseFilters(segments: string[] = []): { [key: string]: string } {
  const filters: { [key: string]: string } = {};
  for (let i = 0; i < segments.length; i += 2) {
    filters[segments[i]] = decodeURIComponent(segments[i + 1] || "");
  }
  return filters;
}

export default async function PoliciesPage({ params }: PoliciesPageProps) {
  const segments = params?.params || [];
  const filters = parseFilters(segments);
  const policies = await getPolicies(filters);
  const countries = await getUniqueCountries();
  // If needed, you can also fetch unique pet types here.
  return (
    <DirectoryPage
      category="policies"
      items={policies}
      countries={countries}
      filters={filters}
    />
  );
}
