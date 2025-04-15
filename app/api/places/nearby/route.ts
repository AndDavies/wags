import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { location, type } = await request.json();
    if (!location || !type) {
      return NextResponse.json({ error: 'location and type are required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: cached } = await supabase
      .from('place_cache')
      .select('pet_friendly_data')
      .eq('city_name', location)
      .eq('place_id', `${type}_${location}`)
      .single();

    if (cached?.pet_friendly_data) {
      return NextResponse.json(cached.pet_friendly_data);
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${encodeURIComponent(location)}&radius=5000&type=${type}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    if (!response.ok) throw new Error('Failed to fetch nearby places');
    const data = await response.json();
    const results = data.results || [];

    await supabase.from('place_cache').insert({
      place_id: `${type}_${location}`,
      city_name: location,
      pet_friendly_data: results,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return NextResponse.json({ error: 'Failed to fetch nearby places' }, { status: 500 });
  }
}