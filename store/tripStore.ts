import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface TripState {
  tripData: any;
  setTripData: (data: any) => void;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      tripData: {},
      setTripData: (data) => set({ tripData: data }),
      clearTrip: () => set({ tripData: {} }),
    }),
    {
      name: 'tripData',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);