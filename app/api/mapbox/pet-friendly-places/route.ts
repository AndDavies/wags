import { NextRequest, NextResponse } from 'next/server';

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

/**
 * GET handler for retrieving pet-friendly places near a location
 * 
 * Accepts query params:
 * - longitude: number (required)
 * - latitude: number (required)
 * - radius: number in meters (optional, default 2000)
 * - limit: number of results (optional, default 10)
 * - type: type of place (restaurant, hotel, park, etc.) (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Validate Mapbox access token
    if (!MAPBOX_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Mapbox API key is not configured' },
        { status: 500 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const longitude = searchParams.get('longitude');
    const latitude = searchParams.get('latitude');
    const radius = searchParams.get('radius') || '2000'; // Default to 2km
    const limit = searchParams.get('limit') || '10';
    const type = searchParams.get('type') || '';

    // Validate required parameters
    if (!longitude || !latitude) {
      return NextResponse.json(
        { error: 'Missing required parameters: longitude and latitude' },
        { status: 400 }
      );
    }

    // Construct proximity parameter for Mapbox
    const proximity = `${longitude},${latitude}`;

    // Build the query with pet-friendly keywords
    let query = 'pet friendly';
    if (type) {
      query += ` ${type}`;
    }

    // Make request to Mapbox Places API
    const mapboxUrl = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/');
    mapboxUrl.pathname += `${encodeURIComponent(query)}.json`;
    mapboxUrl.searchParams.append('access_token', MAPBOX_ACCESS_TOKEN);
    mapboxUrl.searchParams.append('proximity', proximity);
    mapboxUrl.searchParams.append('limit', limit);
    
    const response = await fetch(mapboxUrl.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', errorText);
      return NextResponse.json(
        { error: `Mapbox API error: ${response.status}` },
        { status: response.status }
      );
    }

    // Parse Mapbox response
    const mapboxData = await response.json();
    
    // First Mapbox results aren't well filtered, so we'll filter them further
    // and enhance with pet-friendly attributes based on place types
    const enhancedPlaces = mapboxData.features
      .filter((feature: any) => {
        // Filter out results that are too far away
        if (feature.center && feature.center.length === 2) {
          const [featureLng, featureLat] = feature.center;
          const distance = calculateDistance(
            parseFloat(latitude), 
            parseFloat(longitude), 
            featureLat, 
            featureLng
          );
          return distance <= parseFloat(radius); // Filter by actual distance
        }
        return false;
      })
      .map((feature: any) => {
        // Calculate actual distance from search point
        const [featureLng, featureLat] = feature.center;
        const distance = calculateDistance(
          parseFloat(latitude), 
          parseFloat(longitude), 
          featureLat, 
          featureLng
        );

        // Determine pet-friendliness score and attributes based on place type
        const petFriendlyScore = determinePetFriendlyScore(feature);
        const petAttributes = getPetAttributes(feature);

        return {
          id: feature.id,
          name: feature.text,
          placeType: feature.place_type,
          category: getPrimaryCategory(feature),
          address: feature.place_name,
          coordinates: {
            latitude: featureLat,
            longitude: featureLng
          },
          distance: Math.round(distance), // Round to nearest meter
          petFriendlyScore,
          petAttributes,
          mapboxData: feature // Include original mapbox data for reference
        };
      })
      .sort((a: any, b: any) => {
        // Sort by pet-friendliness score and then by distance
        if (b.petFriendlyScore !== a.petFriendlyScore) {
          return b.petFriendlyScore - a.petFriendlyScore;
        }
        return a.distance - b.distance;
      });

    return NextResponse.json({
      results: enhancedPlaces,
      total: enhancedPlaces.length,
      searchCenter: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
  } catch (error) {
    console.error('Error in pet-friendly places API:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve pet-friendly places' },
      { status: 500 }
    );
  }
}

/**
 * Calculate Haversine distance between two coordinates in meters
 */
