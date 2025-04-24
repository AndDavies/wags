'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import PolicyFilters from '@/components/directory/PolicyFilters';
import CountriesList from './CountriesList';
import { CountryData } from './page';

// Debounce utility (copied from PolicyFilters for use here)
const debounce = <T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): ((...args: T) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface PoliciesClientWrapperProps {
  initialCountries: CountryData[];
}

/**
 * Client component wrapper for the policies directory page.
 * Manages client-side search filtering and renders the filters and country list.
 *
 * @param {PoliciesClientWrapperProps} props - Component props.
 * @param {CountryData[]} props.initialCountries - The initial list of countries fetched on the server.
 */
export default function PoliciesClientWrapper({ initialCountries }: PoliciesClientWrapperProps) {
  // Use searchParams to get the *initial* search term if provided in URL on first load.
  // Subsequent searches will update the searchTerm state directly.
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearch);

  // Debounce the setting of the term used for filtering
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchTerm(value);
    }, 300), // 300ms debounce delay
    []
  );

  // Update search term and trigger debounced update
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSetSearch(value);
  };

  // Filter countries based on the debounced search term
  const filteredCountries = useMemo(() => {
    if (!debouncedSearchTerm) {
      return initialCountries;
    }
    const lowerCaseSearch = debouncedSearchTerm.toLowerCase();
    return initialCountries.filter(country =>
      country.name.toLowerCase().includes(lowerCaseSearch)
    );
  }, [initialCountries, debouncedSearchTerm]);

  return (
    <div>
      {/* Pass search term and handler down, PolicyFilters will handle requirement filters via URL */}
      <PolicyFilters
        currentSearchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      <div className="mt-8">
        <CountriesList countries={filteredCountries} />
      </div>
    </div>
  );
} 