"use server";

import { createClient } from "@/lib/supabase-server";
import type { TripData } from "@/store/tripStore";

/**
 * Server action to save the final itinerary data to the database 
 * after successful authentication (typically called from AuthListener).
 * 
 * @param {string} userId - The authenticated user's ID.
 * @param {TripData} tripData - The complete itinerary data object to save.
 * @returns {Promise<{ success: boolean; error?: string }>} - Object indicating success or failure.
 */
export async function savePendingItineraryAction(
  userId: string, 
  tripData: TripData
): Promise<{ success: boolean; error?: string }> {

  console.log(`[Server Action - savePendingItineraryAction] Received request for user: ${userId}`);
  
  if (!userId || !tripData) {
    console.error("[Server Action - savePendingItineraryAction] Missing userId or tripData.");
    return { success: false, error: "User ID and trip data are required." };
  }

  const supabase = await createClient();

  // Helper to format dates for Supabase (YYYY-MM-DD or null)
  const formatSupabaseDate = (date: string | Date | undefined | null): string | null => {
    if (!date) return null;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.error("[Server Action] Error formatting date:", e, "Original date:", date);
      return null; 
    }
  };

  // Prepare the payload for the 'itineraries' table
  const dbPayload = {
    user_id: userId,
    trip_data: tripData, 
    title: tripData.destination || 'Untitled Trip', // Derive title
    location: tripData.destination || 'Unknown Location',
    start_date: formatSupabaseDate(tripData.startDate),
    end_date: formatSupabaseDate(tripData.endDate),
    // Ensure `updated_at` is set automatically by DB or set here if needed
    // updated_at: new Date().toISOString() 
  };

  console.log("[Server Action - savePendingItineraryAction] Prepared payload (excluding trip_data):");
  console.log({ ...dbPayload, trip_data: '[TripData object]' });

  try {
    const { error: insertError } = await supabase
      .from('itineraries')
      .insert(dbPayload);

    if (insertError) {
      console.error('[Server Action - savePendingItineraryAction] Supabase insert error:', insertError);
      // Consider checking for specific errors, e.g., RLS violations
      return { success: false, error: insertError.message };
    }

    console.log('[Server Action - savePendingItineraryAction] Itinerary saved successfully.');
    // Optional: Consider deleting from draft_itineraries if it exists for this user
    // const { error: deleteDraftError } = await supabase.from('draft_itineraries').delete().match({ user_id: userId });
    // if (deleteDraftError) { console.warn('[Server Action] Failed to delete draft itinerary after final save:', deleteDraftError); }
    
    return { success: true };

  } catch (e) {
    console.error('[Server Action - savePendingItineraryAction] Unexpected error:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown server error saving itinerary.' };
  }
} 