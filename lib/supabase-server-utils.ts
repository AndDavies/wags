import { createClient } from '@/lib/supabase-server'; // Use server client
import type { TripData } from '@/store/tripStore'; // Assuming TripData is exported here
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Saves or updates a draft itinerary for a given user.
 * Handles Supabase interaction server-side.
 * 
 * @param userId The ID of the user saving the draft.
 * @param tripData The partial trip data to save.
 * @returns The ID of the saved draft or an error object.
 */
export async function saveDraftItinerary(
  userId: string,
  tripData: Partial<TripData>
): Promise<{ id: string } | { error: Error }> {
  try {
    console.log('[saveDraftItinerary] Saving draft for user:', userId);
    const supabase = await createClient();
    const draftId = tripData.draftId; // Use existing ID if present in payload

    // Prepare data for DB (ensure dates are strings if TripData uses strings)
    const dbPayload = {
        ...tripData,
        // Convert dates to strings if they are Date objects
        startDate: tripData.startDate && typeof tripData.startDate !== 'string' 
                     ? (tripData.startDate as Date).toISOString().split('T')[0] 
                     : tripData.startDate, 
        endDate: tripData.endDate && typeof tripData.endDate !== 'string'
                   ? (tripData.endDate as Date).toISOString().split('T')[0]
                   : tripData.endDate,
    };

    const { data: upsertedDraft, error: upsertError } = await supabase
      .from('draft_itineraries')
      .upsert({ 
        id: draftId,
        user_id: userId,
        trip_data: dbPayload,
        updated_at: new Date().toISOString() 
      })
      .select('id') // Select the ID after upsert
      .single();

    if (upsertError) {
      console.error('[saveDraftItinerary] Supabase upsert error:', upsertError);
      throw new Error(`Database error saving draft: ${upsertError.message}`);
    }

    if (!upsertedDraft?.id) {
        throw new Error('Failed to retrieve draft ID after saving.');
    }

    console.log('[saveDraftItinerary] Draft saved successfully. ID:', upsertedDraft.id);
    return { id: upsertedDraft.id };

  } catch (error) {
    console.error('[saveDraftItinerary] Unexpected error:', error);
    return { error: error instanceof Error ? error : new Error('An unexpected error occurred while saving the draft.') };
  }
}

// Add other server-side Supabase utilities here if needed 