'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

// Define available filters
const REQUIREMENTS = [
  { id: 'no_quarantine', label: 'No Quarantine' },
  { id: 'rabies_titer_test', label: 'Rabies Titer Test Required' },
  // Add more requirements as needed
];

interface PolicyFiltersProps {
  currentSearchTerm: string;
  onSearchChange: (value: string) => void;
}

/**
 * Component for rendering filter controls (search and requirements) for policies.
 * Manages requirement filter state and updates URL params for requirements.
 * Receives search term state and update handler from parent.
 *
 * @param {PolicyFiltersProps} props - Component props.
 * @param {string} props.currentSearchTerm - The current value of the search input.
 * @param {(value: string) => void} props.onSearchChange - Callback function to update the search term in the parent.
 */
export default function PolicyFilters({ currentSearchTerm, onSearchChange }: PolicyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for requirements is still managed here, initialized from URL
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>(
    searchParams.getAll('req') || []
  );

  // Function to update URL search params (only for requirements)
  const updateRequirementParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Only manage 'req' param here
    params.delete('req'); // Clear existing requirements before adding current ones
    selectedRequirements.forEach(req => params.append('req', req));

    // Preserve existing search param if any
    const existingSearch = searchParams.get('search');
    if (existingSearch) {
      params.set('search', existingSearch);
    }

    router.replace(`/directory/policies?${params.toString()}`, { scroll: false });
  }, [selectedRequirements, router, searchParams]);

  // Effect to react to changes ONLY in selectedRequirements
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentReqs = params.getAll('req') || [];

    // Check if state differs from URL params for requirements filter
    if (JSON.stringify(selectedRequirements.sort()) !== JSON.stringify(currentReqs.sort())) {
      updateRequirementParams();
    }
    // Dependency array only includes selectedRequirements and the update function
  }, [selectedRequirements, updateRequirementParams, searchParams]);


  // Handle search input change - call the parent handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  // Handle requirement change - triggers effect to update URL
  const handleRequirementChange = (reqId: string, checked: boolean) => {
    setSelectedRequirements(prev =>
      checked ? [...prev, reqId] : prev.filter(r => r !== reqId)
    );
    // URL update is handled by the useEffect hook reacting to selectedRequirements change
  };

  // Clear all filters - clear local requirements and call parent to clear search
  const clearFilters = () => {
    onSearchChange(''); // Clear search term in parent
    setSelectedRequirements([]);
    // Navigate without any params
    router.push('/directory/policies', { scroll: false });
  };

  // Update local requirements state if URL params change externally
  useEffect(() => {
    setSelectedRequirements(searchParams.getAll('req') || []);
  }, [searchParams]);


  const hasActiveFilters = currentSearchTerm || selectedRequirements.length > 0;

  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Search Input */}
        <div className="md:col-span-3">
          <Label htmlFor="search-country" className="text-sm font-medium text-gray-700 mb-1 block">Search Country</Label>
          <Input
            id="search-country"
            type="text"
            placeholder="e.g., France, Japan..."
            value={currentSearchTerm}
            onChange={handleSearchChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>



        {/* Clear Filters Button */}
        {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1 h-auto"
                >
                    <X className="mr-1 h-4 w-4" /> Clear All Filters
                </Button>
            </div>
        )}
    </div>
  );
} 