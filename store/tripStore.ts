import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
}

export interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  activities: Activity[];
  travel?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Itinerary {
  days: ItineraryDay[];
}

export interface PolicyRequirementStep {
  step: number;
  label: string;
  text: string;
}

export interface GeneralPreparationItem {
  requirement: string;
  details: string | { url: string; title: string };
}

// Main data structure stored
interface TripData {
  // Original fields from form
  origin?: string;
  originCountry?: string;
  destination?: string;
  destinationCountry?: string;
  additionalCities?: string[];
  additionalCountries?: string[];
  startDate?: string | undefined;
  endDate?: string | undefined;
  adults?: number;
  children?: number;
  pets?: number;
  petDetails?: { type: string; size: string }[];
  budget?: string;
  accommodation?: string;
  interests?: string[];
  additionalInfo?: string;
  draftId?: string;
  // Added by API
  itinerary?: Itinerary;
  policyRequirements?: PolicyRequirementStep[];
  generalPreparation?: GeneralPreparationItem[];
  preDeparturePreparation?: Activity[];
}

interface TripState {
  tripData: TripData | null; // Store the structured data or null
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
      setTripData: (data) => set({ tripData: data, isSaving: false, error: null }), // Reset status on new data
      clearTrip: () => set({ tripData: null, isSaving: false, error: null }),
      setIsSaving: (saving) => set({ isSaving: saving }),
      setIsLoading: (isLoading) => set({ isLoading: isLoading }),
      setError: (error) => set({ error: error, isSaving: false }),

      addActivity: (dayNumber, activity) => {
        const currentData = get().tripData;
        if (!currentData || !currentData.itinerary) return;

        const updatedDays = currentData.itinerary.days.map(day => {
          if (day.day === dayNumber) {
            // Ensure activities array exists and add the new activity
            const activities = [...(day.activities || []), activity];
            return { ...day, activities };
          }
          return day;
        });

        set({ 
          tripData: { 
            ...currentData, 
            itinerary: { ...currentData.itinerary, days: updatedDays } 
          }
        });
      },

      deleteActivity: (dayNumber, activityIndex) => {
         const currentData = get().tripData;
        if (!currentData || !currentData.itinerary) return;

        const updatedDays = currentData.itinerary.days.map(day => {
          if (day.day === dayNumber) {
            const activities = (day.activities || []).filter((_: Activity, index: number) => index !== activityIndex);
            return { ...day, activities };
          }
          return day;
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
      name: 'tripData', // Keep the same storage key
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);