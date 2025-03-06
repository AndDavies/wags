// app/api/policies/[slug]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const { slug } = params;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('pet_policies')
      .select(
        `policy_id, country_id, pet_type, quarantine_required, vaccination_required, microchipping_required, import_permits_required, breed_restrictions, notes, source_references, countries (country_name, iso_code, official_links, additional_info)`
      )
      // Use ilike on the joined country's name.
      .ilike('countries.country_name', `%${slug.replace(/-/g, ' ')}%`)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(data[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
