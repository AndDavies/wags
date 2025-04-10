import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import TripBuilderClient from './client-page';

export const metadata = {
  title: 'Create a Trip | Wags & Wanders',
  description: 'Plan your perfect pet-friendly trip with our interactive trip builder. Find pet-friendly destinations, accommodations, and activities.',
};

export default async function CreateTrip() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // This will be the main trip builder page
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex flex-col space-y-6">
        <TripBuilderClient />
      </div>
    </div>
  );
}
