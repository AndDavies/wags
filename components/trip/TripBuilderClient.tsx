'use client';

import { useEffect, useState } from 'react';
import { useTripStore, TripData } from '@/store/tripStore';
import * as Toast from '@radix-ui/react-toast';
import TripCreationForm from './TripCreationForm';
import ItineraryView from './ItineraryView';
import DraftPromptModal from './DraftPromptModal';
import predefinedTrips from '@/data/predefined-trips';
import { createClient } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

export default function TripBuilderClient({
  session,
  initialDraft,
}: {
  session: { user: { id: string } } | null;
  initialDraft: any | null;
}) {
  const { tripData, setTripData, clearTrip } = useTripStore();
  const [openToast, setOpenToast] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(!!initialDraft);

  // Load draft from initialDraft (logged-in) or sessionStorage (guest)
  useEffect(() => {
    console.log('TripBuilderClient Mounting. Session:', !!session, 'InitialDraft:', !!initialDraft);
    let draftToLoad: TripData | null = null;

    if (initialDraft) {
      console.log('Found initialDraft (logged-in user)');
      draftToLoad = initialDraft;
    } else {
      const guestDraftString = sessionStorage.getItem('tripData');
      if (guestDraftString) {
        try {
          draftToLoad = JSON.parse(guestDraftString);
          console.log('Found guest draft from sessionStorage');
        } catch (e) {
          console.error("Failed to parse guest draft from sessionStorage:", e);
          sessionStorage.removeItem('tripData'); // Clear invalid data
        }
      } else {
         console.log('No initialDraft or guest draft found.');
      }
    }

    if (draftToLoad) {
        console.log('Processing loaded draft:', draftToLoad);
        setTripData(draftToLoad); // Set the data in the store

        if (draftToLoad.itinerary && draftToLoad.itinerary.days && draftToLoad.itinerary.days.length > 0) {
            // Draft exists AND has a generated itinerary
            console.log('Draft contains itinerary, showing modal.');
            setOpenToast(true); // Optional: Toast to indicate resumption
            setShowModal(true);
            setShowForm(false); // Ensure we don't show the form initially
        } else {
            // Draft exists BUT has no itinerary (incomplete generation?)
            console.log('Draft exists but no itinerary, going to form.');
            setShowModal(false); // Don't show the modal
            setShowForm(true); // Go directly to the form to complete
        }
    } else {
        // No draft exists
        console.log('No draft to load, showing landing page.');
        setShowModal(false);
        setShowForm(false);
    }

    // Cleanup function (optional, if needed)
    // return () => { console.log('TripBuilderClient Unmounting'); };

  }, [initialDraft, setTripData]); // Dependencies: only run on initial load based on draft

  // Real-time draft updates for logged-in users
  useEffect(() => {
    if (session) {
      const supabase = createClient();
      const channel = supabase
        .channel('draft_itineraries')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'draft_itineraries',
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            if (payload.new.trip_data) {
              setTripData(payload.new.trip_data);
              setOpenToast(true);
              setShowModal(true);
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, setTripData]);

  // Warn guests about unsaved changes
  useEffect(() => {
    if (!session) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (tripData && Object.keys(tripData).length > 0) {
          e.preventDefault();
          e.returnValue = '';
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [session, tripData]);

  const handleStartTrip = (predefinedTrip?: any) => {
    if (predefinedTrip) {
      setTripData({
        destination: predefinedTrip.destination,
        origin: undefined,
        originCountry: undefined,
        destinationCountry: undefined,
        additionalCities: predefinedTrip.additionalCities || [],
        budget: predefinedTrip.budget,
        accommodation: predefinedTrip.accommodation,
        interests: predefinedTrip.interests,
        startDate: undefined,
        endDate: undefined,
        adults: 1,
        children: 0,
        pets: 0,
        petDetails: [],
        additionalInfo: `Based on predefined trip: ${predefinedTrip.title}`,
        itinerary: undefined,
        policyRequirements: undefined,
        generalPreparation: undefined,
        preDeparturePreparation: undefined,
        draftId: undefined,
      });
    }
    setShowForm(true);
  };

  const handleNewTrip = () => {
    clearTrip();
    sessionStorage.removeItem('tripData');
    if (session) {
      const supabase = createClient();
      supabase.from('draft_itineraries').delete().eq('user_id', session.user.id);
    }
    setShowForm(true);
    setShowModal(false);
  };

  const handleViewItinerary = () => {
    setShowForm(false);
    setShowModal(false);
  };

  return (
    <div className="p-6 px-8 pt-20 md:pt-24">
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          open={openToast}
          onOpenChange={setOpenToast}
          duration={2000}
          className="bg-white border border-teal-200 shadow-md p-4 rounded-lg"
        >
          <Toast.Title className="text-teal-700 font-bold text-base">
            Trip Resumed
          </Toast.Title>
          <Toast.Description className="text-gray-600 text-sm">
            You have a trip in progress. Continue where you left off!
          </Toast.Description>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-0 right-0 p-6 w-[390px] max-w-[100vw]" />
      </Toast.Provider>

      {tripData?.itinerary && !showForm ? (
        <ItineraryView session={session} onBackToPlanning={() => setShowForm(true)} />
      ) : showForm ? (
        <TripCreationForm onClose={() => setShowForm(false)} session={session} />
      ) : (
        <div className="text-center pt-12 md:pt-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-tight mb-4 font-outfit">
            Plan Your Next Adventure with Your Pet!
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 tracking-tight max-w-xl mx-auto">
            Create a pet-friendly trip with ease. Let's get started!
          </p>
          <button
            onClick={handleNewTrip}
            className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-lg font-medium text-lg shadow-sm hover:shadow transition-all mb-12"
          >
            Create New Trip
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {predefinedTrips.map((trip) => (
              <div
                key={trip.id}
                className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col h-full"
              >
                <h2 className="text-2xl text-teal-700 font-bold mb-3 tracking-tight font-outfit">{trip.title}</h2>
                <p className="text-base text-gray-600 mb-5 flex-grow">{trip.description}</p>
                <button
                  onClick={() => handleStartTrip(trip)}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium w-full md:w-auto shadow-sm hover:shadow transition-all"
                >
                  Start Trip
                </button>
                <div className="absolute opacity-0 group-hover:opacity-100 bg-teal-50 p-2.5 rounded text-sm text-gray-700 -top-10 left-0 right-0 transition-opacity duration-300 shadow-sm">
                  {trip.duration}-day trip, pet-friendly {trip.accommodation.toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DraftPromptModal
        open={showModal}
        onOpenChange={setShowModal}
        onViewItinerary={handleViewItinerary}
        onStartNewTrip={handleNewTrip}
      />
    </div>
  );
}