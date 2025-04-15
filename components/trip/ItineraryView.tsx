'use client';

import { useState, useEffect } from 'react';
import { useTripStore } from '@/store/tripStore';
import * as Toast from '@radix-ui/react-toast';
import Chatbot from './Chatbot';
import { createClient } from '@/lib/supabase-client';
import Link from 'next/link';

interface ItineraryViewProps {
  session: any | null;
}

interface Activity {
  time: string;
  description: string;
  place_id: string;
}

interface ItineraryDay {
  day: number;
  date: string;
  city: string;
  activities: Activity[];
  preparation?: Array<{ requirement: string; details: string }>;
  travel?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { lat: number; lng: number };
}

interface Itinerary {
  days: ItineraryDay[];
}

export default function ItineraryView({ session }: ItineraryViewProps) {
  const { tripData, setTripData, clearTrip } = useTripStore();
  const [petPolicies, setPetPolicies] = useState<any[]>([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [openToast, setOpenToast] = useState(!session);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  const [addingActivity, setAddingActivity] = useState<number | null>(null);
  const [activityResults, setActivityResults] = useState<any[]>([]);
  const [vetModal, setVetModal] = useState<{ day: number; results: any[] } | null>(null);

  useEffect(() => {
    const fetchPetPolicies = async () => {
      const supabase = createClient();
      const countries = [
        tripData.origin,
        tripData.destination,
        ...tripData.additionalCities,
      ]
        .map((city: string) => {
          // Extract country from city (simplified; API call handled elsewhere)
          return city.split(',').pop()?.trim();
        })
        .filter(Boolean);

      const { data, error } = await supabase
        .from('pet_policies')
        .select('country_name, entry_requirements, quarantine_info, external_link')
        .in('country_name', countries);
      if (error) {
        console.error('Error fetching pet policies:', error);
      } else {
        setPetPolicies(data || []);
      }
    };
    fetchPetPolicies();
  }, [tripData]);

  const handleToggleDay = (day: number) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddActivity = async (day: number) => {
    setAddingActivity(day);
    try {
      const response = await fetch('/api/places/text-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `pet-friendly ${tripData.interests.join(' or ')} in ${
            tripData.itinerary?.days[day]?.city || tripData.destination
          }`,
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      const results = await response.json();
      setActivityResults(results);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivityResults([]);
    }
  };

  const handleSelectActivity = (day: number, activity: any) => {
    const updatedItinerary = { ...tripData.itinerary };
    updatedItinerary.days[day].activities = [
      ...(updatedItinerary.days[day].activities || []),
      {
        time: 'Custom',
        description: activity.name,
        place_id: activity.place_id,
      },
    ];
    updateTripData({ ...tripData, itinerary: updatedItinerary });
    setAddingActivity(null);
    setActivityResults([]);
  };

  const handleDeleteActivity = (day: number, activityIndex: number) => {
    const updatedItinerary = { ...tripData.itinerary };
    updatedItinerary.days[day].activities = updatedItinerary.days[day].activities.filter(
      (_: any, i: number) => i !== activityIndex
    );
    updateTripData({ ...tripData, itinerary: updatedItinerary });
  };

  const handleFindVets = async (day: number) => {
    try {
      const response = await fetch('/api/places/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: tripData.itinerary?.days[day]?.city || tripData.destination,
          type: 'veterinary_care',
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch vets');
      const results = await response.json();
      setVetModal({ day, results });
    } catch (error) {
      console.error('Error fetching vets:', error);
      setVetModal({ day, results: [] });
    }
  };

  const handleAddVet = (day: number, vet: any) => {
    const updatedItinerary = { ...tripData.itinerary };
    updatedItinerary.days[day].activities = [
      ...(updatedItinerary.days[day].activities || []),
      {
        time: 'Custom',
        description: `Vet: ${vet.name}`,
        place_id: vet.place_id,
      },
    ];
    updateTripData({ ...tripData, itinerary: updatedItinerary });
    setVetModal(null);
  };

  const handleSaveTrip = async () => {
    if (!session) {
      setOpenToast(true);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase
      .from('itineraries')
      .insert({ user_id: session.user.id, trip_data: tripData });
    if (error) {
      console.error('Error saving trip:', error);
    } else {
      // Clear draft after saving
      await supabase.from('draft_itineraries').delete().eq('user_id', session.user.id);
      clearTrip();
      sessionStorage.removeItem('tripData');
    }
  };

  const handleNewTrip = () => {
    clearTrip();
    sessionStorage.removeItem('tripData');
    if (session) {
      const supabase = createClient();
      supabase.from('draft_itineraries').delete().eq('user_id', session.user.id);
    }
  };

  const updateTripData = async (newData: any) => {
    setTripData(newData);
    if (session) {
      const supabase = createClient();
      await supabase
        .from('draft_itineraries')
        .upsert(
          { user_id: session.user.id, trip_data: newData, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    } else {
      sessionStorage.setItem('tripData', JSON.stringify(newData));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 relative">
      <Toast.Provider swipeDirection="right">
        <Toast.Root
          open={openToast}
          onOpenChange={setOpenToast}
          className="bg-white border border-teal-200 shadow-lg p-4 rounded-lg"
        >
          <Toast.Title className="text-teal-700 font-bold text-base">
            Save Your Trip
          </Toast.Title>
          <Toast.Description className="text-gray-600 text-sm">
            <Link href="/login" className="text-teal-500 hover:text-teal-700">
              Sign in
            </Link>{' '}
            to save your trip and access it later!
          </Toast.Description>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-0 right-0 p-6 w-[390px] max-w-[100vw]" />
      </Toast.Provider>

      <div className="sticky top-0 bg-white z-10 p-4 -mx-6 shadow">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <button
            onClick={handleNewTrip}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Create New Trip
          </button>
          <div className="flex gap-2">
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
              disabled
            >
              PDF
            </button>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
              disabled
            >
              Share
            </button>
            <button
              onClick={handleSaveTrip}
              className="bg-mustard-500 hover:bg-mustard-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Save Trip
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-black tracking-tight mb-4">Your Itinerary</h2>
        <div className="flex gap-4 mb-4 flex-wrap">
          {['Flights', 'Homes', 'Cars', 'Activities', 'Restaurants', 'Insurance'].map(
            (option) => (
              <button
                key={option}
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium opacity-50 cursor-not-allowed"
                disabled
              >
                {option}
              </button>
            )
          )}
        </div>

        {showChatbot && (
          <Chatbot
            tripData={tripData}
            onClose={() => setShowChatbot(false)}
            session={session}
          />
        )}
        <button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-4 right-4 bg-teal-500 hover:bg-teal-600 text-white rounded-full p-3 shadow-lg"
        >
          <span className="sr-only">Ask for Help</span>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5v-2a2 2 0 012-2h10a2 2 0 012 2v2h-4m-6 0h6"
            />
          </svg>
        </button>

        {tripData.itinerary?.days?.map((day: ItineraryDay, index: number) => (
          <div key={index} className="mb-4">
            <button
              onClick={() => handleToggleDay(index)}
              className="w-full text-left bg-white rounded-lg shadow p-4 flex justify-between items-center"
            >
              <h3 className="text-teal-700 font-bold text-2xl">
                Day {day.day}: {day.date}
              </h3>
              <svg
                className={`w-6 h-6 transform ${expandedDays.includes(index) ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedDays.includes(index) && (
              <div className="bg-gray-50 rounded-lg p-4 mt-2">
                {day.preparation && (
                  <div className="mb-4">
                    <h4 className="text-teal-700 font-bold text-lg">Preparation for Entry</h4>
                    <ul className="list-disc pl-5">
                      {day.preparation.map((item, idx) => (
                        <li key={idx} className="text-gray-700">
                          <strong>{item.requirement}:</strong>{' '}
                          {typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {day.travel && (
                  <p className="text-gray-700 mb-4">
                    <strong>Travel:</strong> {day.travel}
                  </p>
                )}
                {day.activities?.map((activity: Activity, actIndex: number) => (
                  <div key={actIndex} className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-gray-700">{activity.time}</p>
                      <p className="text-gray-700">{activity.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteActivity(index, actIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                <p className="text-teal-500">Hotel: Data unavailable</p>
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${
                    day.coordinates?.lng || 0
                  },${day.coordinates?.lat || 0},14,0/300x200?access_token=${
                    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                  }`}
                  alt={`Map for Day ${index + 1}`}
                  className="mt-2 rounded border border-gray-200 w-full md:w-[300px]"
                />
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleAddActivity(index)}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Add Activity
                  </button>
                  <button
                    onClick={() => handleFindVets(index)}
                    className="bg-mustard-500 hover:bg-mustard-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Find Nearby Vets
                  </button>
                </div>
                {addingActivity === index && activityResults.length > 0 && (
                  <div className="mt-2 bg-white border border-gray-300 rounded-lg shadow p-2">
                    {activityResults.map((result) => (
                      <button
                        key={result.place_id}
                        onClick={() => handleSelectActivity(index, result)}
                        className="block w-full text-left text-gray-700 hover:bg-teal-50 p-2"
                      >
                        {result.name} - {result.rating || 'N/A'} stars
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="mt-6">
          <h3 className="text-2xl font-bold text-black tracking-tight mb-4">Pet Policies</h3>
          {petPolicies.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              {petPolicies.map((policy) => (
                <div key={policy.country_name} className="mb-4">
                  <h4 className="text-teal-700 font-bold text-lg">{policy.country_name}</h4>
                  {policy.entry_requirements?.vaccinations?.length > 0 && (
                    <p className="text-gray-700 flex items-center">
                      <svg
                        className="w-5 h-5 text-teal-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Vaccinations: {policy.entry_requirements.vaccinations.join(', ')}
                    </p>
                  )}
                  {policy.entry_requirements?.microchip && (
                    <p className="text-gray-700 flex items-center">
                      <svg
                        className="w-5 h-5 text-teal-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Microchip required
                    </p>
                  )}
                  {policy.quarantine_info && (
                    <p className="text-gray-700">{policy.quarantine_info}</p>
                  )}
                  {policy.external_link && (
                    <a
                      href={policy.external_link}
                      className="text-teal-500 hover:text-teal-700 text-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      More Info
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No pet policies available for selected destinations.</p>
          )}
        </div>
      </div>

      {vetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-[90vw]">
            <h3 className="text-2xl font-bold text-black tracking-tight mb-4">
              Nearby Vets for Day {vetModal.day + 1}
            </h3>
            {vetModal.results.length > 0 ? (
              vetModal.results.map((vet) => (
                <div key={vet.place_id} className="mb-2">
                  <p className="text-gray-700">{vet.name} - {vet.rating || 'N/A'} stars</p>
                  <p className="text-gray-600 text-sm">{vet.vicinity}</p>
                  <button
                    onClick={() => handleAddVet(vetModal.day, vet)}
                    className="text-teal-500 hover:text-teal-700 text-sm"
                  >
                    Add to Itinerary
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-600">No vets found nearby.</p>
            )}
            <button
              onClick={() => setVetModal(null)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}