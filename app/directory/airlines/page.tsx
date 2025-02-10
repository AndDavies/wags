// app/directory/airlines/page.tsx
import React from 'react';
import { createClient } from '@/lib/supabase-server';
import AirlineCard from '@/components/airlines/AirlineCard';

export default async function AirlinesPage() {
  // Create a Supabase server client
  const supabase = await createClient();

  // Fetch all airline data from the "airlines" table
  const { data: airlines, error } = await supabase.from('airlines').select('*');

  if (error) {
    console.error('Error fetching airlines:', error);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pet-Friendly Airlines</h1>
      {error ? (
        <p className="text-red-600">Failed to load airline data.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {airlines?.map((airline: any) => (
            <AirlineCard key={airline.id} airline={airline} />
          ))}
        </div>
      )}
    </div>
  );
}
