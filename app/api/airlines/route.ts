import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  //console.log("API Offset:", offset, "Limit:", limit);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("airline_pet_policies_sorted")
    .select("airline, slug, logo, country, fees_usd, last_updated, user_rating")
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching airlines:", error);
    return NextResponse.json({ error: "Failed to fetch airlines" }, { status: 500 });
  }

  //console.log("API response data:", data);
  return NextResponse.json(data || []);
}