import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: cached } = await supabase
      .from('place_cache')
      .select('pet_friendly_data')
      .eq('city_name', query.split(' in ')[1]?.trim())
      .single();

    if (cached?.pet_friendly_data) {
      return NextResponse.json(cached.pet_friendly_data);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    if (!response.ok) throw new Error('Failed to fetch places');
    const data = await response.json();
    const results = data.results || [];

    await supabase.from('place_cache').insert({
      place_id: results[0]?.place_id || query,
      city_name: query.split(' in ')[1]?.trim() || query,
      pet_friendly_data: results,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
  }
}