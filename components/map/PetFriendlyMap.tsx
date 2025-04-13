'use client';

import { useEffect, useRef, useState } from 'react';
import type { ViewState, MapRef } from 'react-map-gl';
import Map from 'react-map-gl/dist/esm/components/map';
import Marker from 'react-map-gl/dist/esm/components/marker';
import Popup from 'react-map-gl/dist/esm/components/popup';
import NavigationControl from 'react-map-gl/dist/esm/components/navigation-control';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, MapPin, Coffee, Hotel, PawPrint, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import CityAutocomplete from '@/components/trip/CityAutocomplete';

// Define types for places data
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PetFriendlyPlace {
  id: string;
  name: string;
  placeType: string[];
  category: string;
  address: string;
  coordinates: Coordinates;
  distance: number;
  petFriendlyScore: number;
  petAttributes: string[];
}

interface PetFriendlyMapProps {
  initialLocation?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  onPlaceSelect?: (place: PetFriendlyPlace) => void;
  height?: string;
  width?: string;
}

// Category to icon mapping
const getCategoryIcon = (category: string) => {
  switch(category.toLowerCase()) {
    case 'dining':
    case 'restaurant':
    case 'cafe':
      return <Coffee className="h-4 w-4 mr-1" />;
    case 'accommodation':
    case 'hotel':
      return <Hotel className="h-4 w-4 mr-1" />;
    default:
      return <PawPrint className="h-4 w-4 mr-1" />;
  }
};

