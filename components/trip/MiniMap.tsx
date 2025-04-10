'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoibWFkYXZpZXMiLCJhIjoiY205Ym1zM2xhMGliazJsb29ucXJlbDd4dCJ9._tnjqUf-zyVLl8tP9yEJOA';

type LocationType = {
  id: string;
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  type: 'hotel' | 'activity' | 'restaurant' | 'vet' | 'transport';
  isPetFriendly?: boolean;
};

interface MiniMapProps {
  locations: LocationType[];
  centerLocation?: string; // Location name to center the map on
  height?: string;
  width?: string;
  zoom?: number;
}

export function MiniMap({ 
  locations, 
  centerLocation, 
  height = '200px', 
  width = '100%',
  zoom = 13 
}: MiniMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Function to geocode a location name to coordinates
  const geocodeLocation = async (locationName: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${mapboxgl.accessToken}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }
      
      return null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  };
  
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    const initializeMap = async () => {
      // If we have centerLocation but no coordinates in locations, geocode it
      let centerCoordinates: [number, number] | null = null;
      
      if (centerLocation) {
        // Check if we already have this location in our locations array
        const existingLocation = locations.find(loc => loc.name === centerLocation);
        
        if (existingLocation) {
          centerCoordinates = existingLocation.coordinates;
        } else {
          centerCoordinates = await geocodeLocation(centerLocation);
        }
      }
      
      // If we still don't have coordinates and have locations, use the first one
      if (!centerCoordinates && locations.length > 0) {
        centerCoordinates = locations[0].coordinates;
      }
      
      // Default to a generic location if we still don't have coordinates
      if (!centerCoordinates) {
        centerCoordinates = [-74.5, 40]; // Default to NYC area
      }
      
      // Initialize the map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: centerCoordinates,
        zoom: zoom
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.current.on('load', () => {
        setIsLoaded(true);
      });
    };
    
    initializeMap();
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [centerLocation]);
  
  // Add markers when the map is loaded or locations change
  useEffect(() => {
    if (!map.current || !isLoaded) return;
    
    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    // Add markers for all locations
    locations.forEach(location => {
      const markerElement = document.createElement('div');
      markerElement.className = 'flex flex-col items-center';
      
      // Create marker element with appropriate styling based on type
      const markerIcon = document.createElement('div');
      markerIcon.className = `w-6 h-6 rounded-full flex items-center justify-center text-white
        ${location.type === 'hotel' ? 'bg-blue-600' : 
          location.type === 'activity' ? 'bg-green-600' : 
          location.type === 'restaurant' ? 'bg-orange-600' :
          location.type === 'vet' ? 'bg-red-600' : 'bg-purple-600'}`;
        
      // Add the appropriate icon
      markerIcon.innerHTML = location.type === 'hotel' ? 'H' :
        location.type === 'activity' ? 'A' :
        location.type === 'restaurant' ? 'R' :
        location.type === 'vet' ? 'V' : 'T';
        
      // Add pet-friendly indicator if applicable
      if (location.isPetFriendly) {
        const petFriendlyIndicator = document.createElement('div');
        petFriendlyIndicator.className = 'w-3 h-3 bg-primary rounded-full absolute -top-1 -right-1';
        markerIcon.appendChild(petFriendlyIndicator);
      }
      
      markerElement.appendChild(markerIcon);
      
      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<strong>${location.name}</strong>
         <p>${location.type.charAt(0).toUpperCase() + location.type.slice(1)}</p>
         ${location.isPetFriendly ? '<p class="text-primary font-medium">Pet-Friendly</p>' : ''}`
      );
      
      // Add marker to map
      new mapboxgl.Marker(markerElement)
        .setLngLat(location.coordinates)
        .setPopup(popup)
        .addTo(map.current!);
    });
  }, [locations, isLoaded]);
  
  return (
    <div 
      ref={mapContainer} 
      style={{ height, width, borderRadius: '0.5rem' }}
      className="border border-gray-200"
    />
  );
} 