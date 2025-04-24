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

export interface PolicyRequirementStep {
  step: number;
  label: string;
  text: string;
}

export interface GeneralPreparationItem {
  requirement: string;
  details: string | { url: string; title: string };
}

// Main data structure for the trip
export interface TripData {
  origin?: string;
  originCountry?: string;
  destination?: string;
  destinationCountry?: string;
  additionalCities?: string[];
  additionalCountries?: string[];
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  adults?: number;
  children?: number;
  pets?: number;
  petDetails?: { type: string; size: string }[];
  budget?: string;
  accommodation?: string;
  interests?: string[];
  additionalInfo?: string;
  draftId?: string;
  itinerary?: Itinerary;
  policyRequirements?: PolicyRequirementStep[];
  generalPreparation?: GeneralPreparationItem[];
  preDeparturePreparation?: Activity[];
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
            const activities = [...(dayItem.activities || []), activity];
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