import { getAirlines, getUniqueCountries } from "@/lib/directory";
import DirectoryPage from "@/components/DirectoryPage";

export default async function AirlinesPage() {
  const airlines = await getAirlines({});
  const countries = await getUniqueCountries();

  return (
    <DirectoryPage
      category="airlines"
      items={airlines}
      countries={countries}
      filters={{}}
    />
  );
}
