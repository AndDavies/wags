import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// --- Utility Function to Parse Time --- 

/**
 * Parses a time string (e.g., "9:00 AM", "14:30", "5pm") into minutes past midnight.
 * Returns a large number if the time is invalid or missing, placing them at the end.
 * @param timeString The time string to parse.
 * @returns Minutes past midnight or a large number (for sorting).
 */
const parseTimeToMinutes = (timeString?: string): number => {
  if (!timeString) {
    return 9999; // Place activities without time at the end
  }
  const cleanedTime = timeString.toLowerCase().replace(/\s+/g, '');
  let hours = 0;
  let minutes = 0;

  // Try matching HH:MM am/pm format
  let match = cleanedTime.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const period = match[3];
    if (period === 'pm' && hours < 12) {
      hours += 12;
    }
    if (period === 'am' && hours === 12) { // Midnight case
      hours = 0;
    }
  } else {
    // Try matching H(am/pm) format (e.g., "5pm", "9am")
    match = cleanedTime.match(/^(\d{1,2})(am|pm)?$/);
    if (match) {
      hours = parseInt(match[1], 10);
      const period = match[2];
      if (period === 'pm' && hours < 12) {
        hours += 12;
      }
      if (period === 'am' && hours === 12) {
        hours = 0;
      }
    }
    // Add more parsing logic if needed (e.g., 24-hour format without colon)
    else {
        // Basic 24h check like "1430"
        match = cleanedTime.match(/^(\d{2})(\d{2})$/);
        if(match && cleanedTime.length === 4) {
            hours = parseInt(match[1], 10);
            minutes = parseInt(match[2], 10);
        } else {
             console.warn(`[parseTimeToMinutes] Could not parse time: ${timeString}`);
             return 9999; // Treat unparseable times as having no time
        }
    }
  }

  // Validate parsed hours and minutes
  if (isNaN(hours) || hours < 0 || hours > 23 || isNaN(minutes) || minutes < 0 || minutes > 59) {
    console.warn(`[parseTimeToMinutes] Invalid time after parsing: ${timeString} -> H:${hours} M:${minutes}`);
    return 9999;
  }

  return hours * 60 + minutes;
};

// Export core data structure interfaces
export interface Activity {
  name: string;
  description: string;
  petFriendly: boolean;
  location: string;
  coordinates: { lat: number; lng: number };
  startTime?: string;
  endTime?: string;
  cost?: string;
  type?: 'flight' | 'transfer' | 'accommodation' | 'meal' | 'activity' | 'placeholder' | 'preparation';
  place_id?: string;
  website?: string;
  phone_number?: string;
  opening_hours?: string;
  photo_references?: any[];
  booking_link?: string;
  pet_friendliness_details?: string;
  estimated_duration?: number;
  rating?: number;
  user_ratings_total?: number;
}

export interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  activities: Activity[];
  preparation?: GeneralPreparationItem[];
  travel?: string;
  narrative_intro?: string;
  narrative_outro?: string;
}

export interface Itinerary {
  days: ItineraryDay[];
}

// --- NEW: Interface for the Assistant's expected Itinerary Summary structure ---
export interface ItineraryActivitySummary {
  name: string;
  type?: Activity['type']; // Use existing Activity type for consistency
  location: string;
}

export interface ItineraryDaySummary {
  day: number;
  date: string;
  city: string;
  activityCount: number;
  keyActivities: ItineraryActivitySummary[];
}
// --- END NEW ---

export interface PolicyRequirementStep {
  step: number;
  label: string;
  text: string;
}

export interface GeneralPreparationItem {
  requirement: string;
  details: string | { url: string; title: string };
  additionalInfo?: string;
  draftId?: string;
  itinerary?: Itinerary;
  itinerarySummary?: ItineraryDaySummary[];
  policyRequirements?: PolicyRequirementStep[];
  generalPreparation?: GeneralPreparationItem[];
  preDeparturePreparation?: Activity[];
}

// Main data structure for the trip
export interface TripData {
  origin?: string;
  originCountry?: string;
  destination?: string;
  destinationCountry?: string;
  destinationSlug?: string;
  additionalCities?: string[];
  additionalCountries?: string[];
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  adults?: number;
  children?: number;
  pets?: number;
  petDetails?: { type: string; size: string }[];
  budget?: string;
  accommodation?: string[];
  interests?: string[];
  additionalInfo?: string;
  draftId?: string;
  itinerary?: Itinerary;
  itinerarySummary?: ItineraryDaySummary[];
  policyRequirements?: PolicyRequirementStep[];
  generalPreparation?: GeneralPreparationItem[];
  preDeparturePreparation?: Activity[];
  learnedPreferences?: Array<{ type: string; detail: string; item_reference?: string }>;
}

interface TripState {
  tripData: TripData | null;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  setTripData: (data: TripData | null) => void;
  clearTrip: () => void;
  addActivity: (day: number, activity: Activity) => void;
  deleteActivity: (day: number, activityIndex: number) => void;
  setIsSaving: (saving: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      tripData: null,
      isSaving: false,
      isLoading: false,
      error: null,
      setTripData: (data) => set({ tripData: data, isSaving: false, isLoading: false, error: null }),
      clearTrip: () => {
        sessionStorage.removeItem('tripData');
        set({ tripData: null, isSaving: false, isLoading: false, error: null });
      },
      setIsSaving: (saving) => set({ isSaving: saving }),
      setIsLoading: (isLoading) => set({ isLoading: isLoading }),
      setError: (error) => set({ error: error, isSaving: false, isLoading: false }),
      addActivity: (day, activity) => {
        const currentData = get().tripData;
        if (!currentData || !currentData.itinerary) return;

        const updatedDays = currentData.itinerary.days.map(dayItem => {
          if (dayItem.day === day) {
            // 1. Add the new activity
            let activities = [...(dayItem.activities || []), activity];

            // 2. Sort activities by startTime
            activities.sort((a, b) => {
              const timeA = parseTimeToMinutes(a.startTime);
              const timeB = parseTimeToMinutes(b.startTime);
              return timeA - timeB;
            });

            return { ...dayItem, activities };
          }
          return dayItem;
        });

        set({
          tripData: {
            ...currentData,
            itinerary: { ...currentData.itinerary, days: updatedDays }
          }
        });
      },
      deleteActivity: (day, activityIndex) => {
        const currentData = get().tripData;
        if (!currentData || !currentData.itinerary) return;

        const updatedDays = currentData.itinerary.days.map(dayItem => {
          if (dayItem.day === day) {
            const activities = (dayItem.activities || []).filter((_, index) => index !== activityIndex);
            // No need to re-sort after deletion unless desired
            return { ...dayItem, activities };
          }
          return dayItem;
        });

        set({
          tripData: {
            ...currentData,
            itinerary: { ...currentData.itinerary, days: updatedDays }
          }
        });
      },
    }),
    {
      name: 'tripData',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);