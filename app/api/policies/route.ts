import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { CountryData } from "@/app/directory/policies/page";

// Type for raw Supabase data
type SupabasePolicy = {
  country_name: string;
  slug: string;
  flag_path: string;
  quarantine_info: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pet_policies")
    .select("country_name, slug, flag_path, quarantine_info")
    .order("country_name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
  }

  // Map to CountryData format
  const countries: CountryData[] = (data || []).map((policy: SupabasePolicy) => ({
    name: policy.country_name,
    slug: policy.slug,
    flag: policy.flag_path,
    quarantine: policy.quarantine_info,
  }));

  return NextResponse.json(countries);
}