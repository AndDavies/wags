'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import * as mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

type GeocoderResult = {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  place_type: string[];
  [key: string]: unknown;
};

type GeocodeResponse = {
  features: GeocoderResult[];
  attribution: string;
  query: string[];
  type: string;
};

type CityAutocompleteProps = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
};

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  label,
  placeholder = 'Search for a city...',
  value,
  onChange,
  id,
  required = false,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<GeocoderResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [errorType, setErrorType] = useState<'token' | 'url-restriction' | 'network' | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<MapboxGeocoder | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  
  // Initialize Mapbox on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Set Mapbox access token
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        console.log('Mapbox token available:', !!accessToken && accessToken !== 'pk.ey...' && accessToken !== 'your_mapbox_access_token');
        
        if (!accessToken || accessToken === 'pk.ey...' || accessToken === 'your_mapbox_access_token') {
          console.warn('Invalid Mapbox access token. Please set a valid token in .env.local');
          setApiAvailable(false);
          setErrorType('token');
          return;
        }
        
        (mapboxgl as any).accessToken = accessToken;
        
        // Create geocoder instance if not already created
        if (!geocoderRef.current) {
          geocoderRef.current = new MapboxGeocoder({
            accessToken: accessToken,
            types: 'place,locality,neighborhood', // Limit results to cities
            mapboxgl: mapboxgl as any,
            marker: false,
            limit: 5,
          });
          console.log('Mapbox geocoder initialized');
        }
        
        // Test the API with a simple request
        const host = window.location.hostname;
        const protocol = window.location.protocol;
        const origin = `${protocol}//${host}`;
        
        // Add the referrer header to work with URL restrictions
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/London.json?access_token=${accessToken}`, {
          headers: {
            'Referer': origin,
            'Origin': origin
          }
        })
          .then(response => {
            if (!response.ok) {
              if (response.status === 403) {
                // 403 Forbidden usually indicates URL restriction issues
                setErrorType('url-restriction');
                throw new Error(`Mapbox API error: 403 - URL restrictions might be in place for this token`);
              }
              throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('Mapbox API test successful', data.features ? `Found ${data.features.length} features` : 'No features found');
            setApiAvailable(true);
            setErrorType(null);
          })
          .catch(err => {
            console.error('Mapbox API test failed:', err);
            setApiAvailable(false);
            if (err.message.includes('403')) {
              setErrorType('url-restriction');
            } else if (err.message.includes('Failed to fetch') || err.message.includes('Network request failed')) {
              setErrorType('network');
            } else {
              setErrorType(null);
            }
            setError('Mapbox API error: ' + err.message);
          });
      } catch (err) {
        console.error('Error initializing Mapbox:', err);
        setApiAvailable(false);
        setErrorType(null);
        setError('Failed to initialize Mapbox: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  }, []);
  
  // Set input value when prop value changes (for parent-controlled state)
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle input changes and fetch suggestions
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onChange(value); // Update parent component value
    
    if (!apiAvailable) {
      console.log('Mapbox API not available, skipping suggestions');
      return;
    }
    
    if (value.length >= 2) {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching suggestions for "${value}"...`);
        const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        
        // Get current origin for referrer header
        const host = window.location.hostname;
        const protocol = window.location.protocol;
        const origin = `${protocol}//${host}`;
        
        // Use Mapbox geocoding API directly with referrer header
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            value
          )}.json?access_token=${accessToken}&types=place,locality,neighborhood&limit=5`,
          {
            headers: {
              'Referer': origin,
              'Origin': origin
            }
          }
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            setErrorType('url-restriction');
            throw new Error(`API returned 403: URL restrictions might be in place for this token`);
          }
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Got ${data.features?.length || 0} suggestions for "${value}"`, data);
        
        if (data.features) {
          setSuggestions(data.features);
          setShowSuggestions(true);
        } else {
          console.warn('No features in response:', data);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(`Failed to get suggestions: ${errorMessage}`);
        setSuggestions([]);
        setShowSuggestions(false);
        
        // Set error type based on error message
        if (errorMessage.includes('403')) {
          setErrorType('url-restriction');
        } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network request failed')) {
          setErrorType('network');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const handleSelectSuggestion = (suggestion: GeocoderResult) => {
    console.log('Selected suggestion:', suggestion);
    const placeName = suggestion.place_name.split(',')[0]; // Get just the city name
    setInputValue(placeName);
    onChange(placeName);
    setShowSuggestions(false);
  };
  
  // If the API is not available, still provide a functional input but without suggestions
  if (!apiAvailable) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id} className={required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}>
          {label}
        </Label>
        <Input
          id={id}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          required={required}
          className={className}
        />
        <div className="flex justify-between items-start">
          <div className="text-xs text-amber-600 flex items-start">
            <AlertCircle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
            <div>
              <p>City suggestions unavailable</p>
              {errorType === 'url-restriction' && (
                <p className="mt-1">URL restriction error: Your Mapbox token may have URL restrictions. Go to <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="underline">Mapbox account</a> and add your website URL to token restrictions.</p>
              )}
            </div>
          </div>
          <Link 
            href="/debug/map-api" 
            className="text-xs text-primary hover:underline flex items-center"
            target="_blank"
          >
            Troubleshoot API
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative space-y-2" ref={wrapperRef}>
      <Label htmlFor={id} className={required ? 'after:content-["*"] after:ml-0.5 after:text-red-500' : ''}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(!!suggestions.length)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          autoComplete="off"
          className={`pr-8 ${isLoading ? 'bg-gray-50' : ''} ${className}`}
          required={required}
          ref={inputRef}
        />
        {isLoading ? (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4">
            <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <MapPin className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
      </div>
      
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="font-medium">{suggestion.place_name.split(',')[0]}</div>
              <div className="text-xs text-gray-500">{suggestion.place_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete; 