import { getHotels, getUniqueCountries } from "@/lib/directory";
import DirectoryPage from "@/components/DirectoryPage";

export default async function HotelsPage() {
  const hotels = await getHotels({});
  const countries = await getUniqueCountries();

  return (
    <DirectoryPage
      category="hotels"
      items={hotels}
      countries={countries}
      filters={{}}
    />
  );
}
