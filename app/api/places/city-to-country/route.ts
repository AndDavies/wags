import { NextResponse } from 'next/server';
import countryMappings from '@/data/country-mappings.json';

interface CountryMappings {
  [key: string]: string;
}

const mappings: CountryMappings = countryMappings;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    if (!response.ok) throw new Error('Failed to fetch place details');
    const data = await response.json();
    const countryComponent = data.result.address_components.find((comp: any) =>
      comp.types.includes('country')
    );
    if (!countryComponent) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }
    const country = mappings[countryComponent.long_name] || countryComponent.long_name;
    return NextResponse.json({ country });
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json({ error: 'Failed to fetch country' }, { status: 500 });
  }
}