// Render stars based on pet-friendly score
const PetFriendlyScore = ({ score }: { score: number }) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <PawPrint 
          key={i} 
          className={`h-3 w-3 ${i < score ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} 
        />
      ))}
    </div>
  );
};

export default function PetFriendlyMap({ 
  initialLocation, 
  onPlaceSelect,
  height = '500px',
  width = '100%'
}: PetFriendlyMapProps) {
  // Default to London if no initial location
  const defaultLocation = {
    latitude: initialLocation?.latitude || 51.5074,
    longitude: initialLocation?.longitude || -0.1278,
    zoom: 13
  };

  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(defaultLocation);
  const [places, setPlaces] = useState<PetFriendlyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PetFriendlyPlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(2000); // 2km default
  const [searchType, setSearchType] = useState('');

  // Fetch pet-friendly places when location or search params change
  useEffect(() => {
    if (!viewState.latitude || !viewState.longitude) return;
    
    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          latitude: viewState.latitude.toString(),
          longitude: viewState.longitude.toString(),
          radius: searchRadius.toString(),
          limit: '15',
          type: searchType
        });
        
        const response = await fetch(`/api/mapbox/pet-friendly-places?${params}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setPlaces(data.results || []);
      } catch (err) {
        console.error('Failed to fetch pet-friendly places:', err);
        setError('Failed to load pet-friendly places. Please try again.');
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaces();
  }, [viewState.latitude, viewState.longitude, searchRadius, searchType]);

  // Handle location selection from the autocomplete
  const handleLocationSelect = (location: any) => {
    if (location && location.center) {
      const [longitude, latitude] = location.center;
      setViewState({
        latitude,
        longitude,
        zoom: 14
      });
      
      // Fly to the location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true
        });
      }
    }
  };

  // Handle place marker click
  const handleMarkerClick = (place: PetFriendlyPlace) => {
    setSelectedPlace(place);
    
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  // Filter category buttons
  const filterButtons = [
    { label: 'All', value: '' },
    { label: 'Parks', value: 'park' },
    { label: 'Cafes', value: 'cafe' },
    { label: 'Hotels', value: 'hotel' },
    { label: 'Vets', value: 'vet' }
  ];

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="mb-2 text-sm font-medium">Search Location</div>
          <CityAutocomplete 
            onLocationSelect={handleLocationSelect}
            placeholder="Search for a city or address"
          />
        </div>
        
        <div className="flex flex-col">
          <div className="mb-2 text-sm font-medium">Search Radius</div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSearchRadius(Math.max(500, searchRadius - 500))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-20 text-center">
              {searchRadius >= 1000 
                ? `${(searchRadius / 1000).toFixed(1)}km` 
                : `${searchRadius}m`}
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSearchRadius(Math.min(10000, searchRadius + 500))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((button) => (
          <Button
            key={button.value}
            variant={searchType === button.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSearchType(button.value)}
          >
            {button.label}
          </Button>
        ))}
      </div>
      
      <div style={{ height, width, position: 'relative' }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          initialViewState={defaultLocation}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onMove={(evt: { viewState: ViewState }) => setViewState(evt.viewState)}
        >
          <NavigationControl position="top-right" />
          
          {/* Center marker */}
          <Marker
            longitude={viewState.longitude}
            latitude={viewState.latitude}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <MapPin className="h-6 w-6 text-blue-600" />
              <div className="text-xs font-semibold bg-white px-1 rounded shadow-sm">
                Center
              </div>
            </div>
          </Marker>
          
          {/* Place markers */}
          {places.map(place => (
            <Marker
              key={place.id}
              longitude={place.coordinates.longitude}
              latitude={place.coordinates.latitude}
              anchor="bottom"
              onClick={() => handleMarkerClick(place)}
            >
              <div className="cursor-pointer">
                <PawPrint className={`h-5 w-5 text-amber-500 ${selectedPlace?.id === place.id ? 'animate-bounce' : ''}`} />
              </div>
            </Marker>
          ))}
          
          {/* Popup for selected place */}
          {selectedPlace && (
            <Popup
              longitude={selectedPlace.coordinates.longitude}
              latitude={selectedPlace.coordinates.latitude}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setSelectedPlace(null)}
              maxWidth="300px"
            >
              <div className="p-1">
                <h3 className="font-bold text-sm">{selectedPlace.name}</h3>
                <div className="text-xs text-gray-600 mb-1">{selectedPlace.address}</div>
                
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-xs">
                    {getCategoryIcon(selectedPlace.category)}
                    {selectedPlace.category}
                  </div>
                  <div className="text-xs text-gray-600">
                    {selectedPlace.distance < 1000 
                      ? `${selectedPlace.distance}m away`
                      : `${(selectedPlace.distance / 1000).toFixed(1)}km away`}
                  </div>
                </div>
                
                <PetFriendlyScore score={selectedPlace.petFriendlyScore} />
                
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedPlace.petAttributes.map((attr, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {attr}
                    </Badge>
                  ))}
                </div>
              </div>
            </Popup>
          )}
        </Map>
        
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <div className="animate-pulse flex items-center">
              <PawPrint className="h-5 w-5 mr-2 text-amber-500" />
              <span>Finding pet-friendly places...</span>
            </div>
          </div>
        )}
      </div>

      {/* Results list on mobile/smaller screens */}
      {places.length > 0 && (
        <div className="md:hidden mt-4">
          <h3 className="text-lg font-semibold mb-2">Nearby Pet-Friendly Places</h3>
          <div className="space-y-2">
            {places.slice(0, 5).map(place => (
              <Card 
                key={place.id} 
                className={`cursor-pointer ${selectedPlace?.id === place.id ? 'border-amber-500' : ''}`}
                onClick={() => handleMarkerClick(place)}
              >
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{place.name}</CardTitle>
                    <PetFriendlyScore score={place.petFriendlyScore} />
                  </div>
                  <CardDescription className="text-xs">
                    {place.distance < 1000 
                      ? `${place.distance}m away`
                      : `${(place.distance / 1000).toFixed(1)}km away`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-0">
                  <div className="flex items-center text-sm mb-2">
                    {getCategoryIcon(place.category)}
                    {place.category}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {place.petAttributes.slice(0, 3).map((attr, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {attr}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 