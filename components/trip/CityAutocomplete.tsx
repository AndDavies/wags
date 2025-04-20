'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (country: string) => void;
  placeholder?: string;
  inputId?: string;
  className?: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  place_type: string[];
  center: [number, number];
  context?: Array<{ id: string; text: string }>;
}

export default function CityAutocomplete({
  value,
  onChange,
  onCountryChange,
  placeholder,
  inputId,
  className,
}: CityAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Validate Mapbox token on mount
  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    console.log('[CityAutocomplete] Mapbox Token:', mapboxToken);

    if (!mapboxToken) {
      const errorMsg = 'Mapbox access token is missing. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.local file.';
      console.error('[CityAutocomplete] Token Error:', errorMsg);
      setTokenError(errorMsg);
      return;
    }

    // Test Mapbox token with a simple geocoding request
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${mapboxToken}`
    )
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.message) {
          console.error('[CityAutocomplete] Mapbox Token Validation Failed:', data.message);
          setTokenError(`Mapbox Token Error: ${data.message}`);
        } else {
          console.log('[CityAutocomplete] Mapbox Token Validated Successfully');
          setTokenError(null);
        }
      })
      .catch((error) => {
        console.error('[CityAutocomplete] Mapbox Token Validation Failed:', error);
        setTokenError(error.message);
      });
  }, []);

  const fetchSuggestions = (input: string) => {
    if (!input.trim() || tokenError) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    console.log('[CityAutocomplete] Fetching suggestions for input:', input);

    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${mapboxToken}&types=place&limit=5`
    )
      .then((response) => {
        if (!response.ok) {
          return response.json().then((errorData) => {
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log('[CityAutocomplete] Suggestions fetched:', data.features);
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      })
      .catch((error) => {
        console.error('[CityAutocomplete] Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce the fetch to reduce API calls
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => fetchSuggestions(newValue), 300);
  };

  const handleSuggestionSelect = (feature: MapboxFeature) => {
    console.log('[CityAutocomplete] Suggestion selected:', feature);
    const selectedValue = feature.place_name;
    console.log('[CityAutocomplete] Updating value to:', selectedValue);
    onChange(selectedValue);
    setShowSuggestions(false);

    // Extract country from Mapbox context
    let country = 'Unknown';
    if (feature.context) {
      const countryContext = feature.context.find((ctx) => ctx.id.startsWith('country'));
      if (countryContext) {
        country = countryContext.text;
      }
    }
    console.log('[CityAutocomplete] Country extracted:', country);
    if (onCountryChange) {
      onCountryChange(country);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click events to register
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      {tokenError && (
        <div className="text-red-500 text-sm mb-2">
          {tokenError}
        </div>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          "w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500",
          className
        )}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              onMouseDown={() => handleSuggestionSelect(suggestion)} // Use onMouseDown to capture before blur
              className="px-4 py-2 text-gray-700 hover:bg-teal-50 cursor-pointer"
            >
              {suggestion.place_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}