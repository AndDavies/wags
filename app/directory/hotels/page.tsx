import React from 'react';
import { createClient } from '@/lib/supabase-server';
import HotelList from '@/components/hotels/HotelList';
import type { Database } from '@/types/supabase';

/**
 * HotelsPage Component
 *
 * This server component fetches hotel data from Supabase and renders the HotelList component.
 */
export default async function HotelsPage() {
  const supabase = await createClient();

  // Use two generic parameters: the table name as a literal ('hotels') and the row type.
  const { data: hotels, error } = await supabase
    .from<'hotels', Database['hotels']['Row']>('hotels')
    .select('*');

  if (error) {
    console.error('Error fetching hotels:', error);
  }

  // Ensure we have an array (default to an empty array if hotels is null).
  const hotelsData = hotels ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pet-Friendly Hotels</h1>
      {error ? (
        <p className="text-red-600">Failed to load hotel data.</p>
      ) : (
        <HotelList hotels={hotelsData} />
      )}
    </div>
  );
}
