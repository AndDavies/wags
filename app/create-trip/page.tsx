import { createClient } from '@/lib/supabase-server';
import TripBuilderClient from '@/components/trip/TripBuilderClient';

export default async function CreateTripPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let draft = null;
  if (user) {
    const { data, error } = await supabase
      .from('draft_itineraries')
      .select('trip_data')
      .eq('user_id', user.id)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching draft:', error);
    }
    draft = data?.trip_data || null;
  }

  return <TripBuilderClient session={user ? { user } : null} initialDraft={draft} />;
}