function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // Convert to radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = 
    Math.sin(Δφ/2) * Math.sin(Δφ/2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

/**
 * Determine pet-friendly score (1-5) based on place features
 */
function determinePetFriendlyScore(feature: any): number {
  // Default score
  let score = 3;
  
  // Check place type
  const placeType = feature.place_type?.[0] || '';
  const properties = feature.properties || {};
  const categories = feature.categories || [];
  const text = (feature.text || '').toLowerCase();
  const placeName = (feature.place_name || '').toLowerCase();
  
  // Explicit pet-friendly indicators in name
  if (text.includes('pet') || text.includes('dog') || text.includes('cat') || 
      placeName.includes('pet friendly') || placeName.includes('dog friendly')) {
    score += 2;
  }

  // Score based on place type/category
  if (placeType === 'park' || 
      text.includes('park') || 
      placeName.includes('park') || 
      categories.some((c: any) => c && (typeof c === 'string' ? c.includes('park') : c.id?.includes('park')))) {
    score += 1; // Parks are generally pet-friendly
  }
  
  if (placeType === 'hotel' || text.includes('hotel') || placeName.includes('hotel')) {
    // Hotels are variable, but if explicitly pet-friendly, they're great
    if (text.includes('pet friendly') || placeName.includes('pet friendly')) {
      score += 1;
    }
  }
  
  if (text.includes('vet') || 
      placeName.includes('vet') || 
      text.includes('animal hospital') || 
      placeName.includes('animal hospital')) {
    score += 1; // Veterinary services are obviously pet-friendly
  }

  // Bound score between 1-5
  return Math.max(1, Math.min(5, score));
}

/**
 * Get pet-friendly attributes based on place type
 */
function getPetAttributes(feature: any): string[] {
  const attributes: string[] = [];
  const text = (feature.text || '').toLowerCase();
  const placeName = (feature.place_name || '').toLowerCase();
  
  // Check for common pet-friendly attributes
  if (text.includes('park') || placeName.includes('park')) {
    attributes.push('Outdoor Space');
  }
  
  if (text.includes('trail') || placeName.includes('trail') || 
      text.includes('hiking') || placeName.includes('hiking')) {
    attributes.push('Dog Walking');
  }
  
  if (text.includes('hotel') || placeName.includes('hotel') || 
      text.includes('inn') || placeName.includes('inn') ||
      text.includes('lodging') || placeName.includes('lodging')) {
    attributes.push('Pet-Friendly Accommodation');
  }
  
  if (text.includes('cafe') || placeName.includes('cafe') || 
      text.includes('restaurant') || placeName.includes('restaurant')) {
    attributes.push('Food & Drink');
  }
  
  if (text.includes('vet') || placeName.includes('vet') || 
      text.includes('animal hospital') || placeName.includes('animal hospital')) {
    attributes.push('Veterinary Services');
  }
  
  if (text.includes('shop') || placeName.includes('shop') || 
      text.includes('store') || placeName.includes('store')) {
    attributes.push('Pet Supplies');
  }
  
  // If no specific attributes found, add a generic one
  if (attributes.length === 0) {
    attributes.push('Pet-Friendly');
  }
  
  return attributes;
}

/**
 * Extract primary category from Mapbox feature
 */
function getPrimaryCategory(feature: any): string {
  // Try to get category from properties
  if (feature.properties && feature.properties.category) {
    return feature.properties.category;
  }
  
  // Try to get from place type
  if (feature.place_type && feature.place_type.length > 0) {
    return feature.place_type[0].charAt(0).toUpperCase() + 
           feature.place_type[0].slice(1);
  }
  
  // Try to infer from text
  const text = (feature.text || '').toLowerCase();
  
  if (text.includes('park')) return 'Park';
  if (text.includes('restaurant') || text.includes('cafe')) return 'Dining';
  if (text.includes('hotel') || text.includes('inn')) return 'Accommodation';
  if (text.includes('vet') || text.includes('animal hospital')) return 'Veterinary';
  if (text.includes('shop') || text.includes('store')) return 'Shopping';
  
  // Default category
  return 'Place of Interest';
} 