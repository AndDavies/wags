import { getPolicies, getUniqueCountries } from "@/lib/directory";
import DirectoryPage from "@/components/DirectoryPage";

export default async function PoliciesPage() {
  const policies = await getPolicies({});
  const countries = await getUniqueCountries();

  return (
    <DirectoryPage
      category="policies"
      items={policies}
      countries={countries}
      filters={{}}
    />
  );
}
