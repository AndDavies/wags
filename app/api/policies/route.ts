// app/api/policies/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    // Parse query parameters for pagination.
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const start = (page - 1) * limit;
    const end = page * limit - 1;

    const supabase = await createClient();
    const { data, error, count } = await supabase
      .from('pet_policies')
      .select(
        `policy_id, country_id, pet_type, quarantine_required, vaccination_required, microchipping_required, import_permits_required, breed_restrictions, notes, source_references, countries (country_name, iso_code, official_links, additional_info, flag_path)`,
        { count: 'exact' }
      )
      .range(start, end)
      .order('policy_id', { ascending: true });

    if (error) {
      console.error('API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('API returned:', { data, count });
    return NextResponse.json({ data, count, page, limit });
  } catch (err: any) {
    console.error('Unexpected API